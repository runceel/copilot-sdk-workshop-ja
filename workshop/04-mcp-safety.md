# ステップ 4: 外部ツールを安全に接続する

> **所要時間:** 20 分

## 接続するもの

MCP を介して Playwright を起動し、ナビゲーションを自分が指定したワークショップのターゲットに限定して、
そのアクセシビリティツリーを調べ、ページタイトルをレポートします。

## MCP とその信頼境界を知る

[**Model Context Protocol (MCP)**](https://github.com/github/copilot-sdk/blob/main/docs/features/mcp.md)
は、アプリケーションの外部で実装された再利用可能な機能へエージェントを接続するための標準的な方法です。
このワークショップでは、SDK が Playwright MCP サーバーを別個の `npx`
プロセスとして起動します。Playwright はブラウザーの自動化を担当し、アプリケーションは接続を構成します。

プロセス境界は **信頼境界** でもあります。
[パーミッションハンドラー](https://github.com/github/copilot-sdk/blob/main/docs/hooks/pre-tool-use.md) は、
要求されたアクションが実行される前にランタイムが呼び出すコールバックで、各外部アクションを
実行してよいかどうかを判断します。

| 問い | ローカルの WCAG ツール | Playwright MCP |
|---|---|---|
| 誰が実装しているか？ | このアプリケーション | 外部の Playwright パッケージ |
| どこで実行されるか？ | 同じアプリケーションプロセス | 別個の Node.js プロセス |
| 何に最も適しているか？ | アプリ所有のデータと決定論的なロジック | 再利用可能なブラウザー機能 |
| ここでは信頼をどう扱うか？ | 読み取り専用ツールはパーミッションをスキップ | ツールリストとカスタムハンドラーがアクセスを制限 |

WCAG ルックアップと狭い範囲のスナップショットリーダーはプロセス内にとどまります。
`CopilotSession -> Playwright MCP -> browser` はプロセス境界をまたぎます。

## Playwright をガードレールの背後に置く

ブラウザー引数はワークショップの既定である Microsoft Edge を使用します。代わりに Google Chrome を
用意した場合は、`--browser=chrome` を使用してください。

セッションのツール許可リストは無関係なランタイムツールを締め出します。MCP サーバーのツールリストは
ナビゲーションのみを公開します。Playwright MCP 0.0.78 では、ナビゲーションは自動生成した
アクセシビリティツリーを `.playwright-mcp/` に書き込みます。アプリケーションのスナップショットリーダーは
引数を受け取らず、セッション開始後に作成された最新の Playwright スナップショットのみを読み取ります。

`browser_snapshot` は、そのオプション引数 `filename` がファイルを書き込める可能性があるため、
どちらの許可リストにも含めません。ランタイムは読み取り専用と注釈された MCP ツールを、
パーミッションのデリゲートを呼び出さずに自動的に許可できるため、ハンドラーはその引数を確実に
サニタイズできません。プロンプトに頼るのではなく、ツールを取り除くことでこの機能を閉じます。

リーダーはパスを受け取りません。既存のファイル、ネストされたファイル、シンボリックリンク、空の
ファイル、1 MB を超えるスナップショットを無視します。ナビゲーションは、完全な正規化 URL が
起動時に指定されたターゲットと一致した場合にのみ許可されます。スキームとホストは URL 標準の
大文字小文字を区別しない比較を使用します。パス、クエリ、フラグメントは大文字小文字を区別して一致する必要があります。

ハンドラーはリクエストごとに 1 つの決定だけを返します。今回は利用可能な種類のうち 2 つが必要です。
`approve-once` はこの単一のリクエストを許可します。`reject` はそれを拒否し、フィードバック
メッセージをモデルに転送できるため、拒否された呼び出しは無言の失敗ではなく理由付きで返ってきます。
このワークショップでは扱わない状況向けにさらに 2 つの種類があります。`user-not-available` は
確認できるユーザーが存在しないため拒否し、`no-result` は一切応答せず、代わりに別の
接続済みクライアントがリクエストに応答できるようにします。より広い承認スコープ — `approve-for-session`、
`approve-for-location`、`approve-permanently` — は、この 1 回の呼び出しを超えて決定を記憶します。
各 SDK はこれらすべてを独自の命名規則で表記します。

:::language dotnet
## C# でスコープ付き Playwright アクセスを組み立てる

### 1. 制御されたターゲットを 1 つ受け取る

`Program.cs` の先頭で、`using` 文の後、バナーの前に次を挿入します。

```csharp
if (args.Length is not 1 ||
    !Uri.TryCreate(args[0], UriKind.Absolute, out var targetUri) ||
    targetUri.Scheme is not ("http" or "https"))
{
    Console.Error.WriteLine("Usage: dotnet run -- <http-or-https-url>");
    return;
}
```

### 2. 用意済みのパーミッションハンドラーを確認する

`Helpers/WorkshopPermissionHandler.cs` を開きます。用意済みのハンドラーは、ターゲットに完全一致する
ナビゲーションに対してのみ 1 回限りの承認を返します。それ以外の外部リクエストはすべて拒否されます。

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

.NET SDK は現在、MCP パーミッションのツール名にサーバー名を接頭辞として付けます（例:
`playwright-browser_navigate`）。一方、MCP 構成では `browser_navigate` を使用します。
`IsPlaywrightTool` は幅広いワイルドカードを使う代わりに、これら 2 つの正確な形式を受け入れます。

> **SDK メモ:** バージョン 1.0.7 には `PermissionHandler.ApproveAll` が同梱されていますが、
> 組み込みのスコープ付きハンドラーはありません。そのためスターターには手書きのデリゲートが
> 含まれています。`PermissionDecision` は現在評価専用としてマークされているため、その 1 つの
> ヘルパーにはローカライズされた `GHCP001` の抑制が含まれています。

### 3. 用意済みのスナップショットリーダーの境界を確認する

`Helpers/PlaywrightSnapshotReader.cs` を開きます。リーダーはツールが作成された時点で既存の
スナップショットを取得し、モデルが指定する引数を受け取らず、`page-*.yml` という名前の新しい直下の子
だけを選択し、シンボリックリンクや大きすぎるファイルを拒否したうえで、テキストを返します。

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
            Description = "この実行中に作成された最新の Playwright アクセシビリティスナップショットを読み取ります。"
        });
}
```

アダプターは読み取り専用であり、アプリケーションが選択したストレージを使用し、アプリケーションによって
実装されているため、パーミッションをスキップします。これは汎用的なファイルリーダーよりも狭い機能です。

### 4. Playwright MCP とスコープ付きパーミッションを追加する

セッション構成を次のように置き換えます。

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

### 5. ブラウザーの根拠を要求する

最後の送信呼び出しを置き換えます。

```csharp
Console.WriteLine($"\nInspecting: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(
    session,
    $"""
    `browser_navigate` で {targetUri.AbsoluteUri} を開いてください。
    続けて `read_latest_accessibility_snapshot` を使い、ページタイトルと主な内容を説明する 1 文を報告してください。
    """);
```


## 実行する

```bash
dotnet run -- "{{TARGET_APP_URL}}"
```

初回の実行は、`npx` が Playwright を起動する間、時間がかかることがあります。

次のような出力を探します。

```text
[tool:start] playwright-browser_navigate
[tool:done] success=...
[tool:start] read_latest_accessibility_snapshot
[tool:done] success=True

Page title: Blazor Accessibility Target
```

> **日本語補足（出力例）:** `Page title` に対象ページのタイトルが表示されていれば成功です。ツール実行ログがある場合は、ナビゲーションとスナップショット取得が完了していることも確認します。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` にあることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| パーミッションが拒否される | 上記の正確なターゲット URL を使用します。ハンドラーは意図的にほかの URL やツールを拒否します。 |
| 現在の実行のスナップショットが利用できない | プロンプトの順序を守ります。`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| コンパイラーがパーミッションヘルパーを見つけられない | `using HelloCopilotSDK.Helpers;` が存在し、ヘルパーファイルがプロジェクトに含まれていることを確認します。 |

</details>

<details>
<summary>ステップ 4 の完全な実装</summary>

自分の作業を、このステップ 4 の完全な実装と比較します。

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
    `browser_navigate` で {targetUri.AbsoluteUri} を開いてください。
    Then use read_latest_accessibility_snapshot and return the page title
    plus one sentence describing its main content.
    """);
```

</details>
:::

:::language nodejs
## TypeScript でスコープ付き Playwright アクセスを組み立てる

### 1. 制御されたターゲットを 1 つ受け取る

`src/index.ts` の先頭で、エントリーポイントのセットアップを次のように置き換えます。

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

### 2. 用意済みのパーミッションハンドラーを確認する

`src/workshop.ts` を開きます。用意済みのハンドラーは、ターゲットに完全一致する Playwright の
ナビゲーションのみを承認します。

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

ランタイムはパーミッションリクエストでサーバー名を接頭辞として付ける場合があるため、
`browser_navigate` と `playwright-browser_navigate` の両方を受け入れます。

### 3. 用意済みのスナップショットリーダーの境界を確認する

引き続き `src/workshop.ts` 内で、スナップショットリーダーは作成時に既存のファイルを取得し、
モデルが指定するパスを受け取りません。

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

### 4. Playwright MCP とスコープ付きパーミッションを追加する

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
      `browser_navigate で ${target.href} を開き、read_latest_accessibility_snapshot を使ってページタイトルを報告してください。`,
    );
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```


`availableTools` はランタイムが接頭辞を付けた MCP 名 `playwright-browser_navigate` を使用しますが、
MCP サーバー構成では引き続き接頭辞なしの `browser_navigate` を列挙します。

## 実行する

```bash
npm start -- "{{TARGET_APP_URL}}"
```

初回の実行は、`npx` が Playwright を起動する間、時間がかかることがあります。
`browser_navigate` が利用できない場合は `copilot mcp list` で `playwright` の状態を確認してください。
`Disabled` と表示された場合、ユーザー設定の無効化が SDK のセッションにも適用されます。
利用を許可するなら `copilot mcp enable playwright` で有効化してから再実行してください。
この変更は以降のセッションにも反映されます。

次のような出力を探します。

```text
[tool:start] playwright-browser_navigate
[tool:done] success=...
[tool:start] read_latest_accessibility_snapshot
[tool:done] success=true

Page title: Blazor Accessibility Target
```

> **日本語補足（出力例）:** `Page title` に対象ページのタイトルが表示されていれば成功です。ツール実行ログがある場合は、ナビゲーションとスナップショット取得が完了していることも確認します。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` にあることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| パーミッションが拒否される | 上記の正確なターゲット URL を使用します。ハンドラーは意図的にほかの URL やツールを拒否します。 |
| 現在の実行のスナップショットが利用できない | プロンプトの順序を守ります。`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| TypeScript がヘルパーを解決できない | インポートパスが `.js` で終わっていることを確認し、スターターディレクトリで `npm install` を実行します。 |

</details>

<details>
<summary>ステップ 4 の完全な実装</summary>

自分の作業を、このステップ 4 の完全な実装と比較します。

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
    await streamResponse(session, `browser_navigate で ${target.href} を開き、read_latest_accessibility_snapshot を使ってページタイトルを報告してください。`);
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
## Python でスコープ付き Playwright アクセスを組み立てる

### 1. 制御されたターゲットを 1 つ受け取る

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

### 2. 用意済みのパーミッションハンドラーを確認する

`workshop.py` を開きます。用意済みのハンドラーは、ターゲットに完全一致する Playwright の
ナビゲーションのみを承認します。

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

### 3. 用意済みのスナップショットリーダーの境界を確認する

引き続き `workshop.py` 内で、スナップショットリーダーは作成時に既存のファイルを取得し、
モデルが指定するパスを受け取りません。

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

### 4. Playwright MCP とスコープ付きパーミッションを追加する

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
                f"`browser_navigate` で {target} を開き、 "
                "`read_latest_accessibility_snapshot` を使ってページタイトルを報告してください。"
            )
            await done.wait()
            if error is not None:
                raise error
```


`available_tools` はランタイムが接頭辞を付けた MCP 名 `playwright-browser_navigate` を使用しますが、
MCP サーバー構成では引き続き接頭辞なしの `browser_navigate` を列挙します。

## 実行する

```bash
python main.py "{{TARGET_APP_URL}}"
```

初回の実行は、`npx` が Playwright を起動する間、時間がかかることがあります。

ナビゲーションとスナップショットのアクティビティを探し、続いて次のようなページタイトルを探します。

```text
Page title: Blazor Accessibility Target
```

> **日本語補足（出力例）:** `Page title` に対象ページのタイトルが表示されていれば成功です。ツール実行ログがある場合は、ナビゲーションとスナップショット取得が完了していることも確認します。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` にあることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| パーミッションが拒否される | 上記の正確なターゲット URL を使用します。ハンドラーは意図的にほかの URL やツールを拒否します。 |
| 現在の実行のスナップショットが利用できない | プロンプトの順序を守ります。`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| ワークショップヘルパーのインポートエラー | 事前準備の仮想環境をアクティブにし、`workshop.py` が `main.py` の隣にあることを確認します。 |

</details>

<details>
<summary>ステップ 4 の完全な実装</summary>

自分の作業を、このステップ 4 の完全な実装と比較します。

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
            await session.send(f"`browser_navigate` で {target} を開き、`read_latest_accessibility_snapshot` を使ってページタイトルを報告してください。")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

</details>
:::

:::language go
## Go でスコープ付き Playwright アクセスを組み立てる

### 1. 制御されたターゲットを 1 つ受け取る

`main.go` の `main` の先頭で、起動時の URL を検証します。

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

### 2. パーミッションハンドラーを追加する

`main` の前に、完全一致の URL 判定とパーミッションハンドラーを追加します。

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

パーミッションの経路では、接頭辞なしと接頭辞付きの両方の Playwright ツール名を受け入れます。

### 3. スナップショットリーダーの境界を追加する

引き続き `main` の前に、引数なしのスナップショットリーダーを追加します。

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

### 4. Playwright MCP とスコープ付きパーミッションを追加する

`main` で、ローカルツールを両方定義し、セッション構成を置き換えます。

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
if err := streamResponse(session, fmt.Sprintf("`browser_navigate` で %s を開き、`read_latest_accessibility_snapshot` を使ってページタイトルを報告してください。", target)); err != nil {
	panic(err)
}
```


新しいヘルパーが使用するインポートを追加します: `encoding/json`、`net/url`、`path/filepath`、`sort`、
`time`、および `"github.com/github/copilot-sdk/go/rpc"`。

## 実行する

```bash
go run . "{{TARGET_APP_URL}}"
```

初回の実行は、`npx` が Playwright を起動する間、時間がかかることがあります。

次のようなページタイトルを探します。

```text
Page title: Blazor Accessibility Target
```

> **日本語補足（出力例）:** `Page title` に対象ページのタイトルが表示されていれば成功です。ツール実行ログがある場合は、ナビゲーションとスナップショット取得が完了していることも確認します。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` にあることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| パーミッションが拒否される | 上記の正確なターゲット URL を使用します。ハンドラーは意図的にほかの URL やツールを拒否します。 |
| 現在の実行のスナップショットが利用できない | プロンプトの順序を守ります。`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| インポートが不足している | `encoding/json`、`net/url`、`path/filepath`、`sort`、`time`、および `rpc` パッケージを追加します。 |

</details>

<details>
<summary>ステップ 4 の完全な実装</summary>

自分の作業を、このステップ 4 の完全な実装と比較します。

`main.go` のセッション配線:

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
if err := streamResponse(session, fmt.Sprintf("`browser_navigate` で %s を開き、`read_latest_accessibility_snapshot` を使ってページタイトルを報告してください。", target)); err != nil {
	panic(err)
}
```

</details>
:::

:::language rust
## Rust でスコープ付き Playwright アクセスを組み立てる

### 1. 制御されたターゲットを 1 つ受け取る

`src/main.rs` の `main` の先頭で、起動時の URL を検証します。

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

### 2. パーミッションハンドラーを追加する

`main` の前に、ターゲットに完全一致するパーミッションハンドラーを追加します。

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

`main` の前に、引数なしのスナップショットリーダーを追加します。

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

### 4. Playwright MCP とスコープ付きパーミッションを追加する

`main` で、ローカルツールを両方定義し、MCP を構成し、パーミッションハンドラーをインストールします。

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
        "`browser_navigate` で {target} を開き、`read_latest_accessibility_snapshot` を使ってページタイトルを報告してください。"
    )
);
session.disconnect().await?;
client.stop().await?;
```


新しいヘルパーが使用するインポートを追加します。これには
`github_copilot_sdk::handler::{PermissionHandler, PermissionResult}`、
`McpServerConfig`、`McpStdioServerConfig`、`PermissionRequestData`、`PermissionRequestKind`、
`RequestId`、`SessionId`、`indexmap::IndexMap`、`url::Url` が含まれます。

## 実行する

```bash
cargo run -- "{{TARGET_APP_URL}}"
```

初回の実行は、`npx` が Playwright を起動する間、時間がかかることがあります。

次のようなページタイトルを探します。

```text
Page title: Blazor Accessibility Target
```

> **日本語補足（出力例）:** `Page title` に対象ページのタイトルが表示されていれば成功です。ツール実行ログがある場合は、ナビゲーションとスナップショット取得が完了していることも確認します。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` にあることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| パーミッションが拒否される | 上記の正確なターゲット URL を使用します。ハンドラーは意図的にほかの URL やツールを拒否します。 |
| 現在の実行のスナップショットが利用できない | プロンプトの順序を守ります。`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| トレイトまたは型が解決されない | 上記のパーミッション、MCP、`IndexMap`、`Url` のインポートを維持します。 |

</details>

<details>
<summary>ステップ 4 の完全な実装</summary>

自分の作業を、このステップ 4 の完全な実装と比較します。

`src/main.rs` のセッション配線:

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
## Java でスコープ付き Playwright アクセスを組み立てる

### 1. 制御されたターゲットを 1 つ受け取る

`src/main/java/workshop/AccessibilityReport.java` の `main` の先頭で、起動時の URL を検証します。

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

パーサーヘルパーを追加します。

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

### 2. パーミッションハンドラーを追加する

セッション構成で、ターゲットに完全一致する Playwright のナビゲーションのみを承認します。

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

> **一時的な Java SDK の制限とローカルデモのフォールバック:** 既定ではこれはフェイルクローズです。
> 設定された Playwright のナビゲーションが入力された URL と完全に一致することをペイロードが証明する
> `mcp` リクエストのみを承認します。現在の Java SDK リリースはそれらの MCP リクエストのフィールドを
> 公開していないため
> （[github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273)）、既定の経路は
> 推測するのではなく、そのリクエストを拒否します。制御されたワークショップのターゲットに限り、
> `--allow-local-demo-mcp` を渡してください。その明示的なフラグは `mcp` リクエストを一度に 1 つ
> 承認します。`APPROVE_ALL` は **使用せず**、MCP 構成は引き続き Playwright の `browser_navigate`
> のみを公開します。SDK のペイロードが利用できない間は、正確な URL を強制することはできません。
> 本番環境、共有環境、信頼できないターゲットでは決して有効にしないでください。

`parseTarget` の隣にこのオプションパーサーを追加します。

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

URL 一致のヘルパーを追加します。

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

現在の実行の Playwright ファイルのみを返す、引数なしのスナップショットリーダーを登録します。

```java
var readSnapshot = ToolDefinition.from(
        "read_latest_accessibility_snapshot",
        "Reads the newest Playwright accessibility snapshot created during this run.",
        new SnapshotReader(workingDirectory)::read).skipPermission(true);
```

ネストされたリーダークラスを追加します。

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

### 4. Playwright MCP とスコープ付きパーミッションを追加する

完全なセッション構成を組み立て、ブラウザーの根拠を求めるプロンプトを送信します。

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
            1. `browser_navigate` を使って、指定された URL を開いてください。
            2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
            3. Return the observed page title only.

            The permission handler must approve only this exact Playwright navigation target."""
                    .formatted(target))).get();
    if (response == null) {
        throw new IllegalStateException("Copilot completed without an assistant message.");
    }
    System.out.println(response.getData().content());
}
```


MCP とパーミッションのインポートを追加します。

```java
import com.github.copilot.rpc.McpStdioServerConfig;
import com.github.copilot.rpc.PermissionRequestResult;
```

## 実行する

```bash
mvn compile exec:java -Dexec.args="--allow-local-demo-mcp {{TARGET_APP_URL}}"
```

初回の実行は、`npx` が Playwright を起動する間、時間がかかることがあります。このコマンドは、上記の
一時的なローカルデモのフォールバックに意図的にオプトインしています。厳格なフェイルクローズの
ポリシーを維持するには、このフラグを省略してください。

次のようなページタイトルを探します。

```text
Page title: Blazor Accessibility Target
```

> **日本語補足（出力例）:** `Page title` に対象ページのタイトルが表示されていれば成功です。ツール実行ログがある場合は、ナビゲーションとスナップショット取得が完了していることも確認します。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `npx` を起動できない | 事前準備の MCP コマンドを再実行し、Node.js が `PATH` にあることを確認します。 |
| Playwright がブラウザーを見つけられない | Edge または Chrome をインストールするか、Playwright MCP の説明に従ってインストール済みのブラウザーを構成します。 |
| パーミッションが拒否される | 既定のハンドラーは、欠落しているか完全一致でないリクエストペイロードを意図的に拒否します。SDK が提供する場合は正確なターゲットを使用します。この制御されたターゲットに限り、[#2273](https://github.com/github/copilot-sdk/issues/2273) が修正されるまで `--allow-local-demo-mcp` を追加します。 |
| 現在の実行のスナップショットが利用できない | プロンプトの順序を守ります。`read_latest_accessibility_snapshot` の前に `browser_navigate` を呼び出します。 |
| MCP またはパーミッションの型が解決されない | `McpStdioServerConfig` と `PermissionRequestResult` のインポートを追加します。 |

</details>

<details>
<summary>ステップ 4 の完全な実装</summary>

自分の作業を、このステップ 4 の完全な実装と比較します。

`AccessibilityReport.java` のセッション配線:

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

> **ツールを組み合わせる準備ができたと言えるのは:** ターミナルに名前付きの Playwright ツールの
> アクティビティが表示され、ターゲットのページタイトルが出力されたときです。

## 理解度チェック

なぜここでは Playwright を、別のアプリケーション所有のコールバックではなく MCP サーバーにするのでしょうか？

<details>
<summary>答えを確認する</summary>

Playwright は再利用可能なブラウザー自動化を、独自のプロセスと独自の依存関係で提供します。MCP は、
ブラウザーのロジックをアプリケーションのドメインコードに移すことなくそれを接続し、パーミッションが
プロセス境界を保護します。

</details>

## 参考資料

- [Model Context Protocol](https://modelcontextprotocol.io/): Playwright サーバーが実装する
  標準規格です。MCP の概要や仕組みを確認できます。
- [MCP のデバッグ](https://github.com/github/copilot-sdk/blob/main/docs/troubleshooting/mcp-debugging.md):
  起動に失敗するサーバーや、想定と異なるツールを公開するサーバーの調査方法を説明しています。
- [フックのエラー処理](https://github.com/github/copilot-sdk/blob/main/docs/hooks/error-handling.md):
  ツールやハンドラーでエラーが起きたときの、セッション側の処理方法を説明しています。
- [プラグインディレクトリ](https://github.com/github/copilot-sdk/blob/main/docs/features/plugin-directories.md):
  MCP サーバー、スキル、フックをまとめて登録し、セッションで一括して読み込む方法を説明しています。

[ステップ 5: ローカルツールと MCP ツールを組み合わせる](05-combine-tools.md)に進みます。
