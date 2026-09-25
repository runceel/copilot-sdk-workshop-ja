# ステップ 3: アプリ独自の知識を追加する

> **所要時間:** 15 分

## 追加するもの

Copilot に、アプリケーションが所有する Web Content Accessibility Guidelines (WCAG) カタログから正確な基準と是正策を取得する、型付きのローカルツールを与えます。

## アプリが所有するツールを Copilot に与える

**ツール呼び出し (Tool calling)** は、モデルが回答の作成中に機能をリクエストできるようにする仕組みです。
[**ローカルツール**](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md#how-tools-work)
はアプリケーションのプロセス内で実行されます。モデルはいつリクエストするかを決めますが、データ、検証、実行、結果は依然としてあなたのコードが所有します。

このステップでは、アプリケーションが所有する WCAG ガイダンスを `accessibility_rule_lookup` として公開し、そのツールをセッションに登録して、明示的にモデルが利用できるようにします。

## 独自の信頼できる情報源を持ち込む

モデルの一般的な知識は、アプリケーションが所有するデータの代わりにはなりません。このローカルツールは、カタログ全体をすべてのプロンプトに含める代わりに、テスト可能な決定論的コードから小さく正確な結果を返します。

このツールはアプリケーションが所有するデータを読み取るだけなので、`skip permission` を意図的に使っています。次のステップでは外部 MCP プロセスを使うため、パーミッション境界を設けます。

:::language dotnet
## C# のルックアップを組み込む

### 1. カタログルックアップツールを追加する

`Helpers/AccessibilityRuleCatalog.cs` の先頭に、次を挿入します。

```csharp
using System.ComponentModel;
using GitHub.Copilot;
using Microsoft.Extensions.AI;
```

`AccessibilityRuleCatalog` の内部、既存の `Rules` 配列の後に、次を挿入します。

```csharp
public static AIFunction CreateLookupTool() => CopilotTool.DefineTool(
    ([Description("調べたいアクセシビリティ上の問題、または WCAG の達成基準。")] string query) =>
        Task.FromResult(Lookup(query)),
    toolOptions: new CopilotToolOptions { SkipPermission = true },
    factoryOptions: new AIFunctionFactoryOptions
    {
        Name = "accessibility_rule_lookup",
        Description = "アプリ内のカタログから、該当する WCAG の達成基準と修正方法を読み取ります。"
    });

public static AccessibilityRule Lookup(string query)
{
    var normalizedQuery = query.Trim();
    return Rules.FirstOrDefault(rule =>
               normalizedQuery.Contains(rule.Criterion, StringComparison.OrdinalIgnoreCase) ||
               normalizedQuery.Contains(rule.Title, StringComparison.OrdinalIgnoreCase) ||
               rule.Keywords.Any(keyword =>
                   normalizedQuery.Contains(keyword, StringComparison.OrdinalIgnoreCase)))
           ?? new AccessibilityRule(
               "該当なし",
               "達成基準が見つかりません",
               "この問題に対応する達成基準は、ワークショップのカタログに登録されていません。",
               "根拠を確認し、WCAG の公式資料を参照してください。",
               []);
}
```

### 2. ツールのアクティビティを表示する

`Helpers/ResponseStreamer.cs` で、`SessionIdleEvent` の前に次のケースを挿入します。

```csharp
case ToolExecutionStartEvent tool:
    Console.WriteLine($"\n[tool:start] {tool.Data.ToolName}");
    break;
case ToolExecutionCompleteEvent tool:
    Console.WriteLine($"[tool:done] success={tool.Data.Success}");
    break;
```

### 3. ツールを登録してリクエストする

`Program.cs` のセッション設定と送信呼び出しを次のように置き換えます。

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Streaming = true,
    Tools = [AccessibilityRuleCatalog.CreateLookupTool()],
    AvailableTools = ["accessibility_rule_lookup"]
});

Console.WriteLine("\nCopilot:");
await ResponseStreamer.SendAndPrintAsync(
    session,
    "`accessibility_rule_lookup` を使って、アクセシブルネームのない入力をどう修正するか説明してください。");
```


## 実行する

```bash
dotnet run
```

ツール名と、それが 4.1.2 にマッピングされていることを確認します。

```text
[tool:start] accessibility_rule_lookup
[tool:done] success=True

WCAG 4.1.2 名前・役割・値 ...
```

> **日本語補足（出力例）:** ローカルツールの結果を使って WCAG 4.1.2 の情報が表示される例です。ツールイベントや基準名、推奨される修正内容が確認できれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| ツールイベントが表示されない | この学習ステップでは明示的な `Use accessibility_rule_lookup` の指示を残してください。 |
| コンパイラが `AIFunction` を見つけられない | カタログファイルに `using Microsoft.Extensions.AI;` を追加してください。 |
| 結果が「no exact match」と表示される | プロンプトにスターターデータのキーワードである `accessible name` が含まれていることを確認してください。 |

</details>

<details>
<summary>ステップ 3 の完成実装</summary>

この完成したステップ 3 の実装と、あなたのバージョンを比較してください。

`Program.cs`:

```csharp
using GitHub.Copilot;
using HelloCopilotSDK.Helpers;

Console.WriteLine("=== Application-owned WCAG guidance ===\n");

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"Connected to the Copilot runtime: {ping.Message}\n");

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Streaming = true,
    Tools = [AccessibilityRuleCatalog.CreateLookupTool()],
    AvailableTools = ["accessibility_rule_lookup"]
});

Console.WriteLine("Copilot:");
await ResponseStreamer.SendAndPrintAsync(
    session,
    "`accessibility_rule_lookup` を使って、アクセシブルネームのない入力をどう修正するか説明してください。");
```

カタログツールとルックアップは `Helpers/AccessibilityRuleCatalog.cs` にあります。ツールの開始と完了の
表示は `Helpers/ResponseStreamer.cs` にあります。

</details>
:::

:::language nodejs
## TypeScript のルックアップを組み込む

### 1. 事前に用意された型付きツールを確認する

`src/workshop.ts` を開きます。スターターには既にカタログのインポートと、次のローカルツールの定義があります。

```typescript
export const accessibilityRuleLookup = defineTool("accessibility_rule_lookup", {
  description: "Looks up read-only WCAG guidance maintained by this application.",
  parameters: z.object({ query: z.string().describe("The accessibility issue or WCAG criterion to look up.") }),
  skipPermission: true,
  handler: async ({ query }) => {
    const normalized = query.trim().toLowerCase();
    return accessibilityRules.find((rule) => normalized.includes(rule.criterion.toLowerCase()) || normalized.includes(rule.title.toLowerCase()) || rule.keywords.some((keyword) => normalized.includes(keyword))) ?? noMatch;
  },
});
```

Zod スキーマは、モデルに型付きの `query` 引数を提供します。ハンドラーは
`accessibilityRules` を検索し、これはアプリケーションが所有したままです。このツールはアプリケーションが所有する読み取り専用データのみを返すため、`skipPermission: true` は意図的なものです。

### 2. ツールのアクティビティ表示を確認する

同じファイルで、`streamResponse` は既にツールのライフサイクルイベントを表示しています。

```typescript
else if (event.type === "tool.execution_start") console.log(`\n[tool:start] ${event.data.toolName}`);
else if (event.type === "tool.execution_complete") console.log(`[tool:done] success=${event.data.success}`);
```

モデルがローカルツールを呼び出すタイミングを確認できるように、これらの分岐は残しておいてください。

### 3. ツールを登録してリクエストする

`src/index.ts` で、ストリーミングヘルパーとともにツールをインポートします。

```typescript
import { accessibilityRuleLookup, streamResponse } from "./workshop.js";
```

セッションの作成と送信呼び出しを置き換えます。

```typescript
const session = await client.createSession({
  streaming: true,
  tools: [accessibilityRuleLookup],
  availableTools: ["accessibility_rule_lookup"],
});
try {
  await streamResponse(
    session,
    "accessibility_rule_lookup を使って、WCAG 4.1.2 の内容を説明してください。",
  );
} finally {
  await session.disconnect();
}
```


`tools` は実装を登録します。`availableTools` はモデルが呼び出せる許可リストです。

## 実行する

```bash
npm start
```

ツール名と WCAG 4.1.2 に関するガイダンスを確認します。

```text
[tool:start] accessibility_rule_lookup
[tool:done] success=true

WCAG 4.1.2 Name, Role, Value ...
```

> **日本語補足（出力例）:** ローカルツールの結果を使って WCAG 4.1.2 の情報が表示される例です。ツールイベントや基準名、推奨される修正内容が確認できれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| TypeScript が `zod` を解決できない | スターターディレクトリで `npm install` を実行してください。 |
| ツールイベントが表示されない | ツール名を `tools` と `availableTools` の両方に残し、プロンプトに明示的な指示を残してください。 |
| ルックアップがマッチを返さない | カタログに含まれている `4.1.2` または `accessible name` について尋ねてください。 |
| ツールイベントが表示されない | `streamResponse` が `tool.execution_start` と `tool.execution_complete` を引き続き処理していることを確認してください。 |

</details>

<details>
<summary>ステップ 3 の完成実装</summary>

この完成したステップ 3 の実装と、あなたのバージョンを比較してください。

`src/index.ts`:

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import { accessibilityRuleLookup, streamResponse } from "./workshop.js";

const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({
    streaming: true,
    tools: [accessibilityRuleLookup],
    availableTools: ["accessibility_rule_lookup"],
  });
  try {
    await streamResponse(session, "accessibility_rule_lookup を使って、WCAG 4.1.2 の内容を説明してください。");
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```

型付きのツール定義とツールアクティビティの表示は `src/workshop.ts` にあります。

</details>
:::

:::language python
## Python のルックアップを組み込む

### 1. 事前に用意された型付きツールを確認する

`workshop.py` を開きます。スターターには既にパラメーターモデルとローカルツールの定義があります。

```python
class LookupParams(BaseModel):
    query: str = Field(description="The accessibility issue or WCAG criterion to look up.")


@define_tool(name="accessibility_rule_lookup", description="Looks up read-only WCAG guidance maintained by this application.", skip_permission=True)
def accessibility_rule_lookup(params: LookupParams) -> dict[str, object]:
    query = params.query.strip().lower()
    rule = next((item for item in ACCESSIBILITY_RULES if item.criterion.lower() in query or item.title.lower() in query or any(keyword in query for keyword in item.keywords)), None)
    if rule is None:
        return {"criterion": "No exact match", "title": "Criterion not found", "when_it_applies": "The issue is not represented in the workshop catalog.", "recommendation": "Verify the evidence and consult the complete WCAG reference."}
    return rule.__dict__
```

Pydantic はモデルから見える引数を記述し、ハンドラーは
`ACCESSIBILITY_RULES` を検索します。これはアプリケーションが所有したままです。このツールはアプリケーションが所有する読み取り専用データのみを返すため、`skip_permission=True` は意図的なものです。

### 2. ツールを登録してリクエストする

`main.py` で、ツールをインポートします。

```python
from workshop import accessibility_rule_lookup
```

セッションの作成と送信呼び出しを置き換えます。ステップ 2 のイベントハンドラーはセッションブロック内に残しておきます。

```python
async with await client.create_session(
    streaming=True,
    tools=[accessibility_rule_lookup],
    available_tools=["accessibility_rule_lookup"],
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
        "`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。"
    )
    await done.wait()
    if error is not None:
        raise error
```


`tools` は実装を登録します。`available_tools` はモデルが呼び出せる許可リストです。

## 実行する

```bash
python main.py
```

応答は、カタログの WCAG 4.1.2 のタイトルと推奨事項を使用するはずです。

```text
WCAG 4.1.2 Name, Role, Value ...
Associate a visible <label> with the input ...
```

> **日本語補足（出力例）:** ローカルツールの結果を使って WCAG 4.1.2 の情報が表示される例です。ツールイベントや基準名、推奨される修正内容が確認できれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| Python が `pydantic` をインポートできない | 事前準備の仮想環境をアクティブにして `requirements.txt` を再インストールしてください。 |
| ツールが呼び出されない | `tools` と `available_tools` の両方に残し、プロンプトに明示的な指示を残してください。 |
| ルックアップがマッチを返さない | カタログに含まれている `4.1.2` または `accessible name` について尋ねてください。 |
| `accessibility_rule_lookup` のインポートエラー | `main.py` に `from workshop import accessibility_rule_lookup` があることを確認してください。 |

</details>

<details>
<summary>ステップ 3 の完成実装</summary>

この完成したステップ 3 の実装と、あなたのバージョンを比較してください。

`main.py`:

```python
import asyncio

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, AssistantMessageDeltaData, SessionErrorData, SessionIdleData

from workshop import accessibility_rule_lookup


async def main() -> None:
    async with CopilotClient() as client:
        async with await client.create_session(
            streaming=True,
            tools=[accessibility_rule_lookup],
            available_tools=["accessibility_rule_lookup"],
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
            await session.send("`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

型付きのツール定義は `workshop.py` にあります。

</details>
:::

:::language go
## Go のルックアップを組み込む

### 1. 型付きルックアップを追加する

`main.go` のインポートに `strings` を追加し、`streamResponse` の前に次の宣言を追加します。

```go
type lookupParams struct {
	Query string `json:"query" jsonschema:"The accessibility issue or WCAG criterion to look up."`
}

func accessibilityRuleLookup(params lookupParams, _ copilot.ToolInvocation) (any, error) {
	query := strings.ToLower(params.Query)
	if strings.Contains(query, "4.1.2") || strings.Contains(query, "accessible name") {
		return map[string]string{
			"criterion":      "4.1.2",
			"title":          "Name, Role, Value",
			"recommendation": "Associate each input with a visible label.",
		}, nil
	}
	return map[string]string{
		"criterion":      "No exact match",
		"recommendation": "Verify the evidence and consult the WCAG reference.",
	}, nil
}
```

### 2. ツールを定義して登録する

`main` の先頭で、ツールを作成します。

```go
lookup := copilot.DefineTool(
	"accessibility_rule_lookup",
	"Looks up read-only WCAG guidance maintained by this application.",
	accessibilityRuleLookup,
)
lookup.SkipPermission = true
```

セッション設定と最後の送信を置き換えます。

```go
session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
	Streaming:      copilot.Bool(true),
	Tools:          []copilot.Tool{lookup},
	AvailableTools: []string{"accessibility_rule_lookup"},
})
if err != nil {
	panic(err)
}
defer session.Disconnect()

if err := streamResponse(
	session,
	"`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。",
); err != nil {
	panic(err)
}
```


`Tools` は実装を登録します。`AvailableTools` はモデルが呼び出せる許可リストです。
このツールはアプリケーションが所有する読み取り専用データのみを返すため、`SkipPermission = true` は意図的なものです。

## 実行する

```bash
go run .
```

ストリーミングされる応答は、WCAG 4.1.2 のルックアップ結果を使用するはずです。

```text
WCAG 4.1.2 Name, Role, Value ...
Associate each input with a visible label.
```

> **日本語補足（出力例）:** ローカルツールの結果を使って WCAG 4.1.2 の情報が表示される例です。ツールイベントや基準名、推奨される修正内容が確認できれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `strings` が未定義 | 標準ライブラリの `strings` インポートを追加してください。 |
| モデルがツールを認識できない | ツールを `Tools` に残し、その正確な名前を `AvailableTools` に残してください。 |
| ルックアップがマッチを返さない | `4.1.2` または `accessible name` について尋ねてください。 |
| `DefineTool` でビルドが失敗する | ハンドラーのシグネチャが `(lookupParams, copilot.ToolInvocation) (any, error)` であることを確認してください。 |

</details>

<details>
<summary>ステップ 3 の完成実装</summary>

この完成したステップ 3 の実装と、あなたのバージョンを比較してください。

`main.go`:

```go
package main

import (
	"context"
	"fmt"
	"strings"

	copilot "github.com/github/copilot-sdk/go"
)

type lookupParams struct {
	Query string `json:"query" jsonschema:"The accessibility issue or WCAG criterion to look up."`
}

func accessibilityRuleLookup(params lookupParams, _ copilot.ToolInvocation) (any, error) {
	query := strings.ToLower(params.Query)
	if strings.Contains(query, "4.1.2") || strings.Contains(query, "accessible name") {
		return map[string]string{
			"criterion":      "4.1.2",
			"title":          "Name, Role, Value",
			"recommendation": "Associate each input with a visible label.",
		}, nil
	}
	return map[string]string{
		"criterion":      "No exact match",
		"recommendation": "Verify the evidence and consult the WCAG reference.",
	}, nil
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
	lookup := copilot.DefineTool(
		"accessibility_rule_lookup",
		"Looks up read-only WCAG guidance maintained by this application.",
		accessibilityRuleLookup,
	)
	lookup.SkipPermission = true

	client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
	if err := client.Start(context.Background()); err != nil {
		panic(err)
	}
	defer client.Stop()

	session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
		Streaming:      copilot.Bool(true),
		Tools:          []copilot.Tool{lookup},
		AvailableTools: []string{"accessibility_rule_lookup"},
	})
	if err != nil {
		panic(err)
	}
	defer session.Disconnect()

	if err := streamResponse(session, "`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。"); err != nil {
		panic(err)
	}
}
```

</details>
:::

:::language rust
## Rust のルックアップを組み込む

### 1. 型付きハンドラーを追加する

`src/main.rs` の先頭付近に、次のインポートを追加します。

```rust
use std::sync::Arc;

use async_trait::async_trait;
use github_copilot_sdk::tool::{JsonSchema, ToolHandler, schema_for};
use github_copilot_sdk::types::{SessionConfig, Tool, ToolInvocation};
use github_copilot_sdk::{Client, ClientOptions, Error, ToolResult};
use serde::Deserialize;
```

より狭いステップ 2 の SDK インポートを置き換え、`stream_response` の前に型付きハンドラーを追加します。

```rust
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
        let result = if params.query.to_lowercase().contains("4.1.2") {
            r#"{"criterion":"4.1.2","title":"Name, Role, Value","recommendation":"Associate each input with a visible label."}"#
        } else {
            r#"{"criterion":"No exact match","recommendation":"Verify the evidence and consult the WCAG reference."}"#
        };
        Ok(ToolResult::Text(result.to_owned()))
    }
}
```

### 2. ツールを定義して登録する

`main` の先頭で、ツールを作成してセッション設定に追加します。

```rust
let lookup = Tool::new("accessibility_rule_lookup")
    .with_description("Looks up read-only WCAG guidance maintained by this application.")
    .with_parameters(schema_for::<LookupParams>())
    .with_skip_permission(true)
    .with_handler(Arc::new(AccessibilityRuleLookup));

let client = Client::start(ClientOptions::default()).await?;
let mut config = SessionConfig::default();
config.streaming = Some(true);
config.tools = Some(vec![lookup]);
config.available_tools = Some(vec!["accessibility_rule_lookup".to_owned()]);
let session = client.create_session(config).await?;

stream_response!(
    session,
    "`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。".to_owned()
);
```


マクロ呼び出しの後には、ステップ 2 の disconnect とクライアントのシャットダウンを残しておきます。
`config.tools` は実装を登録します。`config.available_tools` はモデルが呼び出せる許可リストです。このツールはアプリケーションが所有する読み取り専用データのみを返すため、`with_skip_permission(true)` は意図的なものです。

## 実行する

```bash
cargo run
```

ストリーミングされる応答は、WCAG 4.1.2 のルックアップ結果を使用するはずです。

```text
WCAG 4.1.2 Name, Role, Value ...
Associate each input with a visible label.
```

> **日本語補足（出力例）:** ローカルツールの結果を使って WCAG 4.1.2 の情報が表示される例です。ツールイベントや基準名、推奨される修正内容が確認できれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| トレイトまたは derive が解決できない | 上記の `async_trait`、`serde`、スキーマ、ツールのインポートを残してください。 |
| モデルがツールを認識できない | `config.tools` と `config.available_tools` の両方を設定してください。 |
| ルックアップがマッチを返さない | 明示的に `4.1.2` について尋ねてください。 |
| ハンドラーの型エラー | `ToolHandler::call` が `Result<ToolResult, Error>` を返すことを確認してください。 |

</details>

<details>
<summary>ステップ 3 の完成実装</summary>

この完成したステップ 3 の実装と、あなたのバージョンを比較してください。

`src/main.rs`:

```rust
use std::io::{self, Write};
use std::sync::Arc;

use async_trait::async_trait;
use github_copilot_sdk::tool::{JsonSchema, ToolHandler, schema_for};
use github_copilot_sdk::types::{SessionConfig, Tool, ToolInvocation};
use github_copilot_sdk::{Client, ClientOptions, Error, ToolResult};
use serde::Deserialize;

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
        let result = if params.query.to_lowercase().contains("4.1.2") {
            r#"{"criterion":"4.1.2","title":"Name, Role, Value","recommendation":"Associate each input with a visible label."}"#
        } else {
            r#"{"criterion":"No exact match","recommendation":"Verify the evidence and consult the WCAG reference."}"#
        };
        Ok(ToolResult::Text(result.to_owned()))
    }
}

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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let lookup = Tool::new("accessibility_rule_lookup")
        .with_description("Looks up read-only WCAG guidance maintained by this application.")
        .with_parameters(schema_for::<LookupParams>())
        .with_skip_permission(true)
        .with_handler(Arc::new(AccessibilityRuleLookup));

    let client = Client::start(ClientOptions::default()).await?;
    let mut config = SessionConfig::default();
    config.streaming = Some(true);
    config.tools = Some(vec![lookup]);
    config.available_tools = Some(vec!["accessibility_rule_lookup".to_owned()]);
    let session = client.create_session(config).await?;

    stream_response!(
        session,
        "`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。".to_owned()
    );
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```

</details>
:::

:::language java
## Java のルックアップを組み込む

### 1. 型付きルックアップを追加する

`src/main/java/workshop/AccessibilityReport.java` に、次のインポートを追加します。

```java
import com.github.copilot.rpc.ToolDefinition;
import com.github.copilot.tool.Param;

import java.util.List;
```

クラスの閉じ括弧の前に、次のメソッドを追加します。

```java
private static String lookupRule(String query) {
    if (query.toLowerCase(java.util.Locale.ROOT).contains("4.1.2")) {
        return """
                {"criterion":"4.1.2","title":"Name, Role, Value","recommendation":"Associate each input with a visible label."}""";
    }
    return """
            {"criterion":"No exact match","recommendation":"Verify the evidence and consult the WCAG reference."}""";
}
```

### 2. ツールを定義して登録する

`main` の先頭で、ツールとセッション設定を定義します。

```java
var lookup = ToolDefinition.from(
        "accessibility_rule_lookup",
        "Looks up read-only WCAG guidance maintained by this application.",
        Param.of(String.class, "query",
                "The accessibility issue or WCAG criterion to look up."),
        AccessibilityReport::lookupRule).skipPermission(true);
var config = new SessionConfig()
        .setStreaming(true)
        .setTools(List.of(lookup))
        .setAvailableTools(List.of("accessibility_rule_lookup"))
        .setOnPermissionRequest(PermissionHandler.APPROVE_ALL);
```

クライアントブロック内で、セッションの作成とプロンプトを置き換えます。

```java
var session = client.createSession(config).get();
var response = session.sendAndWait(new MessageOptions()
        .setPrompt("`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。"))
        .get();
if (response == null) {
    throw new IllegalStateException("Copilot completed without an assistant message.");
}
System.out.println(response.getData().content());
```


`setTools` は実装を登録します。`setAvailableTools` はモデルが呼び出せる許可リストです。このツールはアプリケーションが所有する読み取り専用データのみを返すため、`skipPermission(true)` は意図的なものです。ステップ 4 でスコープ付きの Playwright ハンドラーに置き換えられるまで、ステップ 1 のパーミッションハンドラーを残しておきます。Java の実装はストリーミングを有効にしたセッションで `sendAndWait` を使用するため、ターンが終了すると完成した応答を表示します。

## 実行する

```bash
mvn compile exec:java
```

応答は、WCAG 4.1.2 のルックアップ結果を使用するはずです。

```text
WCAG 4.1.2 Name, Role, Value ...
Associate each input with a visible label.
```

> **日本語補足（出力例）:** ローカルツールの結果を使って WCAG 4.1.2 の情報が表示される例です。ツールイベントや基準名、推奨される修正内容が確認できれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `ToolDefinition` または `Param` が解決できない | 上記の 2 つの Copilot ツールのインポートを追加してください。 |
| モデルがツールを認識できない | `setTools` と `setAvailableTools` を同じセッション設定に残してください。 |
| ルックアップがマッチを返さない | 明示的に `4.1.2` について尋ねてください。 |
| メソッド参照が失敗する | `lookupRule` が `private static` で、単一の `String` を受け取ることを確認してください。 |

</details>

<details>
<summary>ステップ 3 の完成実装</summary>

この完成したステップ 3 の実装と、あなたのバージョンを比較してください。

`AccessibilityReport.java`:

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.MessageOptions;
import com.github.copilot.rpc.PermissionHandler;
import com.github.copilot.rpc.SessionConfig;
import com.github.copilot.rpc.ToolDefinition;
import com.github.copilot.tool.Param;

import java.util.List;

public final class AccessibilityReport {
    private AccessibilityReport() {
    }

    public static void main(String[] args) throws Exception {
        var lookup = ToolDefinition.from(
                "accessibility_rule_lookup",
                "Looks up read-only WCAG guidance maintained by this application.",
                Param.of(String.class, "query", "The accessibility issue or WCAG criterion to look up."),
                AccessibilityReport::lookupRule).skipPermission(true);
        var config = new SessionConfig()
                .setStreaming(true)
                .setTools(List.of(lookup))
                .setAvailableTools(List.of("accessibility_rule_lookup"))
                .setOnPermissionRequest(PermissionHandler.APPROVE_ALL);

        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(config).get();
            var response = session.sendAndWait(new MessageOptions()
                    .setPrompt("`accessibility_rule_lookup` を使って、WCAG 4.1.2 の内容を説明してください。"))
                    .get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
    }

    private static String lookupRule(String query) {
        if (query.toLowerCase(java.util.Locale.ROOT).contains("4.1.2")) {
            return """
                    {"criterion":"4.1.2","title":"Name, Role, Value","recommendation":"Associate each input with a visible label."}""";
        }
        return """
                {"criterion":"No exact match","recommendation":"Verify the evidence and consult the WCAG reference."}""";
    }
}
```

</details>
:::

> **Playwright MCP に進む前に:** 応答に、アプリケーションのカタログにある基準 4.1.2 が含まれていることを確認してください。

## 理解度チェック

アプリケーションが所有する明細項目から注文合計を計算する処理は、ローカルツールと MCP サーバーのどちらにすべきでしょうか?

<details>
<summary>答えを確認する</summary>

通常はローカルツールです。アプリケーションが明細項目と決定論的な計算を所有しているため、プロセス内の関数の方がテストしやすく、プロセス境界を越える必要もありません。

</details>

## 参考資料

- [Working with hooks](https://github.com/github/copilot-sdk/blob/main/docs/features/hooks.md):
  ツール呼び出しの前後に処理を実行し、監査ログや独自のポリシーを実装する方法です。
- [Post-tool-use hook](https://github.com/github/copilot-sdk/blob/main/docs/hooks/post-tool-use.md):
  ツールの実行結果を、モデルに返す前に確認したり書き換えたりできます。
- [Custom skills](https://github.com/github/copilot-sdk/blob/main/docs/features/skills.md):
  繰り返し使う指示をスキルとしてまとめ、セッションで再利用する方法を説明しています。

[ステップ 4: 外部ツールを安全に接続する](04-mcp-safety.md) に進みます。
