# ステップ 5: ローカルツールと MCP ツールを組み合わせる

> **所要時間:** 15 分

## オーケストレーションするもの

1 つの URL を使って、Playwright でブラウザーの根拠を収集し、ローカルの WCAG カタログから
修正のガイダンスを取得するエージェントのターンを動かします。

## 適切なツールをエージェントに選ばせる

**エージェントオーケストレーション** とは、目標を達成するためにモデルが機能を選択し、順序立てて
実行することです。あなたのセッションは、1 つのインターフェースを通じて 2 つの異なるツールを公開します。

- Playwright はライブページに関する事実を発見します。
- アプリケーションが所有するカタログは、一致する基準と修正方法を説明します。

どちらのツールも、tool-start イベントと tool-completion イベントを通じて処理を報告します。
アプリケーションは、いずれのツールがどのように実装されているかを知らなくても、その処理を観察できます。

## 根拠とガイダンスをそれぞれの役割に留める

各ツールには 1 つの役割があります。Playwright はブラウザーの根拠を提供し、ローカルのカタログは
アプリケーションの信頼できる唯一の情報源となるガイダンスを提供します。回答は、モデルに両方を推論させる
のではなく、それらの情報源に基づいて根拠づけられます。

フローは `URL -> Playwright evidence -> WCAG catalog lookup -> grounded response` になりました。

## 両方のツールを働かせる

:::language dotnet
### 1. URL を読み取って検証する

Step 4 のコマンドライン引数の検証を削除します。バナーの後、クライアントを作成する前に、次を挿入します。

```csharp
Console.Write("Enter URL to analyze: ");
var urlInput = Console.ReadLine()?.Trim();

if (string.IsNullOrWhiteSpace(urlInput))
{
    Console.Error.WriteLine("Enter a URL to analyze.");
    return;
}

if (!urlInput.Contains("://", StringComparison.Ordinal))
{
    urlInput = $"https://{urlInput}";
}

if (!Uri.TryCreate(urlInput, UriKind.Absolute, out var targetUri) ||
    targetUri.Scheme is not ("http" or "https"))
{
    Console.Error.WriteLine("Enter an absolute HTTP or HTTPS URL.");
    return;
}
```
:::
Step 4 のハンドラーは、この検証済みの `targetUri` を受け取るため、URL の境界は引き続き適用されます。

:::language dotnet
### 2. エージェントに 3 つのツールを使う目標を与える

Step 4 の組み合わせたローカルツール、MCP サーバー、許可リスト、パーミッションハンドラーはそのまま
残します。最後のプロンプトを置き換えます。

```csharp
Console.WriteLine($"\nAnalyzing: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(
    session,
    $"""
    browser_navigate で {targetUri.AbsoluteUri} を開き、read_latest_accessibility_snapshot を呼び出してください。
    スナップショットで確認できる、確度の高いアクセシビリティ上の課題を 2 件特定してください。
    各課題について accessibility_rule_lookup を呼び出し、次の情報を返してください:
    - ブラウザーで確認した根拠;
    - 該当する基準;
    - カタログが推奨する修正方法。
    """);
```


:::
このプロンプトは、根拠とガイダンスをそれぞれ正しい情報源に割り当てます。カタログ参照の順序は
エージェントに委ねます。

:::language nodejs
### 1. 組み合わせたセッションを維持する

`src/index.ts` では、Step 4 のヘルパーと、両方のローカルツールおよび Playwright MCP を登録する
組み合わせたセッションを維持します。

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
```

### 2. エージェントに 3 つのツールを使う目標を与える

エージェントがナビゲートし、スナップショットを読み取り、カタログを呼び出す必要があるように、最後の
send 呼び出しを置き換えます。

```typescript
  try {
    await streamResponse(session, `${target.href} を開いてスナップショットを読み取り、accessibility_rule_lookup を使って根拠に基づく修正案を 1 件提案してください。`);
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```


:::
:::language python
### 1. 組み合わせたセッションを維持する

`main.py` では、Step 4 のヘルパーと、両方のローカルツールおよび Playwright MCP を登録する
組み合わせたセッションを維持します。

```python
import asyncio
import sys
from urllib.parse import urlsplit

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, AssistantMessageDeltaData, SessionErrorData, SessionIdleData, ToolExecutionCompleteData, ToolExecutionStartData

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
```

### 2. エージェントに 3 つのツールを使う目標を与える

Step 2/4 のイベントハンドラーをセッションブロック内に残し、ローカルツールと MCP ツールの両方の
アクティビティが実行時に表示されるように、ツールのライフサイクル分岐を追加します。その後、`session.send`
に渡すプロンプトを置き換えます。

```python
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
                    case ToolExecutionStartData(tool_name=name):
                        print(f"\n[tool:start] {name}")
                    case ToolExecutionCompleteData(success=success):
                        print(f"[tool:done] success={success}")
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData():
                        done.set()

            session.on(on_event)
            await session.send(f"{target} を開いてスナップショットを読み取り、`accessibility_rule_lookup` を使って根拠に基づく推奨事項を 1 件示してください。")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```


:::
:::language go
### 1. 組み合わせたセッションを維持する

`main.go` では、Step 4 の 3 つのツールを使うセッション（ローカルの参照、スナップショットリーダー、
Playwright MCP、許可リスト、正確なターゲットのパーミッションハンドラー）を維持します。

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
```

### 2. エージェントに 3 つのツールを使う目標を与える

エージェントがナビゲートし、スナップショットを読み取り、カタログを呼び出す必要があるように、最後の
プロンプトを置き換えます。

```go
	prompt := fmt.Sprintf(
		"`browser_navigate` で %s を開き、`read_latest_accessibility_snapshot` から根拠を取得してから、`accessibility_rule_lookup` を呼び出して根拠に基づく修正案を 1 件提案してください。",
		target,
	)
	if err := streamResponse(session, prompt); err != nil {
		panic(err)
	}
```


:::
:::language rust
### 1. 組み合わせたセッションを維持する

`src/main.rs` では、Step 4 の 3 つのツールを使うセッション（ローカルの参照、スナップショット
リーダー、Playwright MCP、許可リスト、正確なターゲットのパーミッションハンドラー）を維持します。

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
```

### 2. エージェントに 3 つのツールを使う目標を与える

プロンプトヘルパーを追加または置き換えてから、それをストリーマーに渡します。

```rust
fn combined_tools_prompt(target: &Url) -> String {
    format!(
        r#"`browser_navigate` で {target} を開いてください。
1. `browser_navigate` を使って、指定された URL を開いてください。
2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
3. ブラウザーで観測できる課題を 1 件特定してください。
4. 根拠に基づく修正案を 1 件提案する前に、accessibility_rule_lookup を呼び出してください。"#
    )
}
```


```rust
    let client = Client::start(ClientOptions::default()).await?;
    let session = client.create_session(config).await?;
    stream_response!(session, combined_tools_prompt(&target));
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
```
:::
:::language java
### 1. 組み合わせたセッションを維持する

`src/main/java/workshop/AccessibilityReport.java` では、Step 4 の 3 つのツールを使うセッション
（ローカルの参照、スナップショットリーダー、Playwright MCP、許可リスト、正確なターゲットの
パーミッションハンドラー）を維持します。SDK が正確な MCP リクエストのフィールドを公開できない状態が
[github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273) によって続く間、
デフォルトのフェイルクローズドポリシーと、制御されたワークショップのターゲット向けのオプションの
`--allow-local-demo-mcp` フォールバックを維持します。

```java
        RunOptions options = parseRunOptions(args);
        URI target = options.target();
        Path workingDirectory = Path.of("").toAbsolutePath().normalize();
        if (options.allowLocalDemoMcp()) {
            System.err.println("WARNING: Local demo fallback enabled. MCP request payload fields are unavailable, "
                    + "so this run approves only the mcp permission kind, not an exact target. "
                    + "Use only with the controlled workshop target.");
        }
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
```

### 2. エージェントに 3 つのツールを使う目標を与える

プロンプトヘルパーを追加または置き換えてから、それを送信します。

```java
    private static String combinedToolsPrompt(URI target) {
        return """
                Open %s with browser_navigate.
                1. `browser_navigate` を使って、指定された URL を開いてください。
                2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
                3. ブラウザーで観測できる課題を 1 件特定してください。
                4. 根拠に基づく修正案を 1 件提案する前に、accessibility_rule_lookup を呼び出してください。""".formatted(target);
    }
```


```java
        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(config).get();
            var response = session.sendAndWait(new MessageOptions().setPrompt(combinedToolsPrompt(target))).get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
```
:::
## 実行する

:::language dotnet
```bash
dotnet run
```

プロンプトが表示されたら、この URL を貼り付けます。

```text
{{TARGET_APP_URL}}
```
:::
:::language nodejs
```bash
npm start -- "{{TARGET_APP_URL}}"
```
:::
:::language python
```bash
python main.py "{{TARGET_APP_URL}}"
```
:::
:::language go
```bash
go run . "{{TARGET_APP_URL}}"
```
:::
:::language rust
```bash
cargo run -- "{{TARGET_APP_URL}}"
```
:::
:::language java
```bash
mvn compile exec:java -Dexec.args="--allow-local-demo-mcp {{TARGET_APP_URL}}"
```
:::

両方の種類のツールからのアクティビティが表示されるはずです。

```text
=== First Copilot session ===

Connected to the Copilot runtime: pong: workshop

Analyzing: {{TARGET_APP_URL}}

ページを開いてアクセシビリティスナップショットを取得します。
[tool:start] playwright-browser_navigate
[tool:done] success=True

[tool:start] read_latest_accessibility_snapshot
[tool:done] success=True
スナップショットから、確度の高い課題を2件特定しました。カタログを照会します。
[tool:start] accessibility_rule_lookup
[tool:start] accessibility_rule_lookup
[tool:done] success=True
[tool:done] success=True
2件目の課題について別のキーワードで再照会します。
[tool:start] accessibility_rule_lookup
[tool:done] success=True
2件目候補を見出し構造の問題に変更して照会します(h2→h4のレベル飛び)。
[tool:start] accessibility_rule_lookup
[tool:done] success=True
以下2件の課題を特定しました。

## 課題1: テキストボックスにラベルがない

- **根拠(スナップショット)**: `textbox [ref=e12]` が名前(アクセシブルネーム)なしで出力されている。隣接する `button "Submit"` から入力目的は推測できるが、プログラム的に関連付いたラベルが存在しない。
- **該当基準**: WCAG 3.3.2「ラベル又は説明」
- **推奨修正**: 入力する内容が分かる、常に表示されるラベル(`<label for>` など)をテキストボックスに関連付け、必要に応じて入力形式の説明も追加する。

## 課題2: 見出し階層の飛び

- **根拠(スナップショット)**: `heading level=2`(Welcome...)の後、`level=3`(About this app)を挟まず `heading level=4`(Quick actions)が先に出現しており、h2→h4→h3という順序で階層が飛び・逆転している。
- **該当基準**: WCAG 1.3.1「情報及び関係性」
- **推奨修正**: 見出しレベルを飛ばさず、文書構造に沿った適切な階層(h2→h3→h4)に修正し、支援技術がページ構造を正しく伝えられるようにする。

なお「Learn more」リンクの文脈依存テキストも気になりましたが、カタログに該当基準が登録されていなかったため、確度の高い2件として上記を報告します。
```

> **出力例の見方:** 2 件目の照会をやり直していますが、各ツールの実行は成功しており、
> Playwright の根拠をカタログに結び付けるというこのステップの目的は達成しています。
> ただし、アクセシブルネームのない入力にはカタログの WCAG 4.1.2 も該当します。
> 見出しレベルの飛びも、順序だけで WCAG 違反と断定せず、実際の内容と構造を確認してください。
> この出力は監査結果ではなく、モデルが生成したレビュー例です。

正確な順序と表現は異なる場合があります。根拠は Playwright から得られる必要があり、基準はカタログと
一致する必要があります。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処法 |
|---|---|
| Playwright ツールしか実行されない | 各指摘事項について `accessibility_rule_lookup` を呼び出すという明示的な指示を残してください。 |
| ブラウザーの検査より前にカタログツールが実行される | これは有効な計画である場合もありますが、ブラウザーの根拠を欠く最終的な指摘事項はすべて拒否してください。 |
| URL が拒否される | HTTP または HTTPS の URL を入力してください。スキームが欠けている場合、言語サンプルがそれを行うところでは自動的に `https://` に変更されます。 |

</details>

> **レポートを整える準備ができたと言えるのは:** 1 回の実行で Playwright ツールと
> `accessibility_rule_lookup` の名前が挙がり、ブラウザーの根拠をカタログのガイダンスに結びつけたときです。

## 理解度チェック

アクセシブルな名前のない入力を発見すべきツールはどれで、関連する WCAG 基準を説明すべきツールは
どれでしょうか。

<details>
<summary>答えを確認する</summary>

Playwright はライブページ上の入力を見つけます。ローカルのカタログは、アプリケーションの信頼できる
唯一の情報源となる基準と修正方法を返します。

</details>

:::language dotnet
<details>
<summary>Step 5 の完全な実装</summary>

自分の作業を、この Step 5 の完全な実装と比較してください。

```csharp
using GitHub.Copilot;
using HelloCopilotSDK.Helpers;

Console.WriteLine("=== Browser evidence plus application guidance ===\n");

Console.Write("Enter URL to analyze: ");
var urlInput = Console.ReadLine()?.Trim();

if (string.IsNullOrWhiteSpace(urlInput))
{
    Console.Error.WriteLine("Enter a URL to analyze.");
    return;
}

if (!urlInput.Contains("://", StringComparison.Ordinal))
{
    urlInput = $"https://{urlInput}";
}

if (!Uri.TryCreate(urlInput, UriKind.Absolute, out var targetUri) ||
    targetUri.Scheme is not ("http" or "https"))
{
    Console.Error.WriteLine("Enter an absolute HTTP or HTTPS URL.");
    return;
}

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"\nConnected to the Copilot runtime: {ping.Message}\n");

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

Console.WriteLine($"Analyzing: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(
    session,
    $"""
    browser_navigate で {targetUri.AbsoluteUri} を開き、read_latest_accessibility_snapshot を呼び出してください。
    スナップショットで確認できる、確度の高いアクセシビリティ上の課題を 2 件特定してください。
    各課題について accessibility_rule_lookup を呼び出し、次の情報を返してください:
    - ブラウザーで確認した根拠;
    - 該当する基準;
    - カタログが推奨する修正方法。
    """);
```
</details>
:::

:::language nodejs
<details>
<summary>Step 5 の完全な実装</summary>

自分の作業を、この Step 5 の完全な実装と比較してください。

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
    await streamResponse(session, `${target.href} を開いてスナップショットを読み取り、accessibility_rule_lookup を使って根拠に基づく修正案を 1 件提案してください。`);
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
<details>
<summary>Step 5 の完全な実装</summary>

自分の作業を、この Step 5 の完全な実装と比較してください。

```python
import asyncio
import sys
from urllib.parse import urlsplit

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, AssistantMessageDeltaData, SessionErrorData, SessionIdleData, ToolExecutionCompleteData, ToolExecutionStartData

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
                    case ToolExecutionStartData(tool_name=name):
                        print(f"\n[tool:start] {name}")
                    case ToolExecutionCompleteData(success=success):
                        print(f"[tool:done] success={success}")
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData():
                        done.set()

            session.on(on_event)
            await session.send(f"{target} を開いてスナップショットを読み取り、`accessibility_rule_lookup` を使って根拠に基づく推奨事項を 1 件示してください。")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```
</details>
:::

:::language go
<details>
<summary>Step 5 の完全な実装</summary>

自分の作業を、この Step 5 の完全な実装と比較してください。

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	copilot "github.com/github/copilot-sdk/go"
	"github.com/github/copilot-sdk/go/rpc"
)

const maxSnapshotBytes = 1_000_000

type lookupParams struct {
	Query string `json:"query" jsonschema:"The accessibility issue or WCAG criterion to look up."`
}

func accessibilityRuleLookup(params lookupParams, _ copilot.ToolInvocation) (any, error) {
	return map[string]string{
		"criterion":      "4.1.2",
		"query":          params.Query,
		"recommendation": "Associate each input with a visible label.",
	}, nil
}

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

func streamResponse(session *copilot.Session, prompt string) error {
	receivedDelta := false
	unsubscribe := session.On(func(event copilot.SessionEvent) {
		if delta, ok := event.Data.(*copilot.AssistantMessageDeltaData); ok {
			receivedDelta = true
			fmt.Print(delta.DeltaContent)
		}
	})
	defer unsubscribe()
	response, err := session.SendAndWait(context.Background(), copilot.MessageOptions{Prompt: prompt})
	if err == nil && !receivedDelta && response != nil {
		if message, ok := response.Data.(*copilot.AssistantMessageData); ok {
			fmt.Print(message.Content)
		}
	}
	fmt.Println()
	return err
}

func main() {
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
	prompt := fmt.Sprintf(
		"`browser_navigate` で %s を開き、`read_latest_accessibility_snapshot` から根拠を取得してから、`accessibility_rule_lookup` を呼び出して根拠に基づく修正案を 1 件提案してください。",
		target,
	)
	if err := streamResponse(session, prompt); err != nil {
		panic(err)
	}
}
```
</details>
:::

:::language rust
<details>
<summary>Step 5 の完全な実装</summary>

自分の作業を、この Step 5 の完全な実装と比較してください。

```rust
use std::collections::HashSet;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::SystemTime;

use async_trait::async_trait;
use github_copilot_sdk::handler::{PermissionHandler, PermissionResult};
use github_copilot_sdk::tool::{JsonSchema, ToolHandler, schema_for};
use github_copilot_sdk::types::{
    McpServerConfig, McpStdioServerConfig, PermissionRequestData, RequestId, SessionConfig,
    SessionId, Tool, ToolInvocation,
};
use github_copilot_sdk::{Client, ClientOptions, Error, ToolResult};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use url::Url;

const MAX_SNAPSHOT_BYTES: u64 = 1_000_000;

macro_rules! stream_response {
    ($session:expr, $prompt:expr) => {{
        let mut events = $session.subscribe();
        let send = $session.send($prompt);
        tokio::pin!(send);
        let mut sent = false;
        let mut idle = false;
        let mut received_delta = false;

        while !sent || !idle {
            tokio::select! {
                result = &mut send, if !sent => {
                    result?;
                    sent = true;
                }
                event = events.recv() => {
                    let event = event?;
                    match event.event_type.as_str() {
                        "assistant.message_delta" => {
                            if let Some(delta) = event.data.get("deltaContent").and_then(|value| value.as_str()) {
                                received_delta = true;
                                print!("{delta}");
                                io::stdout().flush()?;
                            }
                        }
                        "assistant.message" if !received_delta => {
                            if let Some(content) = event.data.get("content").and_then(|value| value.as_str()) {
                                print!("{content}");
                                io::stdout().flush()?;
                            }
                        }
                        "session.error" => {
                            let message = event.data.get("message").and_then(|value| value.as_str())
                                .unwrap_or("Copilot session failed");
                            return Err(std::io::Error::new(std::io::ErrorKind::Other, message.to_owned()).into());
                        }
                        "session.idle" => idle = true,
                        _ => {}
                    }
                }
            }
        }
        println!();
    }};
}

#[derive(Serialize)]
struct AccessibilityRule {
    criterion: &'static str,
    title: &'static str,
    when_it_applies: &'static str,
    recommendation: &'static str,
    keywords: &'static [&'static str],
}

const RULES: [AccessibilityRule; 6] = [
    AccessibilityRule {
        criterion: "1.1.1",
        title: "Non-text Content",
        when_it_applies: "An informative image has no useful text alternative.",
        recommendation: r#"Add concise alt text that communicates the image purpose. Use alt="" only for decorative images."#,
        keywords: &["image", "alt text", "text alternative"],
    },
    AccessibilityRule {
        criterion: "1.3.1",
        title: "Info and Relationships",
        when_it_applies: "Page structure or relationships are only conveyed visually.",
        recommendation: "Use semantic landmarks and a logical heading hierarchy so structure is programmatically available.",
        keywords: &[
            "main landmark",
            "heading hierarchy",
            "page structure",
            "semantic",
        ],
    },
    AccessibilityRule {
        criterion: "1.4.3",
        title: "Contrast (Minimum)",
        when_it_applies: "Text does not have enough contrast against its background.",
        recommendation: "Provide at least 4.5:1 contrast for normal text and 3:1 for large text.",
        keywords: &["contrast", "low contrast", "color"],
    },
    AccessibilityRule {
        criterion: "2.4.7",
        title: "Focus Visible",
        when_it_applies: "Keyboard focus cannot be seen clearly.",
        recommendation: "Keep a visible, high-contrast focus indicator on every interactive element.",
        keywords: &["focus", "keyboard", "outline"],
    },
    AccessibilityRule {
        criterion: "3.3.2",
        title: "Labels or Instructions",
        when_it_applies: "A form does not provide a persistent visible label or necessary instructions.",
        recommendation: "Provide visible labels and instructions that explain the expected input.",
        keywords: &[
            "visible label",
            "instructions",
            "required field",
            "input format",
        ],
    },
    AccessibilityRule {
        criterion: "4.1.2",
        title: "Name, Role, Value",
        when_it_applies: "A form control has no programmatically determinable accessible name.",
        recommendation: "Associate a visible <label> with the input by using matching for and id values.",
        keywords: &[
            "accessible name",
            "programmatic label",
            "unlabeled input",
            "name role value",
        ],
    },
];

#[derive(Deserialize, JsonSchema)]
struct LookupParams {
    /// The accessibility issue or WCAG criterion to look up.
    query: String,
}

struct AccessibilityRuleLookup;

#[async_trait]
impl ToolHandler for AccessibilityRuleLookup {
    async fn call(&self, invocation: ToolInvocation) -> Result<ToolResult, Error> {
        let params: LookupParams = serde_json::from_value(invocation.arguments)?;
        let query = params.query.trim().to_lowercase();
        let result = RULES.iter().find(|rule| {
            query.contains(&rule.criterion.to_lowercase())
                || query.contains(&rule.title.to_lowercase())
                || rule.keywords.iter().any(|keyword| query.contains(keyword))
        });
        let value = match result {
            Some(rule) => serde_json::to_string(rule).expect("catalog serializes"),
            None => r#"{"criterion":"No exact match","title":"Criterion not found","when_it_applies":"The issue is not represented in the workshop catalog.","recommendation":"Verify the evidence and consult the complete WCAG reference."}"#.to_owned(),
        };
        Ok(ToolResult::Text(value))
    }
}

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

fn combined_tools_prompt(target: &Url) -> String {
    format!(
        r#"`browser_navigate` で {target} を開いてください。
1. `browser_navigate` を使って、指定された URL を開いてください。
2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
3. ブラウザーで観測できる課題を 1 件特定してください。
4. 根拠に基づく修正案を 1 件提案する前に、accessibility_rule_lookup を呼び出してください。"#
    )
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
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
    stream_response!(session, combined_tools_prompt(&target));
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```
</details>
:::

:::language java
## Java のアクセシビリティカタログを拡張する

### 1. 単一ルールの参照を置き換える

Step 3 では、ローカルツールの配線に集中するために 1 つの基準を使いました。ブラウザーで観察可能な
指摘事項をモデルに見つけさせる前に、`lookupRule` をこのアプリケーション所有のカタログに置き換え、
`SnapshotReader` の前に `Rule` レコードを追加します。

```java
private static String lookupRule(String query) {
    String normalized = query.trim().toLowerCase(java.util.Locale.ROOT);
    for (Rule rule : Rule.RULES) {
        if (normalized.contains(rule.criterion().toLowerCase(java.util.Locale.ROOT))
                || normalized.contains(rule.title().toLowerCase(java.util.Locale.ROOT))
                || rule.keywords().stream().anyMatch(normalized::contains)) {
            return rule.toJson();
        }
    }
    return """
            {"criterion":"No exact match","title":"Criterion not found","when_it_applies":"The issue is not represented in the workshop catalog.","recommendation":"Verify the evidence and consult the complete WCAG reference."}""";
}

private record Rule(String criterion, String title, String whenItApplies, String recommendation, List<String> keywords) {
    private static final List<Rule> RULES = List.of(
            new Rule("1.1.1", "Non-text Content", "An informative image has no useful text alternative.", "Add concise alt text that communicates the image purpose. Use alt=\"\" only for decorative images.", List.of("image", "alt text", "text alternative")),
            new Rule("1.3.1", "Info and Relationships", "Page structure or relationships are only conveyed visually.", "Use semantic landmarks and a logical heading hierarchy so structure is programmatically available.", List.of("main landmark", "heading hierarchy", "page structure", "semantic")),
            new Rule("1.4.3", "Contrast (Minimum)", "Text does not have enough contrast against its background.", "Provide at least 4.5:1 contrast for normal text and 3:1 for large text.", List.of("contrast", "low contrast", "color")),
            new Rule("2.4.7", "Focus Visible", "Keyboard focus cannot be seen clearly.", "Keep a visible, high-contrast focus indicator on every interactive element.", List.of("focus", "keyboard", "outline")),
            new Rule("3.3.2", "Labels or Instructions", "A form does not provide a persistent visible label or necessary instructions.", "Provide visible labels and instructions that explain the expected input.", List.of("visible label", "instructions", "required field", "input format")),
            new Rule("4.1.2", "Name, Role, Value", "A form control has no programmatically determinable accessible name.", "Associate a visible <label> with the input by using matching for and id values.", List.of("accessible name", "programmatic label", "unlabeled input", "name role value")));

    private String toJson() {
        return "{\"criterion\":\"%s\",\"title\":\"%s\",\"when_it_applies\":\"%s\",\"recommendation\":\"%s\"}"
                .formatted(criterion, title, whenItApplies, recommendation.replace("\"", "\\\""));
    }
}
```

カタログは引き続きアプリケーション所有のガイダンスのみを提供します。キーワードマッチングにより、後続の
プロンプトは観察された指摘事項について尋ねられる一方で、すべての推奨事項がこの制限された信頼できる
情報源から返された基準を使うよう要求できます。

### 2. ブラウザーの根拠とカタログのガイダンスを組み合わせる

<details>
<summary>Step 5 の完全な実装</summary>

自分の作業を、この Step 5 の完全な実装と比較してください。

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.McpStdioServerConfig;
import com.github.copilot.rpc.MessageOptions;
import com.github.copilot.rpc.PermissionRequestResult;
import com.github.copilot.rpc.SessionConfig;
import com.github.copilot.rpc.ToolDefinition;
import com.github.copilot.tool.Param;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

public final class AccessibilityReport {
    private static final long MAX_SNAPSHOT_BYTES = 1_000_000;
    private static final String LOCAL_DEMO_MCP_FLAG = "--allow-local-demo-mcp";

    private AccessibilityReport() {
    }

    public static void main(String[] args) throws Exception {
        RunOptions options = parseRunOptions(args);
        URI target = options.target();
        Path workingDirectory = Path.of("").toAbsolutePath().normalize();
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
            var response = session.sendAndWait(new MessageOptions().setPrompt(combinedToolsPrompt(target))).get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
    }

    private static URI parseTarget(String value) throws URISyntaxException {
        String candidate = value.contains("://") ? value : "https://" + value;
        URI target = new URI(candidate);
        if (!target.isAbsolute()
                || target.getHost() == null
                || !("http".equalsIgnoreCase(target.getScheme()) || "https".equalsIgnoreCase(target.getScheme()))) {
            throw new IllegalArgumentException("Enter an absolute HTTP or HTTPS URL.");
        }
        return target;
    }

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

    private static boolean isExactNavigation(Map<String, Object> request, URI target) {
        if (request == null
                || !"playwright".equals(request.get("serverName"))
                || !(request.get("toolName") instanceof String toolName)
                || !("browser_navigate".equals(toolName) || "playwright-browser_navigate".equals(toolName))
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

    private static String lookupRule(String query) {
        String normalized = query.trim().toLowerCase(java.util.Locale.ROOT);
        for (Rule rule : Rule.RULES) {
            if (normalized.contains(rule.criterion().toLowerCase(java.util.Locale.ROOT))
                    || normalized.contains(rule.title().toLowerCase(java.util.Locale.ROOT))
                    || rule.keywords().stream().anyMatch(normalized::contains)) {
                return rule.toJson();
            }
        }
        return """
                {"criterion":"No exact match","title":"Criterion not found","when_it_applies":"The issue is not represented in the workshop catalog.","recommendation":"Verify the evidence and consult the complete WCAG reference."}""";
    }

    private static String combinedToolsPrompt(URI target) {
        return """
                Open %s with browser_navigate.
                1. `browser_navigate` を使って、指定された URL を開いてください。
                2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
                3. ブラウザーで観測できる課題を 1 件特定してください。
                4. 根拠に基づく修正案を 1 件提案する前に、accessibility_rule_lookup を呼び出してください。""".formatted(target);
    }

    private record Rule(String criterion, String title, String whenItApplies, String recommendation, List<String> keywords) {
        private static final List<Rule> RULES = List.of(
                new Rule("1.1.1", "Non-text Content", "An informative image has no useful text alternative.", "Add concise alt text that communicates the image purpose. Use alt=\"\" only for decorative images.", List.of("image", "alt text", "text alternative")),
                new Rule("1.3.1", "Info and Relationships", "Page structure or relationships are only conveyed visually.", "Use semantic landmarks and a logical heading hierarchy so structure is programmatically available.", List.of("main landmark", "heading hierarchy", "page structure", "semantic")),
                new Rule("1.4.3", "Contrast (Minimum)", "Text does not have enough contrast against its background.", "Provide at least 4.5:1 contrast for normal text and 3:1 for large text.", List.of("contrast", "low contrast", "color")),
                new Rule("2.4.7", "Focus Visible", "Keyboard focus cannot be seen clearly.", "Keep a visible, high-contrast focus indicator on every interactive element.", List.of("focus", "keyboard", "outline")),
                new Rule("3.3.2", "Labels or Instructions", "A form does not provide a persistent visible label or necessary instructions.", "Provide visible labels and instructions that explain the expected input.", List.of("visible label", "instructions", "required field", "input format")),
                new Rule("4.1.2", "Name, Role, Value", "A form control has no programmatically determinable accessible name.", "Associate a visible <label> with the input by using matching for and id values.", List.of("accessible name", "programmatic label", "unlabeled input", "name role value")));

        private String toJson() {
            return "{\"criterion\":\"%s\",\"title\":\"%s\",\"when_it_applies\":\"%s\",\"recommendation\":\"%s\"}"
                    .formatted(criterion, title, whenItApplies, recommendation.replace("\"", "\\\""));
        }
    }

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
                        .filter(path -> isSafeSnapshot(path))
                        .max(Comparator.comparing(this::modifiedTime))
                        .orElseThrow(() -> new IllegalStateException(
                                "No current-run Playwright snapshot is available. Call browser_navigate first."));
                return Files.readString(newest, StandardCharsets.UTF_8);
            } catch (IOException exception) {
                throw new IllegalStateException("No current-run Playwright snapshot is available. Call browser_navigate first.", exception);
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
}
```
</details>
:::

## 参考資料

- [Custom agents](https://github.com/github/copilot-sdk/blob/main/docs/features/custom-agents.md):
  サブエージェントごとに専用のプロンプトと、利用できるツールを設定する方法です。
- [Fleet mode](https://github.com/github/copilot-sdk/blob/main/docs/features/fleet-mode.md):
  作業を分担できる場合に、複数のサブエージェントへ並行して依頼する方法を説明しています。
- [Hooks overview](https://github.com/github/copilot-sdk/blob/main/docs/hooks/hooks-overview.md):
  各フックが処理のどの段階で呼び出されるかを確認できます。複数のツール呼び出しにまたがるチェックにも役立ちます。

[ステップ 6: 構造化されたレポートを生成する](06-structured-report.md) に進みます。
