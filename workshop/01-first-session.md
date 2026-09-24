# ステップ 1：最初の Copilot セッションを作成する

> **所要時間：** 10 分

## 作成するもの

コンソールアプリケーションを Copilot ランタイムに接続し、会話を作成して
プロンプトを送信し、応答を表示します。

:::language dotnet
## GitHub Copilot SDK とランタイムを知る

**GitHub Copilot SDK** は、アプリケーションから Copilot をエージェントとして実行するための .NET API です。
[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)は、
プロンプトの受信、モデルの呼び出し、ツールの管理を行います。`CopilotClient` が C# コードと
このランタイムを接続します。

`CopilotSession` は、継続する 1 つの会話を表します。会話のコンテキストを構成する
メッセージやツールの結果を保持します。アプリケーションでは 1 つのクライアントを維持し、
独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分ける理由

役割を分けることで、個々の会話が終わってもランタイムへの接続を維持できます。
また、ストリーミングやツールを導入する前に、小さな動作例を確認できます。

この時点のコンソールアプリの流れは、単純に `CopilotClient -> CopilotSession -> model response` です。
:::

:::language nodejs
## GitHub Copilot SDK とランタイムを知る

**GitHub Copilot SDK** は、アプリケーションから Copilot をエージェントとして実行するための Node.js API です。
[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)は、
プロンプトの受信、モデルの呼び出し、ツールの管理を行います。`CopilotClient` が TypeScript コードと
このランタイムを接続します。

`createSession` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成する
メッセージやツールの結果を保持します。アプリケーションでは 1 つのクライアントを維持し、
独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分ける理由

役割を分けることで、個々の会話が終わってもランタイムへの接続を維持できます。
また、ストリーミングやツールを導入する前に、小さな動作例を確認できます。

この時点のコンソールアプリの流れは、単純に `CopilotClient -> session -> model response` です。
:::

:::language python
## GitHub Copilot SDK とランタイムを知る

**GitHub Copilot SDK** は、アプリケーションから Copilot をエージェントとして実行するための Python API です。
[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)は、
プロンプトの受信、モデルの呼び出し、ツールの管理を行います。`CopilotClient` が Python コードと
このランタイムを接続します。

`create_session` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成する
メッセージやツールの結果を保持します。アプリケーションでは 1 つのクライアントを維持し、
独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分ける理由

役割を分けることで、個々の会話が終わってもランタイムへの接続を維持できます。
また、ストリーミングやツールを導入する前に、小さな動作例を確認できます。

この時点のコンソールアプリの流れは、単純に `CopilotClient -> session -> model response` です。
:::

:::language go
## GitHub Copilot SDK とランタイムを知る

**GitHub Copilot SDK** は、アプリケーションから Copilot をエージェントとして実行するための Go API です。
[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)は、
プロンプトの受信、モデルの呼び出し、ツールの管理を行います。`copilot.NewClient` が Go コードと
このランタイムを接続します。

`CreateSession` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成する
メッセージやツールの結果を保持します。アプリケーションでは 1 つのクライアントを維持し、
独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分ける理由

役割を分けることで、個々の会話が終わってもランタイムへの接続を維持できます。
また、ストリーミングやツールを導入する前に、小さな動作例を確認できます。

この時点のコンソールアプリの流れは、単純に `Client -> Session -> model response` です。
:::

:::language rust
## GitHub Copilot SDK とランタイムを知る

**GitHub Copilot SDK** は、アプリケーションから Copilot をエージェントとして実行するための Rust API です。
[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)は、
プロンプトの受信、モデルの呼び出し、ツールの管理を行います。`Client` が Rust コードと
このランタイムを接続します。

`create_session` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成する
メッセージやツールの結果を保持します。アプリケーションでは 1 つのクライアントを維持し、
独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分ける理由

役割を分けることで、個々の会話が終わってもランタイムへの接続を維持できます。
また、ストリーミングやツールを導入する前に、小さな動作例を確認できます。

この時点のコンソールアプリの流れは、単純に `Client -> session -> model response` です。
:::

:::language java
## GitHub Copilot SDK とランタイムを知る

**GitHub Copilot SDK** は、アプリケーションから Copilot をエージェントとして実行するための Java API です。
[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)は、
プロンプトの受信、モデルの呼び出し、ツールの管理を行います。`CopilotClient` が Java コードと
このランタイムを接続します。

`createSession` で作成したセッションは、継続する 1 つの会話を表します。会話のコンテキストを構成する
メッセージやツールの結果を保持します。アプリケーションでは 1 つのクライアントを維持し、
独立した会話ごとにセッションを作成してください。

## クライアントとセッションを分ける理由

役割を分けることで、個々の会話が終わってもランタイムへの接続を維持できます。
また、ストリーミングやツールを導入する前に、小さな動作例を確認できます。

この時点のコンソールアプリの流れは、単純に `CopilotClient -> session -> model response` です。
:::

## 最初の Copilot セッションを起動する

:::language dotnet
`Program.cs` を開き、**ファイル全体を置き換えてください**。

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
    "In one sentence, explain why an accessible name matters for a form input.");

if (response is null)
{
    throw new InvalidOperationException("Copilot completed without an assistant message.");
}

Console.WriteLine($"\nCopilot: {response.Data.Content}");
```

ping でランタイムへの接続を確認します。応答の完了を待つ送信処理は、セッションが
アイドル状態になるまで待機するため、完成した回答だけが必要な場合に適しています。
:::

:::language nodejs
`src/index.ts` を開き、**ファイル全体を置き換えてください**。

```typescript
import { approveAll, CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({ onPermissionRequest: approveAll });
  try {
    const response = await session.sendAndWait({ prompt: "Reply with one sentence confirming this Copilot session is ready." });
    console.log(response?.data && "content" in response.data ? response.data.content : response);
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```

`sendAndWait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが
必要な場合に適しています。ランタイムを正常に終了するため、必ず `finally` ブロックでセッションとクライアントを停止してください。
:::

:::language python
`main.py` を開き、**ファイル全体を置き換えてください**。

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
            await session.send("In one sentence, explain why an accessible name matters for a form input.")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

Python では、応答の完了を待つ単一のヘルパーを呼び出す代わりに、セッションのイベントを監視します。
アシスタントのメッセージを表示し、セッションのエラーは失敗として扱い、アイドルイベントを待ってから終了します。
:::

:::language go
`main.go` を開き、**ファイル全体を置き換えてください**。

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
		Prompt: "In one sentence, explain why an accessible name matters for a form input.",
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

`SendAndWait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが
必要な場合に適しています。終了時には `defer` によりセッションを切断し、クライアントを停止します。
:::

:::language rust
`src/main.rs` を開き、**ファイル全体を置き換えてください**。

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
            "In one sentence, explain why an accessible name matters for a form input.",
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

`send_and_wait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが
必要な場合に適しています。関数から戻る前にセッションを切断し、クライアントを停止します。
:::

:::language java
`src/main/java/workshop/AccessibilityReport.java` を開き、**ファイル全体を置き換えてください**。

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
                    .setPrompt("In one sentence, explain why an accessible name matters for a form input."))
                    .get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
    }
}
```

`sendAndWait` はセッションがアイドル状態になるまで待機するため、完成した回答だけが
必要な場合に適しています。try-with-resources ブロックは `main` の終了時にクライアントを閉じます。
:::

このセッションで設定しているのは権限ハンドラーだけなので、SDK の既定のペルソナで動作します。
ここで変更していない設定が
[システムメッセージ](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md#customize-the-system-message)です。
これには 3 つのモードがあります。既定の `append` では、SDK が管理するプロンプトの後に独自の内容を追加し、
CLI の既定のペルソナと、SDK が挿入する環境コンテキスト、ツールの指示、
セキュリティのガードレールを保持します。`replace` はプロンプト全体を独自の内容に置き換えます。
`customize` は、口調、ガイドライン、コード変更のルールなどのセクションを個別に上書きし、
残りを保持します。このワークショップでは既定の設定を使うため、表示される回答はすべて
標準のペルソナによるものです。アプリケーション独自の口調や対応範囲が必要になったら、
ほかの 2 つのモードを利用してください。

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
応答の内容は変わりますが、出力は次のような形式になります。

```text
=== First Copilot session ===

Connected to the Copilot runtime: ...

Copilot: An accessible name lets assistive technology identify the input's purpose.
```
:::

:::language nodejs
応答の内容は変わりますが、出力は次のような形式になります。

```text
This Copilot session is ready and waiting for your next prompt.
```
:::

:::language python
応答の内容は変わりますが、出力は次のような形式になります。

```text
An accessible name lets assistive technology identify the input's purpose.
```
:::

:::language go
応答の内容は変わりますが、出力は次のような形式になります。

```text
An accessible name lets assistive technology identify the input's purpose.
```
:::

:::language rust
応答の内容は変わりますが、出力は次のような形式になります。

```text
An accessible name lets assistive technology identify the input's purpose.
```
:::

:::language java
応答の内容は変わりますが、出力は次のような形式になります。

```text
An accessible name lets assistive technology identify the input's purpose.
```
:::

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| 認証または認可のエラー | `copilot login` を再実行し、その後プロジェクトを再実行します。 |
| ランタイムの実行ファイルが見つからない | 事前準備の手順に従って `COPILOT_CLI_BINARY_PATH` を設定します。 |
| リクエストがタイムアウトする | GitHub Copilot へのネットワーク接続を確認し、再試行します。この例では失敗を隠しません。 |

</details>

> **ストリーミングに進む条件：** ターミナルに Copilot の応答が 1 つ、最後まで表示されること。

## 理解度を確認する

通常、アプリケーションの実行中ずっと維持すべきオブジェクトはどれでしょうか。
また、1 つの会話のコンテキストを保持するのはどのオブジェクトでしょうか。

:::language dotnet
<details>
<summary>解答を確認する</summary>

ランタイムへの接続が続く間、`CopilotClient` を維持します。`CopilotSession` は、
1 つの会話のメッセージとツールのコンテキストを保持します。

</details>
:::

:::language nodejs
<details>
<summary>解答を確認する</summary>

ランタイムへの接続が続く間、`CopilotClient` を維持します。`createSession` で作成したセッションは、
1 つの会話のメッセージとツールのコンテキストを保持します。

</details>
:::

:::language python
<details>
<summary>解答を確認する</summary>

ランタイムへの接続が続く間、`CopilotClient` を維持します。`create_session` で作成したセッションは、
1 つの会話のメッセージとツールのコンテキストを保持します。

</details>
:::

:::language go
<details>
<summary>解答を確認する</summary>

ランタイムへの接続が続く間、`copilot.NewClient` で作成したクライアントを維持します。
`CreateSession` で作成したセッションは、1 つの会話のメッセージとツールのコンテキストを保持します。

</details>
:::

:::language rust
<details>
<summary>解答を確認する</summary>

ランタイムへの接続が続く間、`Client` を維持します。`create_session` で作成したセッションは、
1 つの会話のメッセージとツールのコンテキストを保持します。

</details>
:::

:::language java
<details>
<summary>解答を確認する</summary>

ランタイムへの接続が続く間、`CopilotClient` を維持します。`createSession` で作成したセッションは、
1 つの会話のメッセージとツールのコンテキストを保持します。

</details>
:::

:::language dotnet
<details>
<summary>ステップ 1 の完成コード</summary>

ステップ 1 の完成コードと自分の実装を比較してください。

```csharp
using GitHub.Copilot;

Console.WriteLine("=== First Copilot session ===\n");

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"Connected to the Copilot runtime: {ping.Message}");

await using var session = await client.CreateSessionAsync(new SessionConfig());
var response = await session.SendAndWaitAsync(
    "In one sentence, explain why an accessible name matters for a form input.");

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
<summary>ステップ 1 の完成コード</summary>

ステップ 1 の完成コードと自分の実装を比較してください。

```typescript
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({});
  try {
    const response = await session.sendAndWait({ prompt: "Reply with one sentence confirming this Copilot session is ready." });
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
<summary>ステップ 1 の完成コード</summary>

ステップ 1 の完成コードと自分の実装を比較してください。

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
            await session.send("In one sentence, explain why an accessible name matters for a form input.")
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
<summary>ステップ 1 の完成コード</summary>

ステップ 1 の完成コードと自分の実装を比較してください。

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
		Prompt: "In one sentence, explain why an accessible name matters for a form input.",
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
<summary>ステップ 1 の完成コード</summary>

ステップ 1 の完成コードと自分の実装を比較してください。

```rust
use github_copilot_sdk::types::{MessageOptions, SessionConfig};
use github_copilot_sdk::{Client, ClientOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::start(ClientOptions::default()).await?;
    let session = client.create_session(SessionConfig::default()).await?;
    let response = session
        .send_and_wait(MessageOptions::new(
            "In one sentence, explain why an accessible name matters for a form input.",
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
<summary>ステップ 1 の完成コード</summary>

ステップ 1 の完成コードと自分の実装を比較してください。

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
                    .setPrompt("In one sentence, explain why an accessible name matters for a form input."))
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

- [Copilot を活用した最初のアプリを作成する](https://docs.github.com/en/copilot/how-tos/copilot-sdk/getting-started)：
  同じように最初のクライアント、セッション、プロンプトを扱う GitHub のチュートリアルです。
- [セッションの再開と永続化](https://github.com/github/copilot-sdk/blob/main/docs/features/session-persistence.md)：
  セッションの会話状態を保持する仕組みと、再起動後に再開する方法を説明しています。
- [コンテキストのクリア](https://github.com/github/copilot-sdk/blob/main/docs/features/context-management.md)：
  新しいセッションを作成せずに、セッション内の会話を置き換える方法です。
- [認証](https://github.com/github/copilot-sdk/blob/main/docs/auth/README.md)：
  `copilot login` 以外の方法を使うときに、クライアントが利用できる認証情報について説明しています。

[ステップ 2：応答をストリーミングする](02-streaming.md)に進んでください。
