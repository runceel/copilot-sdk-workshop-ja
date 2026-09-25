# ステップ 1: 最初の Copilot セッションを作成する

> **所要時間:** 10 分

## 作るもの

コンソールアプリケーションを Copilot runtime に接続し、会話を作成し、プロンプトを送信して、応答を表示します。

:::language dotnet
## GitHub Copilot SDK とランタイムの紹介

**GitHub Copilot SDK** は、アプリケーションが Copilot をエージェントとして実行するために使用する .NET の API です。[**Copilot runtime**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md) はプロンプトを受け取り、モデルを呼び出し、ツールを管理します。`CopilotClient` は C# のコードをそのランタイムに接続します。

`CopilotSession` は、継続する 1 つの会話を表します。会話のコンテキストを構成するメッセージとツールの実行結果を保持します。アプリケーション全体で 1 つのクライアントを生かし続け、独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分けておく理由

これらの責務を分離しておくことで、ランタイム接続を個々の会話よりも長く維持できます。また、ストリーミングやツールが登場する前に、小さく動作するサンプルを用意できます。

この時点では、コンソールアプリは単純に `CopilotClient -> CopilotSession -> model response` です。
:::

:::language nodejs
## GitHub Copilot SDK とランタイムの紹介

**GitHub Copilot SDK** は、アプリケーションが Copilot をエージェントとして実行するために使用する Node.js の API です。[**Copilot runtime**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md) はプロンプトを受け取り、モデルを呼び出し、ツールを管理します。`CopilotClient` は TypeScript のコードをそのランタイムに接続します。

`createSession` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成するメッセージとツールの実行結果を保持します。アプリケーション全体で 1 つのクライアントを生かし続け、独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分けておく理由

これらの責務を分離しておくことで、ランタイム接続を個々の会話よりも長く維持できます。また、ストリーミングやツールが登場する前に、小さく動作するサンプルを用意できます。

この時点では、コンソールアプリは単純に `CopilotClient -> session -> model response` です。
:::

:::language python
## GitHub Copilot SDK とランタイムの紹介

**GitHub Copilot SDK** は、アプリケーションが Copilot をエージェントとして実行するために使用する Python の API です。[**Copilot runtime**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md) はプロンプトを受け取り、モデルを呼び出し、ツールを管理します。`CopilotClient` は Python のコードをそのランタイムに接続します。

`create_session` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成するメッセージとツールの実行結果を保持します。アプリケーション全体で 1 つのクライアントを生かし続け、独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分けておく理由

これらの責務を分離しておくことで、ランタイム接続を個々の会話よりも長く維持できます。また、ストリーミングやツールが登場する前に、小さく動作するサンプルを用意できます。

この時点では、コンソールアプリは単純に `CopilotClient -> session -> model response` です。
:::

:::language go
## GitHub Copilot SDK とランタイムの紹介

**GitHub Copilot SDK** は、アプリケーションが Copilot をエージェントとして実行するために使用する Go の API です。[**Copilot runtime**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md) はプロンプトを受け取り、モデルを呼び出し、ツールを管理します。`copilot.NewClient` は Go のコードをそのランタイムに接続します。

`CreateSession` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成するメッセージとツールの実行結果を保持します。アプリケーション全体で 1 つのクライアントを生かし続け、独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分けておく理由

これらの責務を分離しておくことで、ランタイム接続を個々の会話よりも長く維持できます。また、ストリーミングやツールが登場する前に、小さく動作するサンプルを用意できます。

この時点では、コンソールアプリは単純に `Client -> Session -> model response` です。
:::

:::language rust
## GitHub Copilot SDK とランタイムの紹介

**GitHub Copilot SDK** は、アプリケーションが Copilot をエージェントとして実行するために使用する Rust の API です。[**Copilot runtime**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md) はプロンプトを受け取り、モデルを呼び出し、ツールを管理します。`Client` は Rust のコードをそのランタイムに接続します。

`create_session` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成するメッセージとツールの実行結果を保持します。アプリケーション全体で 1 つのクライアントを生かし続け、独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分けておく理由

これらの責務を分離しておくことで、ランタイム接続を個々の会話よりも長く維持できます。また、ストリーミングやツールが登場する前に、小さく動作するサンプルを用意できます。

この時点では、コンソールアプリは単純に `Client -> session -> model response` です。
:::

:::language java
## GitHub Copilot SDK とランタイムの紹介

**GitHub Copilot SDK** は、アプリケーションが Copilot をエージェントとして実行するために使用する Java の API です。[**Copilot runtime**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md) はプロンプトを受け取り、モデルを呼び出し、ツールを管理します。`CopilotClient` は Java のコードをそのランタイムに接続します。

`createSession` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成するメッセージとツールの実行結果を保持します。アプリケーション全体で 1 つのクライアントを生かし続け、独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分けておく理由

これらの責務を分離しておくことで、ランタイム接続を個々の会話よりも長く維持できます。また、ストリーミングやツールが登場する前に、小さく動作するサンプルを用意できます。

この時点では、コンソールアプリは単純に `CopilotClient -> session -> model response` です。
:::

## 最初の Copilot セッションを起動する

:::language dotnet
`Program.cs` を開き、**ファイル全体を置き換えます**:

```csharp
using GitHub.Copilot;
using GitHub.Copilot.Rpc;

Console.WriteLine("=== First Copilot session ===\n");

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"Connected to the Copilot runtime: {ping.Message}");

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    OnPermissionRequest = PermissionHandler.ApproveAll,
});
var response = await session.SendAndWaitAsync(
    "フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。");

if (response is null)
{
    throw new InvalidOperationException("Copilot completed without an assistant message.");
}

Console.WriteLine($"\nCopilot: {response.Data.Content}");
```


ping はランタイム接続を検証します。完了応答を待つ送信はセッションがアイドル状態になるまで待機するため、完成した回答だけが必要な場合に適しています。
:::

:::language nodejs
`src/index.ts` を開き、**ファイル全体を置き換えます**:

```typescript
import { approveAll, CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({ onPermissionRequest: approveAll });
  try {
    const response = await session.sendAndWait({ prompt: "この Copilot セッションの準備ができていることを、1 文で確認してください。" });
    console.log(response?.data && "content" in response.data ? response.data.content : response);
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```


`sendAndWait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが必要な場合に適しています。ランタイムがクリーンにシャットダウンするよう、セッションとクライアントは必ず `finally` ブロックで停止してください。
:::

:::language python
`main.py` を開き、**ファイル全体を置き換えます**:

```python
import asyncio

from copilot import CopilotClient, PermissionHandler
from copilot.session_events import AssistantMessageData, SessionErrorData, SessionIdleData


async def main() -> None:
    async with CopilotClient() as client:
        async with await client.create_session(
            on_permission_request=PermissionHandler.approve_all
        ) as session:
            done = asyncio.Event()
            error: RuntimeError | None = None

            def on_event(event) -> None:
                nonlocal error
                match event.data:
                    case AssistantMessageData(content=content):
                        print(content)
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData():
                        done.set()

            session.on(on_event)
            await session.send("フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```


Python では、1 つの完了応答ヘルパーを呼び出す代わりにセッションイベントをリッスンします。アシスタントメッセージを表示し、セッションエラーを失敗として扱い、終了する前にアイドルイベントを待ちます。
:::

:::language go
`main.go` を開き、**ファイル全体を置き換えます**:

```go
package main

import (
	"context"
	"fmt"

	copilot "github.com/github/copilot-sdk/go"
)

func main() {
	client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
	if err := client.Start(context.Background()); err != nil {
		panic(err)
	}
	defer client.Stop()

	session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
	})
	if err != nil {
		panic(err)
	}
	defer session.Disconnect()

	response, err := session.SendAndWait(context.Background(), copilot.MessageOptions{
		Prompt: "フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。",
	})
	if err != nil {
		panic(err)
	}
	if response != nil {
		if message, ok := response.Data.(*copilot.AssistantMessageData); ok {
			fmt.Println(message.Content)
		}
	}
}
```


`SendAndWait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが必要な場合に適しています。`defer` によって、処理の終了時にセッションを切断し、クライアントを停止します。
:::

:::language rust
`src/main.rs` を開き、**ファイル全体を置き換えます**:

```rust
use github_copilot_sdk::permission;
use github_copilot_sdk::types::{MessageOptions, SessionConfig};
use github_copilot_sdk::{Client, ClientOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::start(ClientOptions::default()).await?;
    let session = client
        .create_session(SessionConfig::default().with_permission_handler(permission::approve_all()))
        .await?;
    let response = session
        .send_and_wait(MessageOptions::new(
            "フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。",
        ))
        .await?;

    if let Some(message) = response {
        if let Some(content) = message.data.get("content").and_then(|value| value.as_str()) {
            println!("{content}");
        }
    }

    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```


`send_and_wait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが必要な場合に適しています。関数から戻る前に、セッションを切断してクライアントを停止してください。
:::

:::language java
`src/main/java/workshop/AccessibilityReport.java` を開き、**ファイル全体を置き換えます**:

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.PermissionHandler;
import com.github.copilot.rpc.MessageOptions;
import com.github.copilot.rpc.SessionConfig;

public final class AccessibilityReport {
    private AccessibilityReport() {
    }

    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client
                    .createSession(new SessionConfig().setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();
            var response = session.sendAndWait(new MessageOptions()
                    .setPrompt("フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。"))
                    .get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
    }
}
```


`sendAndWait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが必要な場合に適しています。try-with-resources ブロックは、`main` の終了時にクライアントをクローズします。
:::

このセッションはパーミッションハンドラーだけを設定し、それ以外は何も設定していないため、SDK のデフォルトのペルソナで実行されます。ここで操作しなかったつまみが [system message](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md#customize-the-system-message) で、これには 3 つのモードがあります。`append` はデフォルトで、あなたのコンテンツが SDK の管理するプロンプトの後ろに追加され、SDK が注入する環境コンテキスト、ツールの指示、セキュリティのガードレールとともに、デフォルトの CLI ペルソナが維持されます。`replace` はプロンプト全体をあなたのコンテンツに置き換えます。`customize` は、トーン、ガイドライン、コード変更ルールなどの個々のセクションを上書きし、残りは維持します。このワークショップはデフォルトのままなので、目にするすべての回答は標準のペルソナから生成されます。アプリケーションに独自の声や範囲が必要になったら、他の 2 つのモードを利用してください。

## 実行する

:::language dotnet
```bash
dotnet run
```
:::
:::language nodejs
```bash
npm start
```
:::
:::language python
```bash
python main.py
```
:::
:::language go
```bash
go run .
```
:::
:::language rust
```bash
cargo run
```
:::
:::language java
```bash
mvn compile exec:java
```
:::

:::language dotnet
実際の応答は異なりますが、出力は次のような形になります:

```text
=== First Copilot session ===

Connected to the Copilot runtime: ...

Copilot: An accessible name lets assistive technology identify the input's purpose.
```

> **日本語補足（出力例）:** Copilot が accessible name の役割を 1 文で返している例です。入力の目的を支援技術へ伝える内容が表示されれば成功です。
:::

:::language nodejs
実際の応答は異なりますが、出力は次のような形になります:

```text
This Copilot session is ready and waiting for your next prompt.
```

> **日本語補足（出力例）:** Copilot セッションが準備完了であることを 1 文で返している例です。エラーではなく、次のプロンプトを受け付けられる状態だと分かる文が表示されれば成功です。
:::

:::language python
実際の応答は異なりますが、出力は次のような形になります:

```text
An accessible name lets assistive technology identify the input's purpose.
```

> **日本語補足（出力例）:** Copilot が accessible name の役割を 1 文で返している例です。入力の目的を支援技術へ伝える内容が表示されれば成功です。
:::

:::language go
実際の応答は異なりますが、出力は次のような形になります:

```text
An accessible name lets assistive technology identify the input's purpose.
```

> **日本語補足（出力例）:** Copilot が accessible name の役割を 1 文で返している例です。入力の目的を支援技術へ伝える内容が表示されれば成功です。
:::

:::language rust
実際の応答は異なりますが、出力は次のような形になります:

```text
An accessible name lets assistive technology identify the input's purpose.
```

> **日本語補足（出力例）:** Copilot が accessible name の役割を 1 文で返している例です。入力の目的を支援技術へ伝える内容が表示されれば成功です。
:::

:::language java
実際の応答は異なりますが、出力は次のような形になります:

```text
An accessible name lets assistive technology identify the input's purpose.
```

> **日本語補足（出力例）:** Copilot が accessible name の役割を 1 文で返している例です。入力の目的を支援技術へ伝える内容が表示されれば成功です。
:::

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| 認証または認可のエラー | もう一度 `copilot login` を実行してから、プロジェクトを再実行します。 |
| ランタイムの実行ファイルが見つからない | 事前準備の手順に従って `COPILOT_CLI_BINARY_PATH` を設定します。 |
| リクエストがタイムアウトする | GitHub Copilot へのネットワークアクセスを確認して再試行します。このサンプルは失敗を隠しません。 |

</details>

> **ストリーミングに進む準備ができたと言えるのは:** ターミナルに 1 つの完全な Copilot の応答が表示されたときです。

## 理解度チェック

通常、どのオブジェクトをアプリケーションのライフタイムにわたって存続させるべきで、どのオブジェクトが 1 つの会話のコンテキストを所有するのでしょうか。

:::language dotnet
<details>
<summary>答えを確認する</summary>

ランタイム接続のライフタイムにわたって `CopilotClient` を保持します。`CopilotSession` は、1 つの会話のメッセージとツールコンテキストを所有します。

</details>
:::

:::language nodejs
<details>
<summary>答えを確認する</summary>

ランタイム接続のライフタイムにわたって `CopilotClient` を保持します。`createSession` で作成したセッションは、1 つの会話のメッセージとツールコンテキストを所有します。

</details>
:::

:::language python
<details>
<summary>答えを確認する</summary>

ランタイム接続のライフタイムにわたって `CopilotClient` を保持します。`create_session` で作成したセッションは、1 つの会話のメッセージとツールコンテキストを所有します。

</details>
:::

:::language go
<details>
<summary>答えを確認する</summary>

ランタイム接続のライフタイムにわたって `copilot.NewClient` で作成したクライアントを保持します。`CreateSession` で作成したセッションは、1 つの会話のメッセージとツールコンテキストを所有します。

</details>
:::

:::language rust
<details>
<summary>答えを確認する</summary>

ランタイム接続のライフタイムにわたって `Client` を保持します。`create_session` で作成したセッションは、1 つの会話のメッセージとツールコンテキストを所有します。

</details>
:::

:::language java
<details>
<summary>答えを確認する</summary>

ランタイム接続のライフタイムにわたって `CopilotClient` を保持します。`createSession` で作成したセッションは、1 つの会話のメッセージとツールコンテキストを所有します。

</details>
:::

:::language dotnet
<details>
<summary>ステップ 1 の完成した実装</summary>

この完成したステップ 1 の実装と、自分の作業内容を比較してください。

```csharp
using GitHub.Copilot;

Console.WriteLine("=== First Copilot session ===\n");

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"Connected to the Copilot runtime: {ping.Message}");

await using var session = await client.CreateSessionAsync(new SessionConfig());
var response = await session.SendAndWaitAsync(
    "フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。");

if (response is null)
{
    throw new InvalidOperationException("Copilot completed without an assistant message.");
}

Console.WriteLine($"\nCopilot: {response.Data.Content}");
```
</details>
:::

:::language nodejs
<details>
<summary>ステップ 1 の完成した実装</summary>

この完成したステップ 1 の実装と、自分の作業内容を比較してください。

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({});
  try {
    const response = await session.sendAndWait({ prompt: "この Copilot セッションの準備ができていることを、1 文で確認してください。" });
    console.log(response?.data && "content" in response.data ? response.data.content : response);
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
<summary>ステップ 1 の完成した実装</summary>

この完成したステップ 1 の実装と、自分の作業内容を比較してください。

```python
import asyncio

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, SessionErrorData, SessionIdleData


async def main() -> None:
    async with CopilotClient() as client:
        async with await client.create_session() as session:
            done = asyncio.Event()
            error: RuntimeError | None = None

            def on_event(event) -> None:
                nonlocal error
                match event.data:
                    case AssistantMessageData(content=content):
                        print(content)
                    case SessionErrorData(message=message):
                        error = RuntimeError(message)
                        done.set()
                    case SessionIdleData():
                        done.set()

            session.on(on_event)
            await session.send("フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。")
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
<summary>ステップ 1 の完成した実装</summary>

この完成したステップ 1 の実装と、自分の作業内容を比較してください。

```go
package main

import (
	"context"
	"fmt"

	copilot "github.com/github/copilot-sdk/go"
)

func main() {
	client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
	if err := client.Start(context.Background()); err != nil {
		panic(err)
	}
	defer client.Stop()

	session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{})
	if err != nil {
		panic(err)
	}
	defer session.Disconnect()

	response, err := session.SendAndWait(context.Background(), copilot.MessageOptions{
		Prompt: "フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。",
	})
	if err != nil {
		panic(err)
	}
	if response != nil {
		if message, ok := response.Data.(*copilot.AssistantMessageData); ok {
			fmt.Println(message.Content)
		}
	}
}
```
</details>
:::

:::language rust
<details>
<summary>ステップ 1 の完成した実装</summary>

この完成したステップ 1 の実装と、自分の作業内容を比較してください。

```rust
use github_copilot_sdk::types::{MessageOptions, SessionConfig};
use github_copilot_sdk::{Client, ClientOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::start(ClientOptions::default()).await?;
    let session = client.create_session(SessionConfig::default()).await?;
    let response = session
        .send_and_wait(MessageOptions::new(
            "フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。",
        ))
        .await?;

    if let Some(message) = response {
        if let Some(content) = message.data.get("content").and_then(|value| value.as_str()) {
            println!("{content}");
        }
    }

    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```
</details>
:::

:::language java
<details>
<summary>ステップ 1 の完成した実装</summary>

この完成したステップ 1 の実装と、自分の作業内容を比較してください。

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.MessageOptions;
import com.github.copilot.rpc.SessionConfig;

public final class AccessibilityReport {
    private AccessibilityReport() {
    }

    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(new SessionConfig()).get();
            var response = session.sendAndWait(new MessageOptions()
                    .setPrompt("フォーム入力にアクセシブルネームが必要な理由を、1 文で説明してください。"))
                    .get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
    }
}
```
</details>
:::

## さらに学ぶ

- [Copilot を活用した最初のアプリを作る](https://docs.github.com/en/copilot/how-tos/copilot-sdk/getting-started): 最初のクライアント、セッション、プロンプトを扱う GitHub のチュートリアルです。
- [セッションの再開と永続化](https://github.com/github/copilot-sdk/blob/main/docs/features/session-persistence.md): セッションの会話状態がどのように保持され、再起動後にどのように再開するかを説明します。
- [コンテキストのクリア](https://github.com/github/copilot-sdk/blob/main/docs/features/context-management.md): 新しいセッションを作成せずに、セッション内の会話を置き換えます。
- [認証](https://github.com/github/copilot-sdk/blob/main/docs/auth/README.md): `copilot login` の先に進んだときに、クライアントが使用できる認証情報について説明します。

[ステップ 2: 応答をストリーミングする](02-streaming.md) に進みましょう。
