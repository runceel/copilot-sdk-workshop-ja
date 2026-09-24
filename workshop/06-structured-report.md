# ステップ 6: 構造化されたレポートを生成する

> **所要時間:** 10 分

## 生成するもの

ページの根拠、基準へのマッピング、修正方法、そしてレビューの限界を切り分けた、簡潔なレポートを
生成します。

## 根拠と解釈を切り分ける

エージェントの応答には**根拠**と**解釈**が含まれます。根拠とは、アクセシブルな名前を持たない入力
要素のように、Playwright が観測した内容のことです。解釈とは、その根拠とカタログの結果に基づいた、
基準へのマッピングと修正方法のことです。

明確な出力コントラクトは、何を含め、何を除外し、不確実性をどう扱うかをエージェントに伝えます。
これにより、レビューが網羅的であると主張することなく、レポートの一貫性を高められます。

## 結果を誇張せずに役立てる

1 回の自動スナップショットでは、アクセシビリティ適合性を立証できません。レポートは、根拠のない統計
や飾りとしての重大度ラベル、あるいはページが WCAG に合格・不合格であるという大雑把な主張を避け、
確度の高い指摘事項にとどめるべきです。

これでエージェントは、`browser evidence + catalog result` を、限定的で再現可能なレポートへと変換
します。

## レポートにコントラクトを与える

:::language dotnet
### 1. レポートコントラクトを追加する

`Helpers/Prompts.cs` を作成します。

```csharp
namespace HelloCopilotSDK.Helpers;

public static class Prompts
{
    public static string CreateReportPrompt(Uri targetUri) => $"""
        Prepare an evidence-based accessibility review of {targetUri.AbsoluteUri}.

        1. Use browser_navigate to open that exact URL.
        2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
        3. Identify three to five high-confidence issues supported by the snapshot.
        4. Call accessibility_rule_lookup for each issue before recommending a fix.

        Return only this structure:

        # Accessibility review
        ## Finding 1: <short name>
        - Evidence: <specific element or page structure observed in the browser>
        - WCAG criterion: <criterion and title returned by the catalog>
        - Recommended remediation: <specific implementation change>

        Repeat the finding section as needed.

        ## Review limits
        State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.

        Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant.
        """;
}
```

> **日本語補足（プロンプト）:** 指定した URL をブラウザで開き、最新のアクセシビリティスナップショットと WCAG カタログを根拠に、3〜5 件の高確度な指摘を構造化レポートとして返すよう依頼しています。各指摘に具体的な根拠、基準、修正案があり、最後にレビューの限界が明示され、根拠のない統計や適合宣言がないことを確認します。

:::
:::language dotnet
### 2. コントラクトを使う

`Program.cs` の最後の送信呼び出しを置き換えます。

```csharp
Console.WriteLine($"\nAnalyzing: {targetUri.AbsoluteUri}\n");
await ResponseStreamer.SendAndPrintAsync(session, Prompts.CreateReportPrompt(targetUri));
```
:::

:::language nodejs
### 1. レポートコントラクトを追加する

`src/workshop.ts` に `reportPrompt` を追加、または置き換えます。

```typescript
export function reportPrompt(target: URL): string {
  return `Prepare an evidence-based accessibility review of ${target.href}.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
3. Identify three to five high-confidence issues supported by the snapshot.
4. Call accessibility_rule_lookup for each issue before recommending a fix.

Return only this structure:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific element or page structure observed in the browser>
- WCAG criterion: <criterion and title returned by the catalog>
- Recommended remediation: <specific implementation change>
Repeat the finding section as needed.
## Review limits
State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant.`;
}
```

> **日本語補足（プロンプト）:** 指定した URL をブラウザで開き、最新のアクセシビリティスナップショットと WCAG カタログを根拠に、3〜5 件の高確度な指摘を構造化レポートとして返すよう依頼しています。各指摘に具体的な根拠、基準、修正案があり、最後にレビューの限界が明示され、根拠のない統計や適合宣言がないことを確認します。

:::
:::language nodejs
### 2. レポートのエントリーポイントを作成する

URL の解析、セッション設定、プロンプトを含む `src/report.ts` を作成、または置き換えます。

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import { accessibilityRuleLookup, createSnapshotReader, permissionForTarget, reportPrompt, streamResponse } from "./workshop.js";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm start -- <http-or-https-url>");
const target = new URL(input.includes("://") ? input : `https://${input}`);
if (!["http:", "https:"].includes(target.protocol)) throw new Error("Enter an absolute HTTP or HTTPS URL.");
const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({
    streaming: true, onPermissionRequest: permissionForTarget(target),
    tools: [accessibilityRuleLookup, createSnapshotReader(process.cwd())],
    availableTools: ["accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"],
    mcpServers: { playwright: { command: "npx", args: ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"], workingDirectory: process.cwd(), tools: ["browser_navigate"] } },
  });
  try { await streamResponse(session, reportPrompt(target)); } finally { await session.disconnect(); }
} finally { await client.stop(); }
```

:::
:::language nodejs
### 3. パッケージの start をレポートのエントリーポイントに向ける

パッケージの start コマンドがレポートのエントリーポイントを起動するように、`src/index.ts` を
置き換えます。

```typescript
import "./report.js";
```
:::

:::language python
### 1. レポートコントラクトを追加する

`workshop.py` に `report_prompt` を追加、または置き換えます。

```python
def report_prompt(target: str) -> str:
    return f"""Prepare an evidence-based accessibility review of {target}.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
3. Identify three to five high-confidence issues supported by the snapshot.
4. Call accessibility_rule_lookup for each issue before recommending a fix.

Return only this structure:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific element or page structure observed in the browser>
- WCAG criterion: <criterion and title returned by the catalog>
- Recommended remediation: <specific implementation change>
Repeat the finding section as needed.
## Review limits
State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant."""
```

> **日本語補足（プロンプト）:** 指定した URL をブラウザで開き、最新のアクセシビリティスナップショットと WCAG カタログを根拠に、3〜5 件の高確度な指摘を構造化レポートとして返すよう依頼しています。各指摘に具体的な根拠、基準、修正案があり、最後にレビューの限界が明示され、根拠のない統計や適合宣言がないことを確認します。

:::
:::language python
### 2. レポートのエントリーポイントを作成する

URL の解析、セッション設定、ストリーミング、レポートプロンプトを含む `report.py` を作成、または
置き換えます。

```python
import asyncio
import sys
from urllib.parse import urlsplit

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, AssistantMessageDeltaData, SessionErrorData, SessionIdleData, ToolExecutionCompleteData, ToolExecutionStartData

from workshop import accessibility_rule_lookup, create_snapshot_reader, permission_for_target, report_prompt


async def main() -> None:
    target = sys.argv[1] if len(sys.argv) == 2 else input("Enter URL to analyze: ").strip()
    target = target if "://" in target else f"https://{target}"
    if urlsplit(target).scheme not in {"http", "https"}:
        raise ValueError("Enter an absolute HTTP or HTTPS URL.")
    async with CopilotClient() as client:
        async with await client.create_session(streaming=True, on_permission_request=permission_for_target(target), tools=[accessibility_rule_lookup, create_snapshot_reader(".")], available_tools=["accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"], mcp_servers={"playwright": {"command": "npx", "args": ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"], "working_directory": ".", "tools": ["browser_navigate"]}}) as session:
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
                    case ToolExecutionStartData(tool_name=name): print(f"\n[tool:start] {name}")
                    case ToolExecutionCompleteData(success=success): print(f"[tool:done] success={success}")
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData(): done.set()
            session.on(on_event)
            await session.send(report_prompt(target))
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```
:::
:::language python
### 3. ドキュメントに記載のコマンドをレポートのエントリーポイントに向ける

ドキュメントに記載のコマンドがレポートのエントリーポイントを起動するように、`main.py` を
置き換えます。

```python
from report import main

import asyncio

if __name__ == "__main__":
    asyncio.run(main())
```
:::

:::language go
### 1. レポートコントラクトを追加する

`main.go` に `reportPrompt` を追加します。

```go
func reportPrompt(target string) string {
	return fmt.Sprintf(`Prepare an evidence-based accessibility review of %s.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot for browser-observable evidence.
3. Call accessibility_rule_lookup before each recommendation.

Return only:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific browser evidence>
- WCAG criterion: <catalog result>
- Recommended remediation: <specific change>
## Review limits
State that this focused review is not a full WCAG conformance audit.`, target)
}
```

> **日本語補足（プロンプト）:** 指定した URL をブラウザで開き、スナップショットと WCAG カタログを根拠に、アクセシビリティレビューを決められた見出し構成で返すよう依頼しています。各指摘にブラウザで観測した根拠、カタログ結果、具体的な修正案があり、レビューが完全な適合監査ではないことを明示しているか確認します。

:::
:::language go
### 2. ターゲットを解析してコントラクトを使う

URL 引数を検証し、3 つのツールを持つセッションを構築し、レポートプロンプトを送信するように、`main`
を置き換えます。

```go
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
	if err := streamResponse(session, reportPrompt(target)); err != nil {
		panic(err)
	}
}
```
:::

:::language rust
### 1. レポートコントラクトを追加する

`src/main.rs` に `report_prompt` を追加します。

```rust
fn report_prompt(target: &Url) -> String {
    format!(
        r#"Prepare an evidence-based accessibility review of {target}.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
3. Identify three to five high-confidence issues supported by the snapshot.
4. Call accessibility_rule_lookup for each issue before recommending a fix.

Return only this structure:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific element or page structure observed in the browser>
- WCAG criterion: <criterion and title returned by the catalog>
- Recommended remediation: <specific implementation change>
Repeat the finding section as needed.
## Review limits
State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant."#
    )
}
```

> **日本語補足（プロンプト）:** 指定した URL をブラウザで開き、最新のアクセシビリティスナップショットと WCAG カタログを根拠に、3〜5 件の高確度な指摘を構造化レポートとして返すよう依頼しています。各指摘に具体的な根拠、基準、修正案があり、最後にレビューの限界が明示され、根拠のない統計や適合宣言がないことを確認します。

:::
:::language rust
### 2. ターゲットを解析してコントラクトを使う

URL 引数を検証し、3 つのツールを持つセッションを構築し、レポートプロンプトを送信するように、`main`
を置き換えます。

```rust
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
    stream_response!(session, report_prompt(&target));
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```
:::

:::language java
### 1. レポートコントラクトを追加する

`src/main/java/workshop/AccessibilityReport.java` に `reportPrompt` を追加します。

```java
private static String reportPrompt(URI target) {
    return """
            Prepare an evidence-based accessibility review of %s.
            1. Use browser_navigate to open that exact URL.
            2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
            3. Identify three to five high-confidence issues supported by the snapshot.
            4. Call accessibility_rule_lookup for each issue before recommending a fix.

            Return only this structure:
            # Accessibility review
            ## Finding 1: <short name>
            - Evidence: <specific element or page structure observed in the browser>
            - WCAG criterion: <criterion and title returned by the catalog>
            - Recommended remediation: <specific implementation change>
            Repeat the finding section as needed.
            ## Review limits
            State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
            Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant.""".formatted(target);
}
```

> **日本語補足（プロンプト）:** 指定した URL をブラウザで開き、最新のアクセシビリティスナップショットと WCAG カタログを根拠に、3〜5 件の高確度な指摘を構造化レポートとして返すよう依頼しています。各指摘に具体的な根拠、基準、修正案があり、最後にレビューの限界が明示され、根拠のない統計や適合宣言がないことを確認します。

ステップ 4 のパーミッションコールバックはそのままにしておきます。管理下のワークショップ用ターゲット
に対して明示的に `--allow-local-demo-mcp` を渡さない限り、フェイルクローズドのままです。この一時的な
`mcp` 種別限定のフォールバックは、[github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273)
がリクエストのペイロードを公開しないため、正確な URL を証明しません。使い捨てのローカルワークショップ
デモ以外では使用しないでください。
:::
:::language java
### 2. ターゲットを解析してコントラクトを使う

URL 引数を検証し、3 つのツールを持つセッションを構築し、レポートプロンプトを送信するように、`main`
を置き換えます。

```java
private static final String LOCAL_DEMO_MCP_FLAG = "--allow-local-demo-mcp";

public static void main(String[] args) throws Exception {
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

    try (var client = new CopilotClient()) {
        client.start().get();
        var session = client.createSession(config).get();
        var response = session.sendAndWait(new MessageOptions().setPrompt(reportPrompt(target))).get();
        if (response == null) {
            throw new IllegalStateException("Copilot completed without an assistant message.");
        }
        System.out.println(response.getData().content());
    }
}
```

実装の `parseTarget` とフォールバックのヘルパーを `main` の隣に配置しておきます。

```java
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
```
:::

## 実行する

:::language dotnet
```bash
dotnet run
```

アプリが URL を尋ねてきたら、次を貼り付けます。

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

レポートは次のような形になるはずです。

```text
# Accessibility review
## Finding 1: Input has no accessible name
- Evidence: The snapshot contains a textbox with no accessible name.
- WCAG criterion: 4.1.2 Name, Role, Value
- Recommended remediation: Associate a visible label using matching for and id values.

## Review limits
This focused review uses browser-observable evidence and is not a full WCAG conformance audit.
```

> **日本語補足（出力例）:** 見出し、指摘事項、根拠、WCAG 基準、推奨修正、レビューの限界がそろっている状態が成功例です。特に Evidence がブラウザで観測した内容に基づき、最後に完全な WCAG 適合監査ではないことを明示している点を確認します。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| 出力に裏付けのない件数が含まれる | 裏付けのない統計を報告しないようにプロンプトで指示していることを確認します。 |
| 指摘事項に具体的な要素や構造がない | 根拠が不十分なものとして扱い、レポートコントラクトに根拠の要件を残します。 |
| 応答が WCAG 適合を主張する | 必須の **Review limits** セクション（レビューの限界）と明示的な禁止事項を残します。 |
| パッケージが以前のエントリーポイントを実行し続ける | start コマンドをお使いの言語のステップ 6 のレポートエントリーポイントに向けます。 |
| URL が拒否される | HTTP または HTTPS の URL を渡します。スキームがない場合は自動的に `https://` に変更されます。 |

</details>

> **最終実行の準備ができたと言えるのは:** 各指摘事項に具体的なブラウザの根拠、カタログの基準、
> 修正方法が含まれ、レポートがその限界で締めくくられているときです。

## 理解度チェック

レポートの中で、どの内容が直接の根拠で、どの内容がモデルの解釈でしょうか。

<details>
<summary>答えを確認する</summary>

Playwright が返した要素やページ構造が根拠です。基準を選び、修正方法を記述することは、その根拠と
カタログの結果に基づく解釈です。

</details>

:::language dotnet
<details>
<summary>ステップ 6 の完成版実装</summary>

比較用として、[`finished/dotnet/accessibility-report`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/dotnet/accessibility-report)
プロジェクトを使用してください。

```csharp
using GitHub.Copilot;
using HelloCopilotSDK.Helpers;

Console.WriteLine("=== Accessibility Report Generator ===\n");

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
await ResponseStreamer.SendAndPrintAsync(session, Prompts.CreateReportPrompt(targetUri));
```
</details>
:::

:::language nodejs
<details>
<summary>ステップ 6 の完成版実装</summary>

比較用として、[`finished/nodejs/accessibility-report`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/nodejs/accessibility-report)
プロジェクトを使用してください。

`src/index.ts`:

```typescript
import "./report.js";
```

`src/report.ts`:

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import { accessibilityRuleLookup, createSnapshotReader, permissionForTarget, reportPrompt, streamResponse } from "./workshop.js";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm start -- <http-or-https-url>");
const target = new URL(input.includes("://") ? input : `https://${input}`);
if (!["http:", "https:"].includes(target.protocol)) throw new Error("Enter an absolute HTTP or HTTPS URL.");
const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({
    streaming: true, onPermissionRequest: permissionForTarget(target),
    tools: [accessibilityRuleLookup, createSnapshotReader(process.cwd())],
    availableTools: ["accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"],
    mcpServers: { playwright: { command: "npx", args: ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"], workingDirectory: process.cwd(), tools: ["browser_navigate"] } },
  });
  try { await streamResponse(session, reportPrompt(target)); } finally { await session.disconnect(); }
} finally { await client.stop(); }
```

`reportPrompt`(`src/workshop.ts` 内):

```typescript
export function reportPrompt(target: URL): string {
  return `Prepare an evidence-based accessibility review of ${target.href}.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
3. Identify three to five high-confidence issues supported by the snapshot.
4. Call accessibility_rule_lookup for each issue before recommending a fix.

Return only this structure:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific element or page structure observed in the browser>
- WCAG criterion: <criterion and title returned by the catalog>
- Recommended remediation: <specific implementation change>
Repeat the finding section as needed.
## Review limits
State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant.`;
}
```
</details>
:::

:::language python
<details>
<summary>ステップ 6 の完成版実装</summary>

比較用として、[`finished/python/accessibility-report`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/python/accessibility-report)
プロジェクトを使用してください。

`main.py`:

```python
from report import main

import asyncio

if __name__ == "__main__":
    asyncio.run(main())
```

`report.py`:

```python
import asyncio
import sys
from urllib.parse import urlsplit

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, AssistantMessageDeltaData, SessionErrorData, SessionIdleData, ToolExecutionCompleteData, ToolExecutionStartData

from workshop import accessibility_rule_lookup, create_snapshot_reader, permission_for_target, report_prompt


async def main() -> None:
    target = sys.argv[1] if len(sys.argv) == 2 else input("Enter URL to analyze: ").strip()
    target = target if "://" in target else f"https://{target}"
    if urlsplit(target).scheme not in {"http", "https"}:
        raise ValueError("Enter an absolute HTTP or HTTPS URL.")
    async with CopilotClient() as client:
        async with await client.create_session(streaming=True, on_permission_request=permission_for_target(target), tools=[accessibility_rule_lookup, create_snapshot_reader(".")], available_tools=["accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate"], mcp_servers={"playwright": {"command": "npx", "args": ["-y", "@playwright/mcp@0.0.78", "--browser=msedge", "--output-dir", ".playwright-mcp", "--output-mode", "file"], "working_directory": ".", "tools": ["browser_navigate"]}}) as session:
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
                    case ToolExecutionStartData(tool_name=name): print(f"\n[tool:start] {name}")
                    case ToolExecutionCompleteData(success=success): print(f"[tool:done] success={success}")
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData(): done.set()
            session.on(on_event)
            await session.send(report_prompt(target))
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

`report_prompt`(`workshop.py` 内):

```python
def report_prompt(target: str) -> str:
    return f"""Prepare an evidence-based accessibility review of {target}.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
3. Identify three to five high-confidence issues supported by the snapshot.
4. Call accessibility_rule_lookup for each issue before recommending a fix.

Return only this structure:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific element or page structure observed in the browser>
- WCAG criterion: <criterion and title returned by the catalog>
- Recommended remediation: <specific implementation change>
Repeat the finding section as needed.
## Review limits
State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant."""
```
</details>
:::

:::language go
<details>
<summary>ステップ 6 の完成版実装</summary>

比較用として、[`finished/go/accessibility-report`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/go/accessibility-report)
プロジェクトを使用してください。レポートコントラクトとエントリーポイントは次のとおりです。

```go
func reportPrompt(target string) string {
	return fmt.Sprintf(`Prepare an evidence-based accessibility review of %s.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot for browser-observable evidence.
3. Call accessibility_rule_lookup before each recommendation.

Return only:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific browser evidence>
- WCAG criterion: <catalog result>
- Recommended remediation: <specific change>
## Review limits
State that this focused review is not a full WCAG conformance audit.`, target)
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
	if err := streamResponse(session, reportPrompt(target)); err != nil {
		panic(err)
	}
}
```
</details>
:::

:::language rust
<details>
<summary>ステップ 6 の完成版実装</summary>

比較用として、[`finished/rust/accessibility-report`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/rust/accessibility-report)
プロジェクトを使用してください。レポートコントラクトとエントリーポイントは次のとおりです。

```rust
fn report_prompt(target: &Url) -> String {
    format!(
        r#"Prepare an evidence-based accessibility review of {target}.
1. Use browser_navigate to open that exact URL.
2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
3. Identify three to five high-confidence issues supported by the snapshot.
4. Call accessibility_rule_lookup for each issue before recommending a fix.

Return only this structure:
# Accessibility review
## Finding 1: <short name>
- Evidence: <specific element or page structure observed in the browser>
- WCAG criterion: <criterion and title returned by the catalog>
- Recommended remediation: <specific implementation change>
Repeat the finding section as needed.
## Review limits
State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant."#
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
    stream_response!(session, report_prompt(&target));
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```
</details>
:::

:::language java
<details>
<summary>ステップ 6 の完成版実装</summary>

比較用として、[`finished/java/accessibility-report`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/java/accessibility-report)
プロジェクトを使用してください。レポートコントラクト、引数の解析、エントリーポイントは次のとおりです。

```java
private static final String LOCAL_DEMO_MCP_FLAG = "--allow-local-demo-mcp";

public static void main(String[] args) throws Exception {
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

    try (var client = new CopilotClient()) {
        client.start().get();
        var session = client.createSession(config).get();
        var response = session.sendAndWait(new MessageOptions().setPrompt(reportPrompt(target))).get();
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

private static String reportPrompt(URI target) {
    return """
            Prepare an evidence-based accessibility review of %s.
            1. Use browser_navigate to open that exact URL.
            2. Call read_latest_accessibility_snapshot to inspect its accessibility tree.
            3. Identify three to five high-confidence issues supported by the snapshot.
            4. Call accessibility_rule_lookup for each issue before recommending a fix.

            Return only this structure:
            # Accessibility review
            ## Finding 1: <short name>
            - Evidence: <specific element or page structure observed in the browser>
            - WCAG criterion: <criterion and title returned by the catalog>
            - Recommended remediation: <specific implementation change>
            Repeat the finding section as needed.
            ## Review limits
            State that this is a focused review of browser-observable evidence, not a full WCAG conformance audit.
            Do not invent evidence, report unsupported statistics, or claim the page is WCAG compliant.""".formatted(target);
}
```
</details>
:::

## さらに学ぶ

- [User prompt submitted hook](https://github.com/github/copilot-sdk/blob/main/docs/hooks/user-prompt-submitted.md):
  ランタイムが送信する前に、コード内でプロンプトを変更または拒否します。
- [User prompt transformed hook](https://github.com/github/copilot-sdk/blob/main/docs/hooks/user-prompt-transformed.md):
  ランタイムが実際にあなたのテキストから構築した、モデル向けのプロンプトを検査します。
- [Citations](https://github.com/github/copilot-sdk/blob/main/docs/features/citations.md):
  応答の各スパンを、それを裏付ける素材に結び付ける実験的な方法です。

[ステップ 7: アプリケーションを実行して説明する](07-run-explain.md)に進みます。
