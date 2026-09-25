# オプション: モデルを選択する

> **所要時間:** 10 分  
> **前提条件:** まず 7 つのコアステップを完了してください。

## カスタマイズする内容

サインイン中のユーザーが利用できるモデルを一覧表示し、選択したモデルをレポートのセッションで使用します。

## モデル選択の仕組み

**モデル**とは、ランタイムが各ターンで送信先とする具体的な大規模言語モデルのことです。
[GitHub Copilot で利用できるモデル](https://docs.github.com/en/copilot/reference/ai-models/supported-models)
は時間とともに変化し、アカウントによっても異なります。そのため、アプリケーションは名前をハードコーディングするのではなく、
使用してよいモデルをランタイムに問い合わせます。

:::language dotnet
Copilot ランタイムは複数のモデルを公開している場合があります。`ListModelsAsync` は現在のアカウントで利用できるモデルを返します。
セッションを作成する際に `SessionConfig.Model` で 1 つを選択します。
:::

:::language nodejs
Copilot ランタイムは複数のモデルを公開している場合があります。`client.listModels()` は現在のアカウントで利用できる
モデルを返します。`createSession` を呼び出すときに、選択した id を `model` として渡します。
:::

:::language python
Copilot ランタイムは複数のモデルを公開している場合があります。`await client.list_models()` は現在のアカウントで利用できる
モデルを返します。`create_session` を呼び出すときに、選択した id を `model` として渡します。
:::

:::language go
Copilot ランタイムは複数のモデルを公開している場合があります。`client.ListModels(ctx)` は現在のアカウントで利用できる
モデルを返します。セッションを作成する際に `SessionConfig.Model` を設定します。
:::

:::language rust
Copilot ランタイムは複数のモデルを公開している場合があります。`client.list_models().await?` は現在のアカウントで利用できる
モデルを返します（内部では `models().list()` を使用します）。セッションを作成する際に
`SessionConfig.model` を設定します。
:::

:::language java
Copilot ランタイムは複数のモデルを公開している場合があります。`client.listModels()` は現在のアカウントで利用できる
モデルを返します。セッションを作成する際に `SessionConfig.setModel(selectedId)` を呼び出します。
:::

## アーキテクチャを変えずにモデルを差し替える

モデルを変更すると、レイテンシ、能力、課金に影響することがあります。ただしローカルツール、
MCP 設定、パーミッションポリシーは変わりません。だからこそ、このトピックはコアアーキテクチャの後に扱います。

:::language dotnet
モデル選択は `CopilotSession` を構成します。クライアントやいずれのツール境界も置き換えません。
:::

:::language nodejs
モデル選択は `createSession` で作成したセッションを構成します。クライアントやいずれのツール境界も
置き換えません。
:::

:::language python
モデル選択は `create_session` で作成したセッションを構成します。クライアントやいずれのツール境界も
置き換えません。
:::

:::language go
モデル選択は `SessionConfig` を構成します。クライアントやいずれのツール境界も置き換えません。
:::

:::language rust
モデル選択は `SessionConfig` を構成します。クライアントやいずれのツール境界も置き換えません。
:::

:::language java
モデル選択は `SessionConfig` を構成します。クライアントやいずれのツール境界も置き換えません。
:::

:::language dotnet
## モデルピッカーを追加する

`Helpers/ModelSelector.cs` を作成します。

```csharp
using GitHub.Copilot;

namespace HelloCopilotSDK.Helpers;

public static class ModelSelector
{
    public static async Task<string?> SelectAsync(CopilotClient client)
    {
        var models = (await client.ListModelsAsync())?.ToList();
        if (models is null || models.Count is 0)
        {
            Console.WriteLine("No model list was returned; using the account default.");
            return null;
        }

        Console.WriteLine("Available models:");
        for (var index = 0; index < models.Count; index++)
        {
            Console.WriteLine($"{index + 1}. {models[index].Name}");
        }

        Console.Write($"Choose 1-{models.Count} [1]: ");
        var valid = int.TryParse(Console.ReadLine(), out var choice) &&
                    choice >= 1 &&
                    choice <= models.Count;
        var selected = models[(valid ? choice : 1) - 1];

        Console.WriteLine($"Using {selected.Name}\n");
        return selected.Id;
    }
}
```
:::
:::language dotnet
`Program.cs` の `PingAsync` の後に、次を挿入します。

```csharp
var selectedModel = await ModelSelector.SelectAsync(client);
```
:::
:::language dotnet
続いて、`SessionConfig` に `Model = selectedModel` を追加します。

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Model = selectedModel,
    Streaming = true,
    // Keep the existing permission, local-tool, and MCP configuration.
});
```
:::
Step 6 のセッション設定の残りの部分は削除しないでください。

:::language nodejs
## モデルピッカーを追加する

`src/model-selector.ts` を作成します。

```typescript
import type { CopilotClient } from "@github/copilot-sdk";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export async function selectModel(client: CopilotClient): Promise<string | undefined> {
  const models = await client.listModels();
  const [defaultModel] = models;
  if (!defaultModel) {
    console.log("No model list was returned; using the account default.");
    return undefined;
  }

  console.log("Available models:");
  models.forEach((model, index) => {
    console.log(`${index + 1}. ${model.name}`);
  });

  const rl = createInterface({ input, output });
  try {
    const answer = (await rl.question(`Choose 1-${models.length} [1]: `)).trim();
    const choice = Number.parseInt(answer, 10);
    const selected =
      Number.isInteger(choice) && choice >= 1 && choice <= models.length
        ? models[choice - 1] ?? defaultModel
        : defaultModel;
    console.log(`Using ${selected.name}\n`);
    return selected.id;
  } finally {
    rl.close();
  }
}
```

`src/report.ts` でヘルパーをインポートし、`client.start()` の後に呼び出します。

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import { selectModel } from "./model-selector.js";
import {
  accessibilityRuleLookup,
  createSnapshotReader,
  permissionForTarget,
  reportPrompt,
  streamResponse,
} from "./workshop.js";

const input = process.argv[2];
if (!input) throw new Error("Usage: npm start -- <http-or-https-url>");
const target = new URL(input.includes("://") ? input : `https://${input}`);
if (!["http:", "https:"].includes(target.protocol)) {
  throw new Error("Enter an absolute HTTP or HTTPS URL.");
}

const client = new CopilotClient();
await client.start();
try {
  const selectedModel = await selectModel(client);
  const session = await client.createSession({
    model: selectedModel,
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
    await streamResponse(session, reportPrompt(target));
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```

Step 6 の既存のツール、MCP、パーミッションの設定はすべて維持してください。追加するのは `model: selectedModel` だけです。
:::

:::language python
## モデルピッカーを追加する

`model_selector.py` を作成します。

```python
from __future__ import annotations

from copilot import CopilotClient


async def select_model(client: CopilotClient) -> str | None:
    models = await client.list_models()
    if not models:
        print("No model list was returned; using the account default.")
        return None

    print("Available models:")
    for index, model in enumerate(models, start=1):
        print(f"{index}. {model.name}")

    answer = input(f"Choose 1-{len(models)} [1]: ").strip()
    try:
        choice = int(answer)
    except ValueError:
        choice = 1
    if choice < 1 or choice > len(models):
        choice = 1

    selected = models[choice - 1]
    print(f"Using {selected.name}\n")
    return selected.id
```

`report.py` でヘルパーをインポートし、Step 6 のツール設定を削除せずに `create_session` に `model=` を渡します。

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
    ToolExecutionCompleteData,
    ToolExecutionStartData,
)

from model_selector import select_model
from workshop import (
    accessibility_rule_lookup,
    create_snapshot_reader,
    permission_for_target,
    report_prompt,
)


async def main() -> None:
    target = sys.argv[1] if len(sys.argv) == 2 else input("Enter URL to analyze: ").strip()
    target = target if "://" in target else f"https://{target}"
    if urlsplit(target).scheme not in {"http", "https"}:
        raise ValueError("Enter an absolute HTTP or HTTPS URL.")

    async with CopilotClient() as client:
        selected_model = await select_model(client)
        async with await client.create_session(
            model=selected_model,
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
            await session.send(report_prompt(target))
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

既存のエントリポイントが引き続き `report.main` をインポートできるよう、`python main.py` で起動し続けてください。
:::

:::language go
## モデルピッカーを追加する

このヘルパーを `main.go` の先頭付近（または同じパッケージ内の別ファイル）に追加します。

```go
func selectModel(ctx context.Context, client *copilot.Client) (string, error) {
	models, err := client.ListModels(ctx)
	if err != nil {
		return "", err
	}
	if len(models) == 0 {
		fmt.Println("No model list was returned; using the account default.")
		return "", nil
	}

	fmt.Println("Available models:")
	for index, model := range models {
		fmt.Printf("%d. %s\n", index+1, model.Name)
	}

	fmt.Printf("Choose 1-%d [1]: ", len(models))
	var answer string
	fmt.Scanln(&answer)
	choice := 1
	if parsed, parseErr := strconv.Atoi(strings.TrimSpace(answer)); parseErr == nil {
		choice = parsed
	}
	if choice < 1 || choice > len(models) {
		choice = 1
	}

	selected := models[choice-1]
	fmt.Printf("Using %s\n\n", selected.Name)
	return selected.ID, nil
}
```

import ブロックに `"strconv"` がまだ含まれていない場合は追加します。`client.Start` の後で、
モデルを選択し `SessionConfig.Model` を設定します。

```go
client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
if err := client.Start(context.Background()); err != nil {
	panic(err)
}
defer client.Stop()

selectedModel, err := selectModel(context.Background(), client)
if err != nil {
	panic(err)
}

session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
	Model:               selectedModel,
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
```

Step 6 の既存のツール、MCP、パーミッションの設定はすべて維持してください。追加するのは `Model: selectedModel` だけです。
:::

:::language rust
## モデルピッカーを追加する

このヘルパーを `src/main.rs` に追加します。

```rust
async fn select_model(client: &Client) -> Result<Option<String>, Box<dyn std::error::Error>> {
    // list_models caches the catalog; it calls models().list() on first use.
    let models = client.list_models().await?;
    if models.is_empty() {
        println!("No model list was returned; using the account default.");
        return Ok(None);
    }

    println!("Available models:");
    for (index, model) in models.iter().enumerate() {
        println!("{}. {}", index + 1, model.name);
    }

    print!("Choose 1-{} [1]: ", models.len());
    io::stdout().flush()?;
    let mut answer = String::new();
    io::stdin().read_line(&mut answer)?;
    let choice = answer.trim().parse::<usize>().unwrap_or(1);
    let index = if (1..=models.len()).contains(&choice) {
        choice - 1
    } else {
        0
    };
    let selected = &models[index];
    println!("Using {}\n", selected.name);
    Ok(Some(selected.id.clone()))
}
```

`Client::start` の後で、`create_session` の前にモデルを選択し `config.model` を設定します。

```rust
let client = Client::start(ClientOptions::default()).await?;
let selected_model = select_model(&client).await?;

let mut config = SessionConfig::default();
config.model = selected_model;
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

let session = client.create_session(config).await?;
```

Step 6 の既存のツール、MCP、パーミッションの設定はすべて維持してください。追加するのは `config.model` だけです。
:::

:::language java
## モデルピッカーを追加する

`src/main/java/workshop/ModelSelector.java` を作成します。

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.ModelInfo;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;

public final class ModelSelector {
    private ModelSelector() {
    }

    public static String select(CopilotClient client) throws Exception {
        List<ModelInfo> models = client.listModels().get();
        if (models == null || models.isEmpty()) {
            System.out.println("No model list was returned; using the account default.");
            return null;
        }

        System.out.println("Available models:");
        for (int index = 0; index < models.size(); index++) {
            System.out.println((index + 1) + ". " + models.get(index).getName());
        }

        System.out.print("Choose 1-" + models.size() + " [1]: ");
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(System.in, StandardCharsets.UTF_8));
        String answer = reader.readLine();
        int choice = 1;
        try {
            if (answer != null && !answer.isBlank()) {
                choice = Integer.parseInt(answer.trim());
            }
        } catch (NumberFormatException ignored) {
            choice = 1;
        }
        if (choice < 1 || choice > models.size()) {
            choice = 1;
        }

        ModelInfo selected = models.get(choice - 1);
        System.out.println("Using " + selected.getName() + System.lineSeparator());
        return selected.getId();
    }
}
```

`src/main/java/workshop/AccessibilityReport.java` で、`client.start().get()` の後に
モデルを選択し `SessionConfig.setModel(selectedId)` を呼び出します。

```java
try (var client = new CopilotClient()) {
    client.start().get();
    String selectedModel = ModelSelector.select(client);

    var config = new SessionConfig()
            .setModel(selectedModel)
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

    var session = client.createSession(config).get();
    var response = session.sendAndWait(new MessageOptions().setPrompt(reportPrompt(target))).get();
    if (response == null) {
        throw new IllegalStateException("Copilot completed without an assistant message.");
    }
    System.out.println(response.getData().content());
}
```

Step 6 の既存のツール、MCP、パーミッションの設定はすべて維持してください。追加するのは
`SessionConfig.setModel(selectedModel)` だけです。特に、デフォルトの正確なターゲットに対する拒否と、
[github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273)
に対して明示的にオプトインした `--allow-local-demo-mcp` の回避策を維持してください。このフォールバックは
`mcp` の kind のみを承認し、ターゲット URL を証明することはできません。
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
mvn compile exec:java -Dexec.args="--allow-local-demo-mcp {{TARGET_APP_URL}}"
```
:::
ワークショップのターゲット URL を入力し、モデルを選択して、同じスコープ付きツールが引き続き実行されることを確認します。

<details>
<summary>この拡張のトラブルシューティング</summary>

| 症状 | 対処法 |
|---|---|
| モデルが 1 つも一覧表示されない | ヘルパーはアカウントのデフォルトにフォールバックします。想定外の場合は認証を確認してください。 |
| 数値が範囲外である | ヘルパーは安全に最初のモデルを使用します。 |
| ツールが消える | モデル選択だけを追加してください。既存のツール、MCP、パーミッションの設定は維持してください。 |
| モデル一覧取得時の認証エラー | `copilot login` をもう一度実行してから、アプリケーションを再実行してください。 |

</details>

> **この拡張は次の状態で完了です:** 選択したモデルが名前で示され、レポートが引き続き 2 種類の
> スコープ付きツールを両方とも使用している。

## 理解度チェック

なぜモデル選択は Step 1 から外されたのでしょうか？

<details>
<summary>答えを確認する</summary>

モデル選択はコアなエージェントの概念というよりも設定です。最後まで残しておくことで、有用な Copilot の応答に
より早くたどり着け、最初のレッスンをクライアントとセッションに集中させられます。

</details>

## 参考資料

- [Bring your own key](https://github.com/github/copilot-sdk/blob/main/docs/auth/byok.md):
  OpenAI、Azure、Anthropic の認証情報を使って、セッションで利用するモデルを指定する方法です。
- [SDK and CLI compatibility](https://github.com/github/copilot-sdk/blob/main/docs/troubleshooting/compatibility.md):
  モデル一覧の取得やシステムメッセージなど、各 SDK と CLI が対応している機能を確認できます。
- [Azure managed identity](https://github.com/github/copilot-sdk/blob/main/docs/setup/azure-managed-identity.md):
  アプリにキーを保存せず、マネージド ID で Microsoft Foundry のモデルに接続する方法です。

[オプション: インタラクティブな HTML レポートを生成する](09-interactive-html-report.md)に進むか、
[ステップ 7: アプリケーションを実行して説明する](07-run-explain.md)に戻ってください。
