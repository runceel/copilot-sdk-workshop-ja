# ステップ 4: 外部ツールを安全に接続する

> **所要時間:** 20 分

## このステップで接続するもの

MCP 経由で Playwright を起動し、移動先を指定したワークショップの対象ページに限定します。
そのアクセシビリティツリーを調べ、ページタイトルを報告します。

## MCP とその信頼境界を理解する

[**Model Context Protocol (MCP)**](https://github.com/github/copilot-sdk/blob/main/docs/features/mcp.md)
は、アプリケーションの外部で実装された再利用可能な機能をエージェントに接続するための標準的な方法です。
このワークショップでは、SDK が Playwright MCP サーバーを独立した `npx` プロセスとして起動します。
Playwright がブラウザーの自動操作を担当し、アプリケーションが接続を構成します。

プロセスの境界は、**信頼境界**でもあります。
[権限ハンドラー](https://github.com/github/copilot-sdk/blob/main/docs/hooks/pre-tool-use.md)は、
要求された操作の実行前にランタイムが呼び出すコールバックで、
外部での各操作を許可するかどうかを判断します。

| 比較項目 | ローカルの WCAG ツール | Playwright MCP |
|---|---|---|
| 誰が実装するか | このアプリケーション | 外部の Playwright パッケージ |
| どこで実行されるか | アプリケーションと同じプロセス | 独立した Node.js プロセス |
| 何に適しているか | アプリケーションが管理するデータと決定的なロジック | 再利用可能なブラウザー機能 |
| ここでは信頼をどう扱うか | 読み取り専用ツールは権限確認を省略 | ツール一覧とカスタムハンドラーでアクセスを制限 |

WCAG 検索と機能を限定したスナップショットリーダーは、同じプロセス内で動作します。
`CopilotSession -> Playwright MCP -> browser` はプロセス境界を越えます。

## Playwright に安全策を設ける

ブラウザー引数では、ワークショップの既定である Microsoft Edge を使用します。
代わりに Google Chrome を用意した場合は、`--browser=chrome` を使用してください。

セッションのツール許可リストで、無関係なランタイムツールを除外します。MCP サーバーのツール一覧では、
ページ移動だけを公開します。Playwright MCP 0.0.78 では、ページ移動時に自動生成されたアクセシビリティツリーが
`.playwright-mcp/` に書き込まれます。アプリケーションのスナップショットリーダーは引数を受け取らず、
セッション開始後に作成された最新の Playwright スナップショットだけを読み取ります。

`browser_snapshot` は、省略可能な `filename` 引数でファイルを書き込めるため、
両方の許可リストから除外します。ランタイムは、読み取り専用と注釈された MCP ツールを
権限デリゲートを呼び出さずに自動承認できるため、ハンドラーではその引数を確実に無害化できません。
プロンプトに頼るのではなく、ツールを除外してその機能自体を使えなくします。

リーダーはパスを受け取りません。既存ファイル、サブディレクトリ内のファイル、シンボリックリンク、
空のファイル、1 MB を超えるスナップショットは無視します。ページ移動を承認するのは、正規化された
URL 全体が起動時に指定した対象と一致する場合だけです。スキームとホストは URL 標準に従って
大文字と小文字を区別せず比較し、パス、クエリ、フラグメントは大文字と小文字を区別して一致する必要があります。

ハンドラーはリクエストごとに必ず 1 つの判断を返します。ここでは、用意されている種類のうち 2 つを使います。
`approve-once` は今回のリクエストだけを許可します。`reject` は拒否し、モデルにフィードバックメッセージを
渡せるため、拒否された呼び出しは理由のわからない失敗ではなく、理由付きで返されます。
このワークショップでは扱わない状況に向けて、さらに 2 種類があります。`user-not-available` は
確認できるユーザーが不在のため拒否し、`no-result` は応答せず、接続されている別のクライアントに
応答を委ねます。より広い承認範囲である `approve-for-session`、
`approve-for-location`、`approve-permanently` は、今回の呼び出し以降も判断を保持します。
各 SDK では、それぞれの命名規則に従った名前を使います。

:::language dotnet
## C# で範囲を限定した Playwright アクセスを構成する

### 1. 管理された対象を 1 つ受け取る

`Program.cs` の先頭で、`using` 文の後、バナー表示の前に次を挿入します。

```csharp
if (args.Length is not 1 ||
    !Uri.TryCreate(args[0], UriKind.Absolute, out var targetUri) ||
    targetUri.Scheme is not ("http" or "https"))
{
    Console.Error.WriteLine("Usage: dotnet run -- <http-or-https-url>");
    return;
}
```

### 2. 用意されている権限ハンドラーを確認する

`Helpers/WorkshopPermissionHandler.cs` を開きます。用意されているハンドラーは、
対象と完全に一致するページ移動だけを一度限り承認します。それ以外の外部リクエストはすべて拒否します。

```csharp
public static Func<PermissionRequest, PermissionInvocation, Task<PermissionDecision>> CreateForTarget(
    Uri allowedTarget)
{
    ArgumentNullException.ThrowIfNull(allowedTarget);

    return (request, _) =>
    {
        var decision = request switch
        {
            PermissionRequestMcp { ServerName: "playwright" } navigation
                when IsPlaywrightTool(navigation, "browser_navigate") &&
                     IsNavigationToTarget(navigation.Args, allowedTarget) =>
                PermissionDecision.ApproveOnce(),
            _ => PermissionDecision.Reject(
                "This workshop allows Playwright to navigate only to the exact requested target.")
        };

        return Task.FromResult(decision);
    };
}
```

現在の .NET SDK では、MCP の権限リクエスト内のツール名にサーバー名が接頭辞として付きます
（例: `playwright-browser_navigate`）。一方、MCP の構成では `browser_navigate` を使用します。
`IsPlaywrightTool` は広い範囲に一致するワイルドカードではなく、この 2 つの形式だけを受け付けます。

> **SDK の補足:** バージョン 1.0.7 には `PermissionHandler.ApproveAll` が含まれますが、範囲を限定する組み込みハンドラーはありません。
> そのため、スターターには独自に記述したデリゲートが含まれています。現在、`PermissionDecision` は
> 評価用とされているため、このヘルパー内だけで `GHCP001` を抑制しています。

### 3. 用意されているスナップショットリーダーの境界を確認する

`Helpers/PlaywrightSnapshotReader.cs` を開きます。リーダーはツール作成時に既存のスナップショットを記録し、
モデルからの引数は受け取りません。対象ディレクトリ直下に新規作成された `page-*.yml` だけを選び、
シンボリックリンクとサイズ超過のファイルを除外してから、テキストを返します。

```csharp
public static AIFunction CreateTool(string workingDirectory)
{
    ArgumentException.ThrowIfNullOrWhiteSpace(workingDirectory);

    var outputDirectory = Path.GetFullPath(Path.Combine(workingDirectory, ".playwright-mcp"));
    var existingSnapshots = Directory.Exists(outputDirectory)
        ? Directory.EnumerateFiles(outputDirectory, "page-*.yml", SearchOption.TopDirectoryOnly)
            .Select(Path.GetFullPath)
            .ToHashSet(PathComparer)
        : new HashSet<string>(PathComparer);

    return CopilotTool.DefineTool(
        () => Task.FromResult(ReadLatestSnapshot(outputDirectory, existingSnapshots)),
        toolOptions: new CopilotToolOptions { SkipPermission = true },
        factoryOptions: new AIFunctionFactoryOptions
        {
            Name = "read_latest_accessibility_snapshot",
            Description = "Reads the newest Playwright accessibility snapshot created during this run."
        });
}
```

このアダプターは読み取り専用で、アプリケーションが選んだ保存先を使い、アプリケーション側で
実装されているため、権限確認を省略します。汎用的なファイルリーダーよりも機能範囲が限定されています。

### 4. Playwright MCP と範囲を限定した権限を追加する

セッションの構成を次の内容に置き換えます。

```csharp
var workingDirectory = Directory.GetCurrentDirectory();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Streaming = true,
    OnPermissionRequest = WorkshopPermissionHandler.CreateForTarget(targetUri),
    Tools =
    [
        AccessibilityRuleCatalog.CreateLookupTool(),
        PlaywrightSnapshotReader.CreateTool(workingDirectory)
    ],
    AvailableTools =
    [
        "accessibility_rule_lookup",
        "read_latest_accessibility_snapshot",
        "playwright-browser_navigate"
    ],
    McpServers = new Dictionary<string, McpServerConfig>
    {
        ["playwright"] = new McpStdioServerConfig
        {
            Command = "npx",
            Args = ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"],
            WorkingDirectory = workingDirectory,
            Tools = ["browser_navigate"]
        }
    }
});
```

### 5. ブラウザーから証拠を取得するよう依頼する

最後の送信呼び出しを置き換えます。

```csharp
Console.WriteLine($"\nInspecting: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(
    session,
    $"""
    Use browser_navigate to open {targetUri.AbsoluteUri}.
    Then use read_latest_accessibility_snapshot and report the page title
    plus one sentence describing its main content.
    """);
```

## 実行する

```bash
dotnet run -- "{{TARGET_APP_URL}}"
```

初回実行では、`npx` が Playwright を起動するまで時間がかかる場合があります。

次のような出力を確認します。

```text
[tool:start] playwright-browser_navigate
[tool:done] success=...
[tool:start] read_latest_accessibility_snapshot
[tool:done] success=True

Page title: Blazor Accessibility Target
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` に含まれていることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| 権限が拒否される | 上記の対象 URL を正確に使用します。ハンドラーは、それ以外の URL やツールを意図的に拒否します。 |
| 今回の実行で作成されたスナップショットがない | プロンプトの順序を維持し、`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| コンパイラーが権限ヘルパーを見つけられない | `using HelloCopilotSDK.Helpers;` があり、ヘルパーファイルがプロジェクトに含まれていることを確認します。 |

</details>

<details>
<summary>ステップ 4 の完成版の実装</summary>

作成したコードを、このステップ 4 の完成版の実装と比較してください。

```csharp
using GitHub.Copilot;
using HelloCopilotSDK.Helpers;

if (args.Length is not 1 ||
    !Uri.TryCreate(args[0], UriKind.Absolute, out var targetUri) ||
    targetUri.Scheme is not ("http" or "https"))
{
    Console.Error.WriteLine("Usage: dotnet run -- <http-or-https-url>");
    return;
}

Console.WriteLine("=== Scoped Playwright MCP access ===\n");

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"Connected to the Copilot runtime: {ping.Message}\n");

var workingDirectory = Directory.GetCurrentDirectory();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Streaming = true,
    OnPermissionRequest = WorkshopPermissionHandler.CreateForTarget(targetUri),
    Tools =
    [
        AccessibilityRuleCatalog.CreateLookupTool(),
        PlaywrightSnapshotReader.CreateTool(workingDirectory)
    ],
    AvailableTools =
    [
        "accessibility_rule_lookup",
        "read_latest_accessibility_snapshot",
        "playwright-browser_navigate"
    ],
    McpServers = new Dictionary<string, McpServerConfig>
    {
        ["playwright"] = new McpStdioServerConfig
        {
            Command = "npx",
            Args = ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"],
            WorkingDirectory = workingDirectory,
            Tools = ["browser_navigate"]
        }
    }
});

Console.WriteLine($"Inspecting: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(
    session,
    $"""
    Use browser_navigate to open {targetUri.AbsoluteUri}.
    Then use read_latest_accessibility_snapshot and return the page title
    plus one sentence describing its main content.
    """);
```

</details>
:::

:::language nodejs
## TypeScript で範囲を限定した Playwright アクセスを構成する

### 1. 管理された対象を 1 つ受け取る

`src/index.ts` の先頭にあるエントリーポイントの設定を次の内容に置き換えます。

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import {
  accessibilityRuleLookup,
  createSnapshotReader,
  permissionForTarget,
  streamResponse,
} from "./workshop.js";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm start -- <http-or-https-url>");
const target = new URL(input.includes("://") ? input : `https://${input}`);
if (!["http:", "https:"].includes(target.protocol)) {
  throw new Error("Enter an absolute HTTP or HTTPS URL.");
}
```

### 2. 用意されている権限ハンドラーを確認する

`src/workshop.ts` を開きます。用意されているハンドラーは、対象と完全に一致する Playwright のページ移動だけを承認します。

```typescript
export function permissionForTarget(target: URL): PermissionHandler {
  return (request) => {
    if (
      request.kind === "mcp" &&
      request.serverName === "playwright" &&
      (request.toolName === "browser_navigate" ||
        request.toolName === "playwright-browser_navigate") &&
      typeof request.args?.url === "string" &&
      sameUrl(request.args.url, target)
    ) {
      return { kind: "approve-once" };
    }
    return {
      kind: "reject",
      feedback:
        "This workshop allows Playwright to navigate only to the exact requested target.",
    };
  };
}

function sameUrl(requested: string, allowed: URL): boolean {
  try {
    const parsed = new URL(requested);
    return (
      parsed.protocol.toLowerCase() === allowed.protocol.toLowerCase() &&
      parsed.hostname.toLowerCase() === allowed.hostname.toLowerCase() &&
      parsed.port === allowed.port &&
      parsed.username === allowed.username &&
      parsed.password === allowed.password &&
      parsed.pathname === allowed.pathname &&
      parsed.search === allowed.search &&
      parsed.hash === allowed.hash
    );
  } catch {
    return false;
  }
}
```

ランタイムが権限リクエストにサーバー名を接頭辞として付ける場合があるため、
`browser_navigate` と `playwright-browser_navigate` の両方を受け付けます。

### 3. 用意されているスナップショットリーダーの境界を確認する

同じ `src/workshop.ts` にあるスナップショットリーダーは、作成時に既存のファイルを記録し、
モデルから指定されたパスは受け取りません。

```typescript
export function createSnapshotReader(workingDirectory: string) {
  const outputDirectory = resolve(workingDirectory, ".playwright-mcp");
  const existingSnapshots = safeSnapshotNames(outputDirectory).then(
    (names) => new Set(names.map((name) => resolve(outputDirectory, name))),
  );
  return defineTool("read_latest_accessibility_snapshot", {
    description:
      "Reads the newest Playwright accessibility snapshot created during this run.",
    parameters: z.object({}),
    skipPermission: true,
    handler: async () => {
      const baseline = await existingSnapshots;
      const candidates = await Promise.all(
        (await safeSnapshotNames(outputDirectory)).map(async (name) => {
          const path = resolve(outputDirectory, name);
          const details = await lstat(path);
          return { path, details };
        }),
      );
      const snapshot = candidates
        .filter(
          ({ path, details }) =>
            !baseline.has(path) &&
            !details.isSymbolicLink() &&
            details.isFile() &&
            details.size > 0 &&
            details.size <= maxSnapshotBytes,
        )
        .sort((left, right) => right.details.mtimeMs - left.details.mtimeMs)[0];
      if (!snapshot) {
        throw new Error(
          "No current-run Playwright snapshot is available. Call browser_navigate first.",
        );
      }
      return readFile(snapshot.path, "utf8");
    },
  });
}
```

### 4. Playwright MCP と範囲を限定した権限を追加する

`src/index.ts` で、3 つのツールの許可リストと Playwright MCP を使ってセッションを作成します。

```typescript
const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({
    streaming: true,
    onPermissionRequest: permissionForTarget(target),
    tools: [accessibilityRuleLookup, createSnapshotReader(process.cwd())],
    availableTools: [
      "accessibility_rule_lookup",
      "read_latest_accessibility_snapshot",
      "playwright-browser_navigate",
    ],
    mcpServers: {
      playwright: {
        command: "npx",
        args: ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"],
        workingDirectory: process.cwd(),
        tools: ["browser_navigate"],
      },
    },
  });
  try {
    await streamResponse(
      session,
      `Use browser_navigate to open ${target.href}, then read_latest_accessibility_snapshot and report the page title.`,
    );
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```

`availableTools` では、ランタイムが接頭辞を付けた MCP 名 `playwright-browser_navigate` を使用します。
一方、MCP サーバーの構成では、引き続き接頭辞のない `browser_navigate` を指定します。

## 実行する

```bash
npm start -- "{{TARGET_APP_URL}}"
```

初回実行では、`npx` が Playwright を起動するまで時間がかかる場合があります。

次のような出力を確認します。

```text
[tool:start] playwright-browser_navigate
[tool:done] success=...
[tool:start] read_latest_accessibility_snapshot
[tool:done] success=true

Page title: Blazor Accessibility Target
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` に含まれていることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| 権限が拒否される | 上記の対象 URL を正確に使用します。ハンドラーは、それ以外の URL やツールを意図的に拒否します。 |
| 今回の実行で作成されたスナップショットがない | プロンプトの順序を維持し、`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| TypeScript がヘルパーを解決できない | インポートパスの末尾が `.js` であることを確認し、スターターディレクトリで `npm install` を実行します。 |

</details>

<details>
<summary>ステップ 4 の完成版の実装</summary>

作成したコードを、このステップ 4 の完成版の実装と比較してください。

`src/index.ts`:

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import { accessibilityRuleLookup, createSnapshotReader, permissionForTarget, streamResponse } from "./workshop.js";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm start -- <http-or-https-url>");
const target = new URL(input.includes("://") ? input : `https://${input}`);
if (!["http:", "https:"].includes(target.protocol)) throw new Error("Enter an absolute HTTP or HTTPS URL.");
const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({
    streaming: true,
    onPermissionRequest: permissionForTarget(target),
    tools: [accessibilityRuleLookup, createSnapshotReader(process.cwd())],
    availableTools: ["accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"],
    mcpServers: { playwright: { command: "npx", args: ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"], workingDirectory: process.cwd(), tools: ["browser_navigate"] } },
  });
  try {
    await streamResponse(session, `Use browser_navigate to open ${target.href}, then read_latest_accessibility_snapshot and report the page title.`);
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```

</details>
:::

:::language python
## Python で範囲を限定した Playwright アクセスを構成する

### 1. 管理された対象を 1 つ受け取る

`main.py` の先頭で、起動時の URL を検証します。

```python
import asyncio
import sys
from urllib.parse import urlsplit

from copilot import CopilotClient
from copilot.session_events import (
    AssistantMessageData,
    AssistantMessageDeltaData,
    SessionErrorData,
    SessionIdleData,
)

from workshop import (
    accessibility_rule_lookup,
    create_snapshot_reader,
    permission_for_target,
)


async def main() -> None:
    if len(sys.argv) != 2:
        raise ValueError("Usage: python main.py <http-or-https-url>")
    target = sys.argv[1]
    if urlsplit(target).scheme not in {"http", "https"}:
        raise ValueError("Enter an absolute HTTP or HTTPS URL.")
```

### 2. 用意されている権限ハンドラーを確認する

`workshop.py` を開きます。用意されているハンドラーは、対象と完全に一致する Playwright のページ移動だけを承認します。

```python
def permission_for_target(target: str):
    def handler(request, _invocation):
        if (
            getattr(request, "kind", None) == "mcp"
            and request.server_name == "playwright"
            and request.tool_name
            in {"browser_navigate", "playwright-browser_navigate"}
            and isinstance(request.args, dict)
            and isinstance(request.args.get("url"), str)
            and _same_url(request.args["url"], target)
        ):
            return PermissionDecisionApproveOnce()
        return PermissionDecisionReject(
            feedback=(
                "This workshop allows Playwright to navigate only to the exact requested target."
            )
        )

    return handler


def _same_url(requested: str, allowed: str) -> bool:
    try:
        left, right = urlsplit(requested), urlsplit(allowed)
        return (
            left.scheme.lower(),
            left.hostname.lower() if left.hostname else "",
            left.port,
            left.username,
            left.password,
            left.path,
            left.query,
            left.fragment,
        ) == (
            right.scheme.lower(),
            right.hostname.lower() if right.hostname else "",
            right.port,
            right.username,
            right.password,
            right.path,
            right.query,
            right.fragment,
        )
    except ValueError:
        return False
```

### 3. 用意されているスナップショットリーダーの境界を確認する

同じ `workshop.py` にあるスナップショットリーダーは、作成時に既存のファイルを記録し、
モデルから指定されたパスは受け取りません。

```python
def create_snapshot_reader(working_directory: str):
    output_directory = Path(working_directory, ".playwright-mcp").resolve()
    existing = (
        {path.resolve() for path in output_directory.glob("page-*.yml")}
        if output_directory.is_dir()
        else set()
    )

    @define_tool(
        name="read_latest_accessibility_snapshot",
        description=(
            "Reads the newest Playwright accessibility snapshot created during this run."
        ),
        skip_permission=True,
    )
    def read_latest_accessibility_snapshot() -> str:
        candidates = [
            path
            for path in output_directory.glob("page-*.yml")
            if path.resolve() not in existing
            and not path.is_symlink()
            and path.is_file()
            and 0 < path.stat().st_size <= MAX_SNAPSHOT_BYTES
        ]
        if not candidates:
            raise FileNotFoundError(
                "No current-run Playwright snapshot is available. Call browser_navigate first."
            )
        return max(candidates, key=lambda path: path.stat().st_mtime).read_text(
            encoding="utf-8"
        )

    return read_latest_accessibility_snapshot
```

### 4. Playwright MCP と範囲を限定した権限を追加する

`main.py` のセッション作成ブロックを置き換えます。

```python
    async with CopilotClient() as client:
        async with await client.create_session(
            streaming=True,
            on_permission_request=permission_for_target(target),
            tools=[accessibility_rule_lookup, create_snapshot_reader(".")],
            available_tools=[
                "accessibility_rule_lookup",
                "read_latest_accessibility_snapshot",
                "playwright-browser_navigate",
            ],
            mcp_servers={
                "playwright": {
                    "command": "npx",
                    "args": ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"],
                    "working_directory": ".",
                    "tools": ["browser_navigate"],
                }
            },
        ) as session:
            done = asyncio.Event()
            error: RuntimeError | None = None
            received_delta = False

            def on_event(event) -> None:
                nonlocal error, received_delta
                match event.data:
                    case AssistantMessageDeltaData(delta_content=delta) if delta:
                        received_delta = True
                        print(delta, end="", flush=True)
                    case AssistantMessageData(content=content) if content and not received_delta:
                        print(content)
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData():
                        done.set()

            session.on(on_event)
            await session.send(
                f"Use browser_navigate to open {target}, then "
                "read_latest_accessibility_snapshot and report the page title."
            )
            await done.wait()
            if error is not None:
                raise error
```

`available_tools` では、ランタイムが接頭辞を付けた MCP 名 `playwright-browser_navigate` を使用します。
一方、MCP サーバーの構成では、引き続き接頭辞のない `browser_navigate` を指定します。

## 実行する

```bash
python main.py "{{TARGET_APP_URL}}"
```

初回実行では、`npx` が Playwright を起動するまで時間がかかる場合があります。

ページ移動とスナップショットの処理に続いて、次のようなページタイトルが表示されることを確認します。

```text
Page title: Blazor Accessibility Target
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` に含まれていることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| 権限が拒否される | 上記の対象 URL を正確に使用します。ハンドラーは、それ以外の URL やツールを意図的に拒否します。 |
| 今回の実行で作成されたスナップショットがない | プロンプトの順序を維持し、`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| ワークショップのヘルパーのインポートエラー | 事前準備で作成した仮想環境を有効にし、`workshop.py` が `main.py` と同じ場所にあることを確認します。 |

</details>

<details>
<summary>ステップ 4 の完成版の実装</summary>

作成したコードを、このステップ 4 の完成版の実装と比較してください。

`main.py`:

```python
import asyncio
import sys
from urllib.parse import urlsplit

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, AssistantMessageDeltaData, SessionErrorData, SessionIdleData

from workshop import accessibility_rule_lookup, create_snapshot_reader, permission_for_target


async def main() -> None:
    if len(sys.argv) != 2:
        raise ValueError("Usage: python main.py <http-or-https-url>")
    target = sys.argv[1]
    if urlsplit(target).scheme not in {"http", "https"}:
        raise ValueError("Enter an absolute HTTP or HTTPS URL.")
    async with CopilotClient() as client:
        async with await client.create_session(
            streaming=True,
            on_permission_request=permission_for_target(target),
            tools=[accessibility_rule_lookup, create_snapshot_reader(".")],
            available_tools=["accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"],
            mcp_servers={"playwright": {"command": "npx", "args": ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"], "working_directory": ".", "tools": ["browser_navigate"]}},
        ) as session:
            done = asyncio.Event()
            error: RuntimeError | None = None
            received_delta = False

            def on_event(event) -> None:
                nonlocal error, received_delta
                match event.data:
                    case AssistantMessageDeltaData(delta_content=delta) if delta:
                        received_delta = True
                        print(delta, end="", flush=True)
                    case AssistantMessageData(content=content) if content and not received_delta:
                        print(content)
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData():
                        done.set()

            session.on(on_event)
            await session.send(f"Use browser_navigate to open {target}, then read_latest_accessibility_snapshot and report the page title.")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

</details>
:::

:::language go
## Go で範囲を限定した Playwright アクセスを構成する

### 1. 管理された対象を 1 つ受け取る

`main.go` の `main` の冒頭で、起動時の URL を検証します。

```go
if len(os.Args) != 2 {
	fmt.Fprintln(os.Stderr, "Usage: go run . <http-or-https-url>")
	return
}
target := os.Args[1]
if !strings.Contains(target, "://") {
	target = "https://" + target
}
parsed, err := url.ParseRequestURI(target)
if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
	fmt.Fprintln(os.Stderr, "Enter an absolute HTTP or HTTPS URL.")
	return
}
```

### 2. 権限ハンドラーを追加する

`main` の前に、URL の完全一致判定と権限ハンドラーを追加します。

```go
func sameURL(requested, allowed string) bool {
	left, leftErr := url.Parse(requested)
	right, rightErr := url.Parse(allowed)
	userInfo := func(value *url.Userinfo) string {
		if value == nil {
			return ""
		}
		return value.String()
	}
	return leftErr == nil && rightErr == nil &&
		strings.EqualFold(left.Scheme, right.Scheme) &&
		strings.EqualFold(left.Hostname(), right.Hostname()) &&
		left.Port() == right.Port() &&
		userInfo(left.User) == userInfo(right.User) &&
		left.EscapedPath() == right.EscapedPath() &&
		left.RawQuery == right.RawQuery &&
		left.Fragment == right.Fragment
}

func permissionForTarget(target string) copilot.PermissionHandlerFunc {
	return func(request copilot.PermissionRequest, _ copilot.PermissionInvocation) (rpc.PermissionDecision, error) {
		raw, _ := json.Marshal(request)
		var value map[string]any
		if json.Unmarshal(raw, &value) == nil && value["kind"] == "mcp" && value["serverName"] == "playwright" {
			toolName, _ := value["toolName"].(string)
			args, _ := value["args"].(map[string]any)
			requested, _ := args["url"].(string)
			if (toolName == "browser_navigate" || toolName == "playwright-browser_navigate") && sameURL(requested, target) {
				return &rpc.PermissionDecisionApproveOnce{}, nil
			}
		}
		feedback := "This workshop allows Playwright to navigate only to the exact requested target."
		return &rpc.PermissionDecisionReject{Feedback: &feedback}, nil
	}
}
```

権限確認では、接頭辞のない Playwright ツール名と接頭辞付きのツール名の両方を受け付けます。

### 3. スナップショットリーダーの境界を追加する

同じく `main` の前に、引数を取らないスナップショットリーダーを追加します。

```go
const maxSnapshotBytes = 1_000_000

func snapshotReader(workingDirectory string) func(struct{}, copilot.ToolInvocation) (string, error) {
	outputDirectory := filepath.Join(workingDirectory, ".playwright-mcp")
	existing := map[string]struct{}{}
	if entries, err := os.ReadDir(outputDirectory); err == nil {
		for _, entry := range entries {
			if strings.HasPrefix(entry.Name(), "page-") && strings.HasSuffix(entry.Name(), ".yml") {
				existing[filepath.Join(outputDirectory, entry.Name())] = struct{}{}
			}
		}
	}

	return func(_ struct{}, _ copilot.ToolInvocation) (string, error) {
		entries, err := os.ReadDir(outputDirectory)
		if err != nil {
			return "", fmt.Errorf("No current-run Playwright snapshot is available. Call browser_navigate first.")
		}
		type candidate struct {
			path string
			mod  time.Time
		}
		var candidates []candidate
		for _, entry := range entries {
			path := filepath.Join(outputDirectory, entry.Name())
			info, err := entry.Info()
			if _, existed := existing[path]; existed || err != nil || entry.IsDir() ||
				entry.Type()&os.ModeSymlink != 0 || !info.Mode().IsRegular() ||
				info.Size() == 0 || info.Size() > maxSnapshotBytes ||
				!strings.HasPrefix(entry.Name(), "page-") || !strings.HasSuffix(entry.Name(), ".yml") {
				continue
			}
			candidates = append(candidates, candidate{path, info.ModTime()})
		}
		if len(candidates) == 0 {
			return "", fmt.Errorf("No current-run Playwright snapshot is available. Call browser_navigate first.")
		}
		sort.Slice(candidates, func(i, j int) bool { return candidates[i].mod.Before(candidates[j].mod) })
		contents, err := os.ReadFile(candidates[len(candidates)-1].path)
		return string(contents), err
	}
}
```

### 4. Playwright MCP と範囲を限定した権限を追加する

`main` 内で両方のローカルツールを定義し、セッションの構成を置き換えます。

```go
workingDirectory, err := os.Getwd()
if err != nil {
	panic(err)
}
lookup := copilot.DefineTool("accessibility_rule_lookup", "Looks up read-only WCAG guidance maintained by this application.", accessibilityRuleLookup)
lookup.SkipPermission = true
readSnapshot := copilot.DefineTool("read_latest_accessibility_snapshot", "Reads the newest Playwright accessibility snapshot created during this run.", snapshotReader(workingDirectory))
readSnapshot.SkipPermission = true

client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
if err := client.Start(context.Background()); err != nil {
	panic(err)
}
defer client.Stop()
session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
	Streaming:           copilot.Bool(true),
	Tools:               []copilot.Tool{lookup, readSnapshot},
	AvailableTools:      []string{"accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"},
	OnPermissionRequest: permissionForTarget(target),
	MCPServers: map[string]copilot.MCPServerConfig{
		"playwright": copilot.MCPStdioServerConfig{
			Command:          "npx",
			Args:             []string{"-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"},
			WorkingDirectory: workingDirectory,
			Tools:            []string{"browser_navigate"},
		},
	},
})
if err != nil {
	panic(err)
}
defer session.Disconnect()
if err := streamResponse(session, fmt.Sprintf("Use browser_navigate to open %s, then read_latest_accessibility_snapshot and report the page title.", target)); err != nil {
	panic(err)
}
```

新しいヘルパーで使用するインポートを追加します。`encoding/json`、`net/url`、`path/filepath`、`sort`、
`time`、`"github.com/github/copilot-sdk/go/rpc"` です。

## 実行する

```bash
go run . "{{TARGET_APP_URL}}"
```

初回実行では、`npx` が Playwright を起動するまで時間がかかる場合があります。

次のようなページタイトルが表示されることを確認します。

```text
Page title: Blazor Accessibility Target
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` に含まれていることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| 権限が拒否される | 上記の対象 URL を正確に使用します。ハンドラーは、それ以外の URL やツールを意図的に拒否します。 |
| 今回の実行で作成されたスナップショットがない | プロンプトの順序を維持し、`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| インポートが不足している | `encoding/json`、`net/url`、`path/filepath`、`sort`、`time`、`rpc` パッケージを追加します。 |

</details>

<details>
<summary>ステップ 4 の完成版の実装</summary>

作成したコードを、このステップ 4 の完成版の実装と比較してください。

`main.go` のセッション構成:

```go
workingDirectory, err := os.Getwd()
if err != nil {
	panic(err)
}
lookup := copilot.DefineTool("accessibility_rule_lookup", "Looks up read-only WCAG guidance maintained by this application.", accessibilityRuleLookup)
lookup.SkipPermission = true
readSnapshot := copilot.DefineTool("read_latest_accessibility_snapshot", "Reads the newest Playwright accessibility snapshot created during this run.", snapshotReader(workingDirectory))
readSnapshot.SkipPermission = true

client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
if err := client.Start(context.Background()); err != nil {
	panic(err)
}
defer client.Stop()
session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
	Streaming:           copilot.Bool(true),
	Tools:               []copilot.Tool{lookup, readSnapshot},
	AvailableTools:      []string{"accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"},
	OnPermissionRequest: permissionForTarget(target),
	MCPServers: map[string]copilot.MCPServerConfig{
		"playwright": copilot.MCPStdioServerConfig{
			Command:          "npx",
			Args:             []string{"-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"},
			WorkingDirectory: workingDirectory,
			Tools:            []string{"browser_navigate"},
		},
	},
})
if err != nil {
	panic(err)
}
defer session.Disconnect()
if err := streamResponse(session, fmt.Sprintf("Use browser_navigate to open %s, then read_latest_accessibility_snapshot and report the page title.", target)); err != nil {
	panic(err)
}
```

</details>
:::

:::language rust
## Rust で範囲を限定した Playwright アクセスを構成する

### 1. 管理された対象を 1 つ受け取る

`src/main.rs` の `main` の冒頭で、起動時の URL を検証します。

```rust
let argument = std::env::args()
    .nth(1)
    .ok_or("Usage: cargo run -- <http-or-https-url>")?;
let target_text = if argument.contains("://") {
    argument
} else {
    format!("https://{argument}")
};
let target = Url::parse(&target_text)?;
if !matches!(target.scheme(), "http" | "https") || target.host_str().is_none() {
    return Err("Enter an absolute HTTP or HTTPS URL.".into());
}
```

### 2. 権限ハンドラーを追加する

`main` の前に、対象との完全一致を確認する権限ハンドラーを追加します。

```rust
struct ScopedPermissions {
    target: Url,
}

fn permission_payload(
    extra: &serde_json::Value,
) -> Option<&serde_json::Map<String, serde_json::Value>> {
    match extra.get("permissionRequest") {
        Some(request) => request.as_object(),
        None => extra.as_object(),
    }
}

#[async_trait]
impl PermissionHandler for ScopedPermissions {
    async fn handle(
        &self,
        _session_id: SessionId,
        _request_id: RequestId,
        request: PermissionRequestData,
    ) -> PermissionResult {
        let payload = permission_payload(&request.extra);
        let server = payload
            .and_then(|payload| payload.get("serverName"))
            .and_then(serde_json::Value::as_str);
        let tool = payload
            .and_then(|payload| payload.get("toolName"))
            .and_then(serde_json::Value::as_str);
        let requested = payload
            .and_then(|payload| payload.get("args"))
            .and_then(|args| args.get("url"))
            .and_then(serde_json::Value::as_str)
            .and_then(|value| Url::parse(value).ok());
        if server == Some("playwright")
            && matches!(
                tool,
                Some("browser_navigate" | "playwright-browser_navigate")
            )
            && requested
                .as_ref()
                .is_some_and(|url| same_url(url, &self.target))
        {
            PermissionResult::approve_once()
        } else {
            PermissionResult::reject(Some(
                "This workshop allows Playwright to navigate only to the exact requested target."
                    .to_owned(),
            ))
        }
    }
}

fn same_url(left: &Url, right: &Url) -> bool {
    left.scheme().eq_ignore_ascii_case(right.scheme())
        && left
            .host_str()
            .unwrap_or_default()
            .eq_ignore_ascii_case(right.host_str().unwrap_or_default())
        && left.port() == right.port()
        && left.username() == right.username()
        && left.password() == right.password()
        && left.path() == right.path()
        && left.query() == right.query()
        && left.fragment() == right.fragment()
}
```

### 3. スナップショットリーダーの境界を追加する

`main` の前に、引数を取らないスナップショットリーダーを追加します。

```rust
const MAX_SNAPSHOT_BYTES: u64 = 1_000_000;

struct SnapshotReader {
    output_directory: PathBuf,
    existing: HashSet<PathBuf>,
}

impl SnapshotReader {
    fn new(working_directory: &Path) -> Self {
        let output_directory = working_directory.join(".playwright-mcp");
        let existing = std::fs::read_dir(&output_directory)
            .into_iter()
            .flatten()
            .flatten()
            .filter_map(|entry| {
                let name = entry.file_name();
                let name = name.to_string_lossy();
                (name.starts_with("page-") && name.ends_with(".yml")).then(|| entry.path())
            })
            .collect();
        Self {
            output_directory,
            existing,
        }
    }
}

#[async_trait]
impl ToolHandler for SnapshotReader {
    async fn call(&self, _invocation: ToolInvocation) -> Result<ToolResult, Error> {
        let entries =
            match std::fs::read_dir(&self.output_directory) {
                Ok(entries) => entries,
                Err(_) => return Ok(ToolResult::Text(
                    "No current-run Playwright snapshot is available. Call browser_navigate first."
                        .to_owned(),
                )),
            };
        let newest = entries
            .flatten()
            .filter_map(|entry| {
                let path = entry.path();
                let name = entry.file_name();
                let name = name.to_string_lossy();
                let metadata = std::fs::symlink_metadata(&path).ok()?;
                (!self.existing.contains(&path)
                    && name.starts_with("page-")
                    && name.ends_with(".yml")
                    && !metadata.file_type().is_symlink()
                    && metadata.is_file()
                    && metadata.len() > 0
                    && metadata.len() <= MAX_SNAPSHOT_BYTES)
                    .then_some((metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH), path))
            })
            .max_by_key(|(modified, _)| *modified);
        let Some((_, path)) = newest else {
            return Ok(ToolResult::Text(
                "No current-run Playwright snapshot is available. Call browser_navigate first."
                    .to_owned(),
            ));
        };
        match std::fs::read_to_string(path) {
            Ok(contents) => Ok(ToolResult::Text(contents)),
            Err(_) => Ok(ToolResult::Text(
                "The current-run Playwright snapshot could not be read.".to_owned(),
            )),
        }
    }
}
```

### 4. Playwright MCP と範囲を限定した権限を追加する

`main` 内で両方のローカルツールを定義し、MCP を構成して、権限ハンドラーを設定します。

```rust
let working_directory = std::env::current_dir()?;
let lookup = Tool::new("accessibility_rule_lookup")
    .with_description("Looks up read-only WCAG guidance maintained by this application.")
    .with_parameters(schema_for::<LookupParams>())
    .with_skip_permission(true)
    .with_handler(Arc::new(AccessibilityRuleLookup));
let reader = Tool::new("read_latest_accessibility_snapshot")
    .with_description(
        "Reads the newest Playwright accessibility snapshot created during this run.",
    )
    .with_parameters(
        serde_json::json!({"type": "object", "properties": {}, "additionalProperties": false}),
    )
    .with_skip_permission(true)
    .with_handler(Arc::new(SnapshotReader::new(&working_directory)));

let mut config = SessionConfig::default();
config.streaming = Some(true);
config.tools = Some(vec![lookup, reader]);
config.available_tools = Some(vec![
    "accessibility_rule_lookup".to_owned(),
    "read_latest_accessibility_snapshot".to_owned(),
    "playwright-browser_navigate".to_owned(),
]);
config.mcp_servers = Some(IndexMap::from([(
    "playwright".to_owned(),
    McpServerConfig::Stdio(McpStdioServerConfig {
        command: "npx".to_owned(),
        args: vec![
            "-y".to_owned(),
            "@playwright/mcp@0.0.78".to_owned(),
            "--browser=msedge".to_owned(),
            "--output-dir".to_owned(),
            ".playwright-mcp".to_owned(),
            "--output-mode".to_owned(),
            "file".to_owned(),
        ],
        tools: Some(vec!["browser_navigate".to_owned()]),
        working_directory: Some(working_directory.display().to_string()),
        ..Default::default()
    }),
)]));
let config = config.with_permission_handler(Arc::new(ScopedPermissions {
    target: target.clone(),
}));

let client = Client::start(ClientOptions::default()).await?;
let session = client.create_session(config).await?;
stream_response!(
    session,
    format!(
        "Use browser_navigate to open {target}, then read_latest_accessibility_snapshot and report the page title."
    )
);
session.disconnect().await?;
client.stop().await?;
```

新しいヘルパーで使用するインポートを追加します。
`github_copilot_sdk::handler::{PermissionHandler, PermissionResult}`,
`McpServerConfig`, `McpStdioServerConfig`, `PermissionRequestData`, `PermissionRequestKind`,
`RequestId`, `SessionId`, `indexmap::IndexMap`、`url::Url` などです。

## 実行する

```bash
cargo run -- "{{TARGET_APP_URL}}"
```

初回実行では、`npx` が Playwright を起動するまで時間がかかる場合があります。

次のようなページタイトルが表示されることを確認します。

```text
Page title: Blazor Accessibility Target
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` に含まれていることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| 権限が拒否される | 上記の対象 URL を正確に使用します。ハンドラーは、それ以外の URL やツールを意図的に拒否します。 |
| 今回の実行で作成されたスナップショットがない | プロンプトの順序を維持し、`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| トレイトや型を解決できない | 上記の権限、MCP、`IndexMap`、`Url` のインポートを維持します。 |

</details>

<details>
<summary>ステップ 4 の完成版の実装</summary>

作成したコードを、このステップ 4 の完成版の実装と比較してください。

`src/main.rs` のセッション構成:

```rust
let mut config = SessionConfig::default();
config.streaming = Some(true);
config.tools = Some(vec![lookup, reader]);
config.available_tools = Some(vec![
    "accessibility_rule_lookup".to_owned(),
    "read_latest_accessibility_snapshot".to_owned(),
    "playwright-browser_navigate".to_owned(),
]);
config.mcp_servers = Some(IndexMap::from([(
    "playwright".to_owned(),
    McpServerConfig::Stdio(McpStdioServerConfig {
        command: "npx".to_owned(),
        args: vec![
            "-y".to_owned(),
            "@playwright/mcp@0.0.78".to_owned(),
            "--browser=msedge".to_owned(),
            "--output-dir".to_owned(),
            ".playwright-mcp".to_owned(),
            "--output-mode".to_owned(),
            "file".to_owned(),
        ],
        tools: Some(vec!["browser_navigate".to_owned()]),
        working_directory: Some(working_directory.display().to_string()),
        ..Default::default()
    }),
)]));
let config = config.with_permission_handler(Arc::new(ScopedPermissions {
    target: target.clone(),
}));

let client = Client::start(ClientOptions::default()).await?;
let session = client.create_session(config).await?;
stream_response!(session, mcp_safety_prompt(&target));
```

</details>
:::

:::language java
## Java で範囲を限定した Playwright アクセスを構成する

### 1. 管理された対象を 1 つ受け取る

`src/main/java/workshop/AccessibilityReport.java` の
`main` の冒頭で、起動時の URL を検証します。

```java
RunOptions options = parseRunOptions(args);
URI target = options.target();
Path workingDirectory = Path.of("").toAbsolutePath().normalize();
if (options.allowLocalDemoMcp()) {
    System.err.println("WARNING: Local demo fallback enabled. MCP request payload fields are unavailable, "
            + "so this run approves only the mcp permission kind, not an exact target. "
            + "Use only with the controlled workshop target.");
}
```

解析用のヘルパーを追加します。

```java
private static URI parseTarget(String value) throws URISyntaxException {
    String candidate = value.contains("://") ? value : "https://" + value;
    URI target = new URI(candidate);
    if (!target.isAbsolute()
            || target.getHost() == null
            || !("http".equalsIgnoreCase(target.getScheme())
                    || "https".equalsIgnoreCase(target.getScheme()))) {
        throw new IllegalArgumentException("Enter an absolute HTTP or HTTPS URL.");
    }
    return target;
}
```

### 2. 権限ハンドラーを追加する

セッションの構成で、対象と完全に一致する Playwright のページ移動だけを承認します。

```java
.setOnPermissionRequest((request, ignored) -> {
    if ("mcp".equals(request.getKind())
            && isExactNavigation(request.getExtensionData(), target)) {
        return java.util.concurrent.CompletableFuture.completedFuture(
                PermissionRequestResult.approveOnce());
    }
    // SDK issue #2273 currently prevents inspecting MCP request fields for the exact check.
    if (options.allowLocalDemoMcp() && "mcp".equals(request.getKind())) {
        return java.util.concurrent.CompletableFuture.completedFuture(
                PermissionRequestResult.approveOnce());
    }
    return java.util.concurrent.CompletableFuture.completedFuture(
            PermissionRequestResult.reject(
                    "This workshop allows Playwright to navigate only to the exact requested target. "
                            + "MCP requests without target data remain denied unless the explicit "
                            + LOCAL_DEMO_MCP_FLAG + " local-demo fallback is enabled."));
})
```

> **Java SDK の一時的な制限とローカルデモ用の代替手段:** 既定では、安全を確認できなければ拒否するフェイルクローズ方式です。
> 構成された Playwright の移動先が入力された URL と完全に一致するとペイロードから確認できる `mcp` リクエストだけを承認します。
> 現在の Java SDK リリースでは、これらの MCP リクエストフィールドが公開されていないため
> （[github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273)）、
> 既定の処理では推測せずにリクエストを拒否します。管理されたワークショップの対象に限り、
> `--allow-local-demo-mcp` を指定できます。この明示的なフラグは `mcp` リクエストを 1 件ずつ承認します。
> `APPROVE_ALL` は**使用せず**、MCP の構成でも引き続き Playwright の
> `browser_navigate` だけを公開します。SDK のペイロードが利用できない間は、URL の完全一致を強制できません。
> 本番環境、共有環境、信頼できない対象では絶対に有効にしないでください。

`parseTarget` の隣に、次のオプション解析処理を追加します。

```java
private static final String LOCAL_DEMO_MCP_FLAG = "--allow-local-demo-mcp";

private static RunOptions parseRunOptions(String[] args) throws URISyntaxException {
    boolean allowLocalDemoMcp = false;
    String target = null;
    for (String arg : args) {
        if (LOCAL_DEMO_MCP_FLAG.equals(arg)) {
            if (allowLocalDemoMcp) {
                throw new IllegalArgumentException("Specify " + LOCAL_DEMO_MCP_FLAG + " at most once.");
            }
            allowLocalDemoMcp = true;
        } else if (target == null) {
            target = arg;
        } else {
            throw new IllegalArgumentException(usage());
        }
    }
    if (target == null) {
        throw new IllegalArgumentException(usage());
    }
    return new RunOptions(parseTarget(target), allowLocalDemoMcp);
}

private static String usage() {
    return "Usage: mvn compile exec:java -Dexec.args=\"["
            + LOCAL_DEMO_MCP_FLAG + "] <http-or-https-url>\"";
}

private record RunOptions(URI target, boolean allowLocalDemoMcp) {
}
```

URL の一致判定用ヘルパーを追加します。

```java
private static boolean isExactNavigation(Map<String, Object> request, URI target) {
    if (request == null
            || !"playwright".equals(request.get("serverName"))
            || !(request.get("toolName") instanceof String toolName)
            || !("browser_navigate".equals(toolName)
                    || "playwright-browser_navigate".equals(toolName))
            || !(request.get("args") instanceof Map<?, ?> args)
            || !(args.get("url") instanceof String requested)) {
        return false;
    }
    try {
        return sameUrl(new URI(requested), target);
    } catch (URISyntaxException ignored) {
        return false;
    }
}

private static boolean sameUrl(URI requested, URI allowed) {
    return equalsIgnoreCase(requested.getScheme(), allowed.getScheme())
            && equalsIgnoreCase(requested.getHost(), allowed.getHost())
            && requested.getPort() == allowed.getPort()
            && java.util.Objects.equals(requested.getRawUserInfo(), allowed.getRawUserInfo())
            && java.util.Objects.equals(requested.getRawPath(), allowed.getRawPath())
            && java.util.Objects.equals(requested.getRawQuery(), allowed.getRawQuery())
            && java.util.Objects.equals(requested.getRawFragment(), allowed.getRawFragment());
}

private static boolean equalsIgnoreCase(String left, String right) {
    return left == null ? right == null : right != null && left.equalsIgnoreCase(right);
}
```

### 3. スナップショットリーダーの境界を追加する

今回の実行で作成された Playwright ファイルだけを返す、引数なしのスナップショットリーダーを登録します。

```java
var readSnapshot = ToolDefinition.from(
        "read_latest_accessibility_snapshot",
        "Reads the newest Playwright accessibility snapshot created during this run.",
        new SnapshotReader(workingDirectory)::read).skipPermission(true);
```

入れ子のリーダークラスを追加します。

```java
private static final class SnapshotReader {
    private final Path outputDirectory;
    private final Set<Path> existing;

    private SnapshotReader(Path workingDirectory) throws IOException {
        outputDirectory = workingDirectory.resolve(".playwright-mcp").normalize();
        existing = new HashSet<>();
        if (Files.isDirectory(outputDirectory, LinkOption.NOFOLLOW_LINKS)) {
            try (Stream<Path> paths = Files.list(outputDirectory)) {
                paths.filter(SnapshotReader::isSnapshotName).forEach(existing::add);
            }
        }
    }

    private String read() {
        try (Stream<Path> paths = Files.list(outputDirectory)) {
            Path newest = paths
                    .filter(path -> !existing.contains(path))
                    .filter(SnapshotReader::isSnapshotName)
                    .filter(path -> !Files.isSymbolicLink(path))
                    .filter(SnapshotReader::isSafeSnapshot)
                    .max(Comparator.comparing(this::modifiedTime))
                    .orElseThrow(() -> new IllegalStateException(
                            "No current-run Playwright snapshot is available. Call browser_navigate first."));
            return Files.readString(newest, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "No current-run Playwright snapshot is available. Call browser_navigate first.",
                    exception);
        }
    }

    private static boolean isSnapshotName(Path path) {
        String name = path.getFileName().toString();
        return name.startsWith("page-") && name.endsWith(".yml");
    }

    private static boolean isSafeSnapshot(Path path) {
        try {
            BasicFileAttributes attributes = Files.readAttributes(
                    path, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
            return attributes.isRegularFile()
                    && !attributes.isSymbolicLink()
                    && attributes.size() > 0
                    && attributes.size() <= MAX_SNAPSHOT_BYTES;
        } catch (IOException exception) {
            return false;
        }
    }

    private java.nio.file.attribute.FileTime modifiedTime(Path path) {
        try {
            return Files.getLastModifiedTime(path, LinkOption.NOFOLLOW_LINKS);
        } catch (IOException exception) {
            return java.nio.file.attribute.FileTime.fromMillis(0);
        }
    }
}
```

### 4. Playwright MCP と範囲を限定した権限を追加する

セッションの構成全体を組み立て、ブラウザーから証拠を取得するプロンプトを送信します。

```java
var lookup = ToolDefinition.from(
        "accessibility_rule_lookup",
        "Looks up read-only WCAG guidance maintained by this application.",
        Param.of(String.class, "query", "The accessibility issue or WCAG criterion to look up."),
        AccessibilityReport::lookupRule).skipPermission(true);
var readSnapshot = ToolDefinition.from(
        "read_latest_accessibility_snapshot",
        "Reads the newest Playwright accessibility snapshot created during this run.",
        new SnapshotReader(workingDirectory)::read).skipPermission(true);

var config = new SessionConfig()
        .setStreaming(true)
        .setTools(List.of(lookup, readSnapshot))
        .setAvailableTools(List.of(
                "accessibility_rule_lookup",
                "read_latest_accessibility_snapshot",
                "playwright-browser_navigate"))
        .setMcpServers(Map.of("playwright", new McpStdioServerConfig()
                .setCommand("npx")
                .setArgs(List.of("-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"))
                .setWorkingDirectory(workingDirectory.toString())
                .setTools(List.of("browser_navigate"))))
        .setOnPermissionRequest((request, ignored) -> {
            if ("mcp".equals(request.getKind())
                    && isExactNavigation(request.getExtensionData(), target)) {
                return java.util.concurrent.CompletableFuture.completedFuture(
                        PermissionRequestResult.approveOnce());
            }
            if (options.allowLocalDemoMcp() && "mcp".equals(request.getKind())) {
                return java.util.concurrent.CompletableFuture.completedFuture(
                        PermissionRequestResult.approveOnce());
            }
            return java.util.concurrent.CompletableFuture.completedFuture(
                    PermissionRequestResult.reject(
                            "This workshop allows Playwright to navigate only to the exact requested target. "
                                    + "MCP requests without target data remain denied unless the explicit "
                                    + LOCAL_DEMO_MCP_FLAG + " local-demo fallback is enabled."));
        });

try (var client = new CopilotClient()) {
    client.start().get();
    var session = client.createSession(config).get();
    var response = session.sendAndWait(new MessageOptions().setPrompt(
            """
            Open %s with browser_navigate.
            1. Use browser_navigate to open that exact URL.
            2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
            3. Return the observed page title only.

            The permission handler must approve only this exact Playwright navigation target."""
                    .formatted(target))).get();
    if (response == null) {
        throw new IllegalStateException("Copilot completed without an assistant message.");
    }
    System.out.println(response.getData().content());
}
```

MCP と権限に関するインポートを追加します。

```java
import com.github.copilot.rpc.McpStdioServerConfig;
import com.github.copilot.rpc.PermissionRequestResult;
```

## 実行する

```bash
mvn compile exec:java -Dexec.args="--allow-local-demo-mcp {{TARGET_APP_URL}}"
```

初回実行では、`npx` が Playwright を起動するまで時間がかかる場合があります。このコマンドは、上記の
一時的なローカルデモ用の代替手段を意図的に有効にします。厳格なフェイルクローズ方針を維持する場合は、フラグを省略してください。

次のようなページタイトルが表示されることを確認します。

```text
Page title: Blazor Accessibility Target
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` に含まれていることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| 権限が拒否される | 既定のハンドラーは、ペイロードがない、または完全一致しないリクエストを意図的に拒否します。SDK が情報を提供する場合は対象を正確に指定します。この管理された対象に限り、[#2273](https://github.com/github/copilot-sdk/issues/2273) が修正されるまで `--allow-local-demo-mcp` を追加できます。 |
| 今回の実行で作成されたスナップショットがない | プロンプトの順序を維持し、`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| MCP または権限の型を解決できない | `McpStdioServerConfig` と `PermissionRequestResult` のインポートを追加します。 |

</details>

<details>
<summary>ステップ 4 の完成版の実装</summary>

作成したコードを、このステップ 4 の完成版の実装と比較してください。

`AccessibilityReport.java` のセッション構成:

```java
var config = new SessionConfig()
        .setStreaming(true)
        .setTools(List.of(lookup, readSnapshot))
        .setAvailableTools(List.of(
                "accessibility_rule_lookup",
                "read_latest_accessibility_snapshot",
                "playwright-browser_navigate"))
        .setMcpServers(Map.of("playwright", new McpStdioServerConfig()
                .setCommand("npx")
                .setArgs(List.of("-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"))
                .setWorkingDirectory(workingDirectory.toString())
                .setTools(List.of("browser_navigate"))))
        .setOnPermissionRequest((request, ignored) -> {
            if ("mcp".equals(request.getKind())
                    && isExactNavigation(request.getExtensionData(), target)) {
                return java.util.concurrent.CompletableFuture.completedFuture(
                        PermissionRequestResult.approveOnce());
            }
            if (options.allowLocalDemoMcp() && "mcp".equals(request.getKind())) {
                return java.util.concurrent.CompletableFuture.completedFuture(
                        PermissionRequestResult.approveOnce());
            }
            return java.util.concurrent.CompletableFuture.completedFuture(
                    PermissionRequestResult.reject(
                            "This workshop allows Playwright to navigate only to the exact requested target. "
                                    + "MCP requests without target data remain denied unless the explicit "
                                    + LOCAL_DEMO_MCP_FLAG + " local-demo fallback is enabled."));
        });
```

</details>
:::

> **ツールを組み合わせる準備ができた目安:** ターミナルに Playwright のツール名付きの実行状況が表示され、
> 対象ページのタイトルが出力されること。

## 理解度を確認する

ここでは、なぜ Playwright をアプリケーション側のコールバックではなく MCP サーバーとして使用するのでしょうか。

<details>
<summary>解答を確認する</summary>

Playwright は、独自の依存関係を持つ独立したプロセスで、再利用可能なブラウザー自動操作機能を提供します。
MCP を使えば、ブラウザーのロジックをアプリケーションのドメインコードに移さずに接続でき、
権限の仕組みでプロセス境界を保護できます。

</details>

## 詳しく学ぶ

- [Model Context Protocol](https://modelcontextprotocol.io/): Playwright サーバーが実装する
  オープン標準と、ツール名の基になっている用語について。
- [MCP のデバッグ](https://github.com/github/copilot-sdk/blob/main/docs/troubleshooting/mcp-debugging.md):
  起動しないサーバーや、想定と異なるツールを公開するサーバーを診断する方法。
- [フックのエラー処理](https://github.com/github/copilot-sdk/blob/main/docs/hooks/error-handling.md):
  ツール呼び出しやハンドラーが失敗したときのセッションの動作を決める方法。
- [プラグインディレクトリ](https://github.com/github/copilot-sdk/blob/main/docs/features/plugin-directories.md):
  MCP サーバー、スキル、フックをまとめ、セッションで一括して読み込む方法。

[ステップ 5: ローカルツールと MCP ツールを組み合わせる](05-combine-tools.md)に進みます。
