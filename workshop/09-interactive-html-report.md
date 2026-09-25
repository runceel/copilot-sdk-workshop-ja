# オプション: インタラクティブな HTML レポートを生成する

> **所要時間:** 15 分  
> **前提条件:** 先に 7 つのコアステップを完了してください。この拡張はオプションの
> モデル選択の後でも動作します。

## 作るもの

Markdown レポートはターミナルで役立ちますが、その指摘事項はブラウザで探索するほうが簡単です。
同じレポートセッションに単一のスタンドアロンな `accessibility-report.html` ファイルを作成させ、
ローカルで開いてその指摘事項をフィルタリングします。

## 限定的な書き込み機能を追加する

これまでのアプリケーション所有のツールは読み取り専用で、Playwright は 1 つの正確な URL にしか
移動できません。この拡張ではランタイム組み込みツールを 1 つ追加します: `builtin:apply_patch`。

これはすべてのファイル変更を承認するという意味では **ありません**。既存のブラウザ移動ルールを維持し、
アプリケーションの作業ディレクトリ内の `accessibility-report.html` を直接対象とする場合にのみ
書き込みを承認してください。シェルコマンド、その他のファイル書き込み、その他すべてのパーミッション
リクエストは拒否します。

レポートのプロンプトは引き続き根拠ベースです。HTML の成果物を書き込む前に、移動し、現在の実行の
スナップショットを読み取り、カタログのガイダンスを参照する必要があります。

:::language dotnet
## .NET の書き込みパーミッションをスコープする

`Helpers/WorkshopPermissionHandler.cs` の `CreateForTarget` を置き換えます。このヘルパーは
アプリケーションディレクトリも受け取るようになり、正規化された 1 つのレポートパスのみを許可します:

```csharp
public static Func<PermissionRequest, PermissionInvocation, Task<PermissionDecision>> CreateForTarget(
    Uri allowedTarget,
    string workingDirectory)
{
    ArgumentNullException.ThrowIfNull(allowedTarget);
    var reportPath = Path.GetFullPath(Path.Combine(workingDirectory, "accessibility-report.html"));

    return (request, _) =>
    {
        var decision = request switch
        {
            PermissionRequestMcp { ServerName: "playwright" } navigation
                when IsPlaywrightTool(navigation, "browser_navigate") &&
                     IsNavigationToTarget(navigation.Args, allowedTarget) =>
                PermissionDecision.ApproveOnce(),
            PermissionRequestWrite write
                when Path.GetFullPath(write.FileName).Equals(reportPath, StringComparison.OrdinalIgnoreCase) =>
                PermissionDecision.ApproveOnce(),
            _ => PermissionDecision.Reject(
                "This workshop allows only exact target navigation and writing accessibility-report.html.")
        };

        return Task.FromResult(decision);
    };
}
```

既存のヘルパーメソッドはそのまま残します。`Program.cs` では既存の `workingDirectory` を渡し、
ソース修飾された組み込みツールを追加します:

```csharp
OnPermissionRequest = WorkshopPermissionHandler.CreateForTarget(targetUri, workingDirectory),
AvailableTools =
[
    "accessibility_rule_lookup",
    "read_latest_accessibility_snapshot",
    "playwright-browser_navigate",
    "builtin:apply_patch"
],
```

`Helpers/Prompts.cs` の `CreateReportPrompt` の本体を置き換えます:

```csharp
public static string CreateReportPrompt(Uri targetUri) => $"""
    次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  {targetUri.AbsoluteUri}.

    1. `browser_navigate` を使って、指定された URL を開いてください。
    2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
    3. スナップショットで確認できる、確度の高い課題を 3〜5 件特定してください。
    4. 修正案を提案する前に、各課題について `accessibility_rule_lookup` を呼び出してください。
    5. `apply_patch` を使い、現在の作業ディレクトリに `accessibility-report.html` だけを作成してください。

    セマンティック HTML、埋め込み CSS、埋め込み JavaScript だけを使って、完全に独立した HTML 文書を 1 つ作成してください。外部アセット、URL、ライブラリは使わないでください。 タイトル、対象 URL、指摘件数、レビューの限界、および根拠のある各課題のカードを含めてください。各カードには根拠、WCAG 基準、修正案を記載してください。 指摘名、基準、根拠でカードを絞り込めるアクセシブルなテキストフィルターを追加し、表示件数を更新してください。 指摘事項のテキストを HTML に挿入する前にすべてエスケープしてください。 キーボードフォーカスを見えるようにしてください。

    ほかのファイルは作成しないでください。 書き込みが成功したら、次の内容だけを返してください:
    Created accessibility-report.html
    """;
```

:::

:::language nodejs
## Node.js の書き込みパーミッションをスコープする

`src/workshop.ts` で、`permissionForTarget` を、正確な移動を保持しつつ正規化された
レポートパスのみを追加するバージョンに置き換えます:

```typescript
export function permissionForTarget(target: URL, workingDirectory: string): PermissionHandler {
  const reportPath = resolve(workingDirectory, "accessibility-report.html");
  return (request) => {
    if (request.kind === "mcp" && request.serverName === "playwright" &&
      (request.toolName === "browser_navigate" || request.toolName === "playwright-browser_navigate") &&
      typeof request.args?.url === "string" && sameUrl(request.args.url, target)) {
      return { kind: "approve-once" };
    }
    if (request.kind === "write" && typeof request.fileName === "string" &&
      resolve(workingDirectory, request.fileName) === reportPath) {
      return { kind: "approve-once" };
    }
    return { kind: "reject", feedback: "This workshop allows only exact target navigation and writing accessibility-report.html." };
  };
}
```

`src/report.ts` で、作業ディレクトリをハンドラーに渡し、組み込みツールを
`availableTools` に追加します:

```typescript
onPermissionRequest: permissionForTarget(target, process.cwd()),
availableTools: [
  "accessibility_rule_lookup",
  "read_latest_accessibility_snapshot",
  "playwright-browser_navigate",
  "builtin:apply_patch",
],
```

`src/workshop.ts` の `reportPrompt` を置き換えます:

```typescript
export function reportPrompt(target: URL): string {
  return `次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  ${target.href}.
1. browser_navigate を使って、指定された URL を開いてください。
2. read_latest_accessibility_snapshot を呼び出して、アクセシビリティツリーを確認してください。
3. スナップショットで確認できる、確度の高い課題を 3〜5 件特定してください。
4. 修正案を提案する前に、各課題について accessibility_rule_lookup を呼び出してください。
5. apply_patch を使い、現在の作業ディレクトリに `accessibility-report.html` だけを作成してください。

セマンティック HTML、埋め込み CSS、埋め込み JavaScript だけを使って、完全に独立した HTML 文書を 1 つ作成してください。外部アセット、URL、ライブラリは使わないでください。 タイトル、対象 URL、指摘件数、レビューの限界、および根拠のある各課題のカードを含めてください。各カードには根拠、WCAG 基準、修正案を記載してください。 指摘名、基準、根拠でカードを絞り込めるアクセシブルなテキストフィルターを追加し、表示件数を更新してください。 指摘事項のテキストを HTML に挿入する前にすべてエスケープしてください。 キーボードフォーカスを見えるようにしてください。

ほかのファイルは作成しないでください。 書き込みが成功したら、次の内容だけを返してください:
Created accessibility-report.html`;
}
```

:::

:::language python
## Python の書き込みパーミッションをスコープする

`workshop.py` で、`permission_for_target` をこのパス対応バージョンに置き換えます:

```python
def permission_for_target(target: str, working_directory: str):
    report_path = Path(working_directory, "accessibility-report.html").resolve()

    def handler(request, _invocation):
        if getattr(request, "kind", None) == "mcp" and request.server_name == "playwright" and request.tool_name in {"browser_navigate", "playwright-browser_navigate"} and isinstance(request.args, dict) and isinstance(request.args.get("url"), str) and _same_url(request.args["url"], target):
            return PermissionDecisionApproveOnce()
        if getattr(request, "kind", None) == "write" and isinstance(getattr(request, "file_name", None), str):
            candidate = Path(request.file_name)
            candidate = candidate if candidate.is_absolute() else Path(working_directory, candidate)
            if candidate.resolve() == report_path:
                return PermissionDecisionApproveOnce()
        return PermissionDecisionReject(
            feedback="This workshop allows only exact target navigation and writing accessibility-report.html.")

    return handler
```

`report.py` で、現在のディレクトリをパーミッションハンドラーに渡し、
ソース修飾された組み込みツールを追加します:

```python
on_permission_request=permission_for_target(target, "."),
available_tools=[
    "accessibility_rule_lookup",
    "read_latest_accessibility_snapshot",
    "playwright-browser_navigate",
    "builtin:apply_patch",
],
```

`workshop.py` の `report_prompt` を置き換えます:

```python
def report_prompt(target: str) -> str:
    return f"""次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  {target}.
1. `browser_navigate` を使って、指定された URL を開いてください。
2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
3. スナップショットで確認できる、確度の高い課題を 3〜5 件特定してください。
4. 修正案を提案する前に、各課題について `accessibility_rule_lookup` を呼び出してください。
5. `apply_patch` を使い、現在の作業ディレクトリに `accessibility-report.html` だけを作成してください。

セマンティック HTML、埋め込み CSS、埋め込み JavaScript だけを使って、完全に独立した HTML 文書を 1 つ作成してください。外部アセット、URL、ライブラリは使わないでください。 タイトル、対象 URL、指摘件数、レビューの限界、および根拠のある各課題のカードを含めてください。各カードには根拠、WCAG 基準、修正案を記載してください。 指摘名、基準、根拠でカードを絞り込めるアクセシブルなテキストフィルターを追加し、表示件数を更新してください。 指摘事項のテキストを HTML に挿入する前にすべてエスケープしてください。 キーボードフォーカスを見えるようにしてください。

ほかのファイルは作成しないでください。 書き込みが成功したら、次の内容だけを返してください:
Created accessibility-report.html"""
```

:::

:::language go
## Go の書き込みパーミッションをスコープする

`main.go` の `permissionForTarget` を置き換えます。書き込み分岐は相対的なファイル名を
アプリケーションの作業ディレクトリに対して解決するため、兄弟パスや親パスは拒否されます:

```go
func permissionForTarget(target, workingDirectory string) copilot.PermissionHandlerFunc {
	reportPath := filepath.Join(workingDirectory, "accessibility-report.html")
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
		if json.Unmarshal(raw, &value) == nil && value["kind"] == "write" {
			if fileName, ok := value["fileName"].(string); ok {
				candidate := fileName
				if !filepath.IsAbs(candidate) {
					candidate = filepath.Join(workingDirectory, candidate)
				}
				if filepath.Clean(candidate) == reportPath {
					return &rpc.PermissionDecisionApproveOnce{}, nil
				}
			}
		}
		feedback := "This workshop allows only exact target navigation and writing accessibility-report.html."
		return &rpc.PermissionDecisionReject{Feedback: &feedback}, nil
	}
}
```

`workingDirectory` をヘルパーに渡し、ソース修飾された組み込みツールを追加します:

```go
AvailableTools:      []string{"accessibility_rule_lookup", "read_latest_accessibility_snapshot", "playwright-browser_navigate", "builtin:apply_patch"},
OnPermissionRequest: permissionForTarget(target, workingDirectory),
```

`reportPrompt` を置き換えます:

```go
func reportPrompt(target string) string {
	return fmt.Sprintf(`次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  %s.
1. `browser_navigate` を使って、指定された URL を開いてください。
2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
3. スナップショットで確認できる、確度の高い課題を 3〜5 件特定してください。
4. 修正案を提案する前に、各課題について `accessibility_rule_lookup` を呼び出してください。
5. `apply_patch` を使い、現在の作業ディレクトリに `accessibility-report.html` だけを作成してください。

セマンティック HTML、埋め込み CSS、埋め込み JavaScript だけを使って、完全に独立した HTML 文書を 1 つ作成してください。外部アセット、URL、ライブラリは使わないでください。 タイトル、対象 URL、指摘件数、レビューの限界、および根拠のある各課題のカードを含めてください。各カードには根拠、WCAG 基準、修正案を記載してください。 指摘名、基準、根拠でカードを絞り込めるアクセシブルなテキストフィルターを追加し、表示件数を更新してください。 指摘事項のテキストを HTML に挿入する前にすべてエスケープしてください。 キーボードフォーカスを見えるようにしてください。

ほかのファイルは作成しないでください。 書き込みが成功したら、次の内容だけを返してください:
Created accessibility-report.html`, target)
}
```

:::

:::language rust
## Rust の書き込みパーミッションをスコープする

`ScopedPermissions` に `report_path: PathBuf` を追加します。ステップ 4 の `permission_payload`
抽出はそのまま維持します。これは SDK がネストされた `permissionRequest` オブジェクトを送信する場合は
それを優先し、古いペイロードでは直接のオブジェクトにフォールバックし、不正な形式のネストされた値は
拒否します。次に、拒否する `else` の前にこの書き込み分岐を追加します:

```rust
let file_name = permission_payload(&request.extra)
    .and_then(|payload| payload.get("fileName"))
    .and_then(serde_json::Value::as_str);
let report_write = request.kind == Some(PermissionRequestKind::Write)
    && file_name.is_some_and(|name| {
    let candidate = Path::new(name);
    let candidate = if candidate.is_absolute() {
        candidate.to_path_buf()
    } else {
        self.report_path.parent().unwrap_or(Path::new("")).join(candidate)
    };
    candidate == self.report_path
    });

if report_write {
    PermissionResult::approve_once()
} else if server == Some("playwright")
    && matches!(tool, Some("browser_navigate" | "playwright-browser_navigate"))
    && requested.as_ref().is_some_and(|url| same_url(url, &self.target))
{
    PermissionResult::approve_once()
} else {
    PermissionResult::reject(Some(
        "This workshop allows only exact target navigation and writing accessibility-report.html."
            .to_owned(),
    ))
}
```

パーミッションハンドラーを作成する際に、新しいフィールドを設定し、組み込みツールを追加します:

```rust
config.available_tools = Some(vec![
    "accessibility_rule_lookup".to_owned(),
    "read_latest_accessibility_snapshot".to_owned(),
    "playwright-browser_navigate".to_owned(),
    "builtin:apply_patch".to_owned(),
]);
let config = config.with_permission_handler(Arc::new(ScopedPermissions {
    target: target.clone(),
    report_path: working_directory.join("accessibility-report.html"),
}));
```

`report_prompt` を置き換えます:

```rust
fn report_prompt(target: &Url) -> String {
    format!(
        r#"次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  {target}.
1. `browser_navigate` を使って、指定された URL を開いてください。
2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
3. スナップショットで確認できる、確度の高い課題を 3〜5 件特定してください。
4. 修正案を提案する前に、各課題について `accessibility_rule_lookup` を呼び出してください。
5. `apply_patch` を使い、現在の作業ディレクトリに `accessibility-report.html` だけを作成してください。

セマンティック HTML、埋め込み CSS、埋め込み JavaScript だけを使って、完全に独立した HTML 文書を 1 つ作成してください。外部アセット、URL、ライブラリは使わないでください。 タイトル、対象 URL、指摘件数、レビューの限界、および根拠のある各課題のカードを含めてください。各カードには根拠、WCAG 基準、修正案を記載してください。 指摘名、基準、根拠でカードを絞り込めるアクセシブルなテキストフィルターを追加し、表示件数を更新してください。 指摘事項のテキストを HTML に挿入する前にすべてエスケープしてください。 キーボードフォーカスを見えるようにしてください。

ほかのファイルは作成しないでください。 書き込みが成功したら、次の内容だけを返してください:
Created accessibility-report.html"#
    )
}
```

:::

:::language java
## Java の書き込みパーミッションをスコープする

`src/main/java/workshop/AccessibilityReport.java` で、`isExactNavigation` の隣にこのヘルパーを追加します:

```java
private static boolean isReportWrite(Map<String, Object> request, Path workingDirectory) {
    if (request == null || !(request.get("fileName") instanceof String fileName)) {
        return false;
    }
    Path candidate = Path.of(fileName);
    if (!candidate.isAbsolute()) {
        candidate = workingDirectory.resolve(candidate);
    }
    return candidate.normalize().equals(
            workingDirectory.resolve("accessibility-report.html").normalize());
}
```

> **Java に関する重要な安全上の警告:** デフォルトのハンドラーは引き続きフェイルクローズです。
> 正確なターゲット検証の後にのみ MCP リクエストを承認し、`accessibility-report.html` のパス検証の
> 後にのみ書き込みリクエストを承認します。現在の Java SDK リリースはこれらのパーミッション
> リクエストのフィールドを公開していません ([github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273))。
> 既存の `--allow-local-demo-mcp` フラグは `mcp` の種類に限定されます。ステップ 9 ではさらに
> `--allow-local-demo-write` が必要で、これは `write` の種類と `builtin:apply_patch` ツールの
> 許可リストに限定されますが、**出力パスを強制することはできません**。両方のフラグは、
> ワークショップ用の使い捨てローカルデモでのみ有効にしてください。本番環境、共有環境、または
> 信頼できないワークツリーでは、どちらのフォールバックも決して使用しないでください。

別の書き込みフォールバックを追加するには、ステップ 4 のパーサーを次のように置き換えます:

```java
private static final String LOCAL_DEMO_MCP_FLAG = "--allow-local-demo-mcp";
private static final String LOCAL_DEMO_WRITE_FLAG = "--allow-local-demo-write";

private static RunOptions parseRunOptions(String[] args) throws URISyntaxException {
    boolean allowLocalDemoMcp = false;
    boolean allowLocalDemoWrite = false;
    String target = null;
    for (String arg : args) {
        if (LOCAL_DEMO_MCP_FLAG.equals(arg)) {
            if (allowLocalDemoMcp) {
                throw new IllegalArgumentException("Specify " + LOCAL_DEMO_MCP_FLAG + " at most once.");
            }
            allowLocalDemoMcp = true;
            continue;
        }
        if (LOCAL_DEMO_WRITE_FLAG.equals(arg)) {
            if (allowLocalDemoWrite) {
                throw new IllegalArgumentException("Specify " + LOCAL_DEMO_WRITE_FLAG + " at most once.");
            }
            allowLocalDemoWrite = true;
            continue;
        }
        if (target == null) {
            target = arg;
        } else {
            throw new IllegalArgumentException(usage());
        }
    }
    if (target == null) {
        throw new IllegalArgumentException(usage());
    }
    return new RunOptions(parseTarget(target), allowLocalDemoMcp, allowLocalDemoWrite);
}

private record RunOptions(URI target, boolean allowLocalDemoMcp, boolean allowLocalDemoWrite) {
}
```

既存の `setAvailableTools` の呼び出しとパーミッションコールバックを拡張します:

```java
.setAvailableTools(List.of(
        "accessibility_rule_lookup",
        "read_latest_accessibility_snapshot",
        "playwright-browser_navigate",
        "builtin:apply_patch"))
// Keep the existing MCP server configuration.
.setOnPermissionRequest((request, ignored) -> {
    if ("mcp".equals(request.getKind())
            && isExactNavigation(request.getExtensionData(), target)) {
        return java.util.concurrent.CompletableFuture.completedFuture(
                PermissionRequestResult.approveOnce());
    }
    if ("write".equals(request.getKind())
            && isReportWrite(request.getExtensionData(), workingDirectory)) {
        return java.util.concurrent.CompletableFuture.completedFuture(
                PermissionRequestResult.approveOnce());
    }
    if (options.allowLocalDemoMcp() && "mcp".equals(request.getKind())) {
        return java.util.concurrent.CompletableFuture.completedFuture(
                PermissionRequestResult.approveOnce());
    }
    if (options.allowLocalDemoWrite() && "write".equals(request.getKind())) {
        return java.util.concurrent.CompletableFuture.completedFuture(
                PermissionRequestResult.approveOnce());
    }
    return java.util.concurrent.CompletableFuture.completedFuture(
            PermissionRequestResult.reject(
                    "This workshop allows only exact target navigation and writing accessibility-report.html. "
                            + "Requests without target or path data remain denied unless the explicit "
                            + "local-demo fallback for that permission kind is enabled."));
})
```

`reportPrompt` を置き換えます:

```java
private static String reportPrompt(URI target) {
    return """
            次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  %s.
            1. `browser_navigate` を使って、指定された URL を開いてください。
            2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
            3. スナップショットで確認できる、確度の高い課題を 3〜5 件特定してください。
            4. 修正案を提案する前に、各課題について `accessibility_rule_lookup` を呼び出してください。
            5. `apply_patch` を使い、現在の作業ディレクトリに `accessibility-report.html` だけを作成してください。

            セマンティック HTML、埋め込み CSS、埋め込み JavaScript だけを使って、完全に独立した HTML 文書を 1 つ作成してください。外部アセット、URL、ライブラリは使わないでください。 タイトル、対象 URL、指摘件数、レビューの限界、および根拠のある各課題のカードを含めてください。各カードには根拠、WCAG 基準、修正案を記載してください。 指摘名、基準、根拠でカードを絞り込めるアクセシブルなテキストフィルターを追加し、表示件数を更新してください。 指摘事項のテキストを HTML に挿入する前にすべてエスケープしてください。 キーボードフォーカスを見えるようにしてください。

            ほかのファイルは作成しないでください。 書き込みが成功したら、次の内容だけを返してください:
            Created accessibility-report.html""".formatted(target);
}
```

:::

## 実行する

:::language dotnet
```bash
dotnet run
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
mvn compile exec:java -Dexec.args="--allow-local-demo-mcp --allow-local-demo-write {{TARGET_APP_URL}}"
```
:::

ワークショップのターゲットを使用します:

```text
{{TARGET_APP_URL}}
```

ツールのトランスクリプトには、既存の移動、スナップショット、カタログの呼び出しに加えて、
`apply_patch` の書き込みが含まれているはずです。`accessibility-report.html` をブラウザで開きます。
指摘事項、WCAG 基準、または根拠の行から単語をフィルターに入力し、表示されるカードと結果件数が
更新されることを確認します。

<details>
<summary>この拡張のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| 書き込みが拒否される | デフォルトのハンドラーは正確な `accessibility-report.html` パスを必要とします。Java SDK のペイロードフィールドが利用できない場合は、ワークショップ用の使い捨てローカルデモでのみ `--allow-local-demo-write` を使用してください。これは `write` の種類を承認しますが、パスを証明することはできません。 |
| 複数のファイルがリクエストされる | 新しい組み込み機能には `builtin:apply_patch` のみを残してください。デフォルトのハンドラーは他のパスを拒否します。Java のローカルデモ書き込みフォールバックはその保証をできません。 |
| フィルターが機能しない | 生成されるドキュメントには、カードをフィルタリングしてライブの結果件数を更新する組み込みの JavaScript が含まれている必要があります。エージェントが必要な要素を省略した場合は、一度再実行してください。 |
| レポートがスタイルなしで読み込まれる | CSS と JavaScript は 1 つの HTML ファイルに埋め込んだままにしてください。プロンプトは意図的に外部アセットやライブラリを禁止しています。 |

</details>

> **この拡張が完了する条件:** `accessibility-report.html` がローカルで開き、
> 根拠に基づいた指摘事項をフィルタリングできること。デフォルトの正確なハンドラーでは、
> セッションは他のファイルパスを承認しません。Java のローカルデモ書き込みフォールバックは
> 意図的にその保証をできません。

## 理解度チェック

1 つの名前付き組み込み書き込みツールを許可することが、ファイルシステムへのアクセスを広く承認するよりも
安全なのはなぜですか?

<details>
<summary>答えを確認する</summary>

`builtin:apply_patch` は必要な編集機能のみを公開し、デフォルトのパーミッション
コールバックはその機能を 1 つの正規化された出力パスに結び付けます。モデルはシェルコマンドを使ったり
別のファイルを書き込んだりすることはできず、既存のローカルツールとスコープされた Playwright の移動は
変更されないままです。Java のローカルデモフォールバックは、SDK がパーミッションペイロードの
フィールドを省略している間だけ使える明示的な例外です。ワークショップ用の使い捨てローカルデモでのみ使用してください。

</details>

## 参考資料

- [Pre-tool-use hook](https://github.com/github/copilot-sdk/blob/main/docs/hooks/pre-tool-use.md):
  ツールを実行する前に、コードで呼び出しを許可・拒否したり、内容を書き換えたりできます。
- [Hooks reference](https://github.com/github/copilot-sdk/blob/main/docs/hooks/README.md):
  SDK が提供するフックの一覧と、それぞれに渡される情報を確認できます。
- [Local CLI setup](https://github.com/github/copilot-sdk/blob/main/docs/setup/local-cli.md):
  SDK が起動する Copilot CLI の指定方法と、CLI がファイルを書き込む場所の設定方法を説明しています。

[ステップ 7: アプリケーションを実行して説明する](07-run-explain.md) に戻ります。
