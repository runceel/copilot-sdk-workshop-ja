# ステップ 2：応答をストリーミングする

> **所要時間：** 10 分

## 確認すること

ストリーミングを有効にしたセッションを設定し、完了したことがわかるようにします。ほとんどの言語コースでは、
セッションが処理中の間に応答テキストを表示します。Java コースも同様にセッションのストリーミングを有効にしますが、
`sendAndWait` が返す完成したアシスタントのメッセージを表示します。

## ストリーミングで体験がどう変わるか

[**ストリーミング**](https://github.com/github/copilot-sdk/blob/main/docs/features/streaming-events.md)は、
回答の内容を変えるものではありません。イベントストリームを購読するアプリケーションが、
回答を受け取るタイミングを変えます。セッションは、完成したメッセージを 1 つ待つ代わりに、
ターンの進行中にイベントを送出します。

- アシスタントのメッセージ差分イベントには、新しく生成された応答テキストの断片が含まれます。
- アシスタントのメッセージ完了イベントには、メッセージ全体が含まれます。
- セッションのアイドルイベントは、ターンとすべてのツール処理が終了したことを示します。
- セッションのエラーイベントは、ターンの失敗を通知します。

## 逐次表示で応答性が高く感じられる理由

テキストが順に届く様子を見ると、アプリケーションの応答性が高く感じられます。後のステップでは、
同じイベントストリームを使ってローカルツールや MCP ツールの動作も表示します。

セッションの流れは `response deltas -> final message -> idle` になります。

:::language dotnet
## C# で応答をストリーミングする

### 1. ストリーミング用ヘルパーを追加する

`Helpers/ResponseStreamer.cs` を作成します。

```csharp
using GitHub.Copilot;

namespace HelloCopilotSDK.Helpers;

public static class ResponseStreamer
{
    public static async Task SendAndPrintAsync(CopilotSession session, string prompt)
    {
        var completed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var receivedDelta = false;

        using var subscription = session.On<SessionEvent>(sessionEvent =>
        {
            switch (sessionEvent)
            {
                case AssistantMessageDeltaEvent delta when !string.IsNullOrEmpty(delta.Data.DeltaContent):
                    receivedDelta = true;
                    Console.Write(delta.Data.DeltaContent);
                    break;
                case AssistantMessageEvent message when !receivedDelta:
                    Console.Write(message.Data.Content);
                    break;
                case SessionIdleEvent:
                    Console.WriteLine();
                    completed.TrySetResult();
                    break;
                case SessionErrorEvent error:
                    completed.TrySetException(new InvalidOperationException(error.Data.Message));
                    break;
            }
        });

        await session.SendAsync(new MessageOptions { Prompt = prompt });
        await completed.Task;
    }
}
```

最終メッセージの分岐は、差分を送らずに完了するランタイムに対応します。エラー時は、
ターンが成功したように見せるのではなく、例外でタスクを完了させます。

### 2. ヘルパーを使用する

`Program.cs` に `using HelloCopilotSDK.Helpers;` を追加し、セッションと
応答のコードを次に置き換えます。

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Streaming = true
});

Console.WriteLine("\nCopilot:");
await ResponseStreamer.SendAndPrintAsync(
    session,
    "Explain accessible names in three short bullet points.");
```

## 実行する

```bash
dotnet run
```

プロセスが終了する前に、箇条書きが少しずつ表示され始めます。

```text
Connected to the Copilot runtime: ...

Copilot:
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| テキストが最後にまとめて表示される | このセッションの `SessionConfig` に `Streaming = true` があることを確認します。 |
| テキストが表示される前にアプリケーションが終了する | ヘルパーが `SendAsync` の後に `completed.Task` を待機していることを確認します。 |
| テキストが 2 回表示される | `AssistantMessageEvent` の `when !receivedDelta` ガードを残してください。 |

</details>

> **ツールの追加に進む条件：** 設定した応答処理が回答を表示し、セッションのエラーを隠さずに
> ターンを完了できること。

<details>
<summary>ステップ 2 の完成コード</summary>

ステップ 2 の完成コードと自分の実装を比較してください。

`Helpers/ResponseStreamer.cs`:

```csharp
using GitHub.Copilot;

namespace HelloCopilotSDK.Helpers;

public static class ResponseStreamer
{
    public static async Task SendAndPrintAsync(CopilotSession session, string prompt)
    {
        var completed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var receivedDelta = false;

        using var subscription = session.On<SessionEvent>(sessionEvent =>
        {
            switch (sessionEvent)
            {
                case AssistantMessageDeltaEvent delta when !string.IsNullOrEmpty(delta.Data.DeltaContent):
                    receivedDelta = true;
                    Console.Write(delta.Data.DeltaContent);
                    break;
                case AssistantMessageEvent message when !receivedDelta:
                    Console.Write(message.Data.Content);
                    break;
                case SessionIdleEvent:
                    Console.WriteLine();
                    completed.TrySetResult();
                    break;
                case SessionErrorEvent error:
                    completed.TrySetException(new InvalidOperationException(error.Data.Message));
                    break;
            }
        });

        await session.SendAsync(new MessageOptions { Prompt = prompt });
        await completed.Task;
    }
}
```

`Program.cs`:

```csharp
using GitHub.Copilot;
using HelloCopilotSDK.Helpers;

Console.WriteLine("=== Streaming from Copilot ===\n");

await using var client = new CopilotClient();
await client.StartAsync();

var ping = await client.PingAsync("workshop");
Console.WriteLine($"Connected to the Copilot runtime: {ping.Message}\n");

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Streaming = true
});

Console.WriteLine("Copilot:");
await ResponseStreamer.SendAndPrintAsync(
    session,
    "Explain accessible names in three short bullet points.");
```

</details>
:::

:::language nodejs
## TypeScript で応答をストリーミングする

### 1. ストリーミング用ヘルパーを確認する

`src/workshop.ts` を開きます。スターターには `streamResponse` がすでにエクスポートされています。
これは `session.on` でイベントを購読し、アシスタントの差分を表示し、最終メッセージへのフォールバックを備え、
セッションエラー時には拒否し、アイドル時には正常完了します。

```typescript
export async function streamResponse(session: CopilotSession, prompt: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let receivedDelta = false;
    const unsubscribe = session.on((event) => {
      if (event.type === "assistant.message_delta" && event.data.deltaContent) {
        receivedDelta = true;
        process.stdout.write(event.data.deltaContent);
      } else if (event.type === "assistant.message" && !receivedDelta) {
        process.stdout.write(event.data.content);
      } else if (event.type === "tool.execution_start") {
        console.log(`\n[tool:start] ${event.data.toolName}`);
      } else if (event.type === "tool.execution_complete") {
        console.log(`[tool:done] success=${event.data.success}`);
      } else if (event.type === "session.error") {
        reject(new Error(event.data.message));
      } else if (event.type === "session.idle") {
        console.log();
        unsubscribe();
        resolve();
      }
    });
    void session.send({ prompt }).catch(reject);
  });
}
```

ツールの開始と完了の分岐はこのステップでは動作しませんが、
後でツールを登録すると役立ちます。

### 2. エントリーポイントにヘルパーを組み込む

`src/index.ts` を次に置き換えます。

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import { streamResponse } from "./workshop.js";

const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({ streaming: true });
  try {
    await streamResponse(
      session,
      "Describe why streaming improves an interactive assistant in one sentence.",
    );
  } finally {
    await session.disconnect();
  }
} finally {
  await client.stop();
}
```

## 実行する

```bash
npm start
```

イベントコールバックを通じて、1 文の応答が少しずつ表示され始めます。

```text
Streaming shows partial answers as soon as tokens arrive, so the assistant feels responsive while it works.
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| テキストが最後にまとめて表示される | `createSession` に `streaming: true` を渡していることを確認します。 |
| テキストが表示される前にプロセスが終了する | `streamResponse` が正常完了する前に `session.idle` を待っていることを確認します。 |
| テキストが 2 回表示される | `assistant.message` 分岐の `!receivedDelta` ガードを残してください。 |
| モジュール `./workshop.js` が見つからない | ソースファイルが `workshop.ts` でも、ヘルパーは `./workshop.js` としてインポートしてください。 |

</details>

> **ツールの追加に進む条件：** 設定した応答処理が回答を表示し、セッションのエラーを隠さずに
> ターンを完了できること。

<details>
<summary>ステップ 2 の完成コード</summary>

ステップ 2 の完成コードと自分の実装を比較してください。

`src/workshop.ts` (`streamResponse`):

```typescript
export async function streamResponse(session: CopilotSession, prompt: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let receivedDelta = false;
    const unsubscribe = session.on((event) => {
      if (event.type === "assistant.message_delta" && event.data.deltaContent) {
        receivedDelta = true;
        process.stdout.write(event.data.deltaContent);
      } else if (event.type === "assistant.message" && !receivedDelta) {
        process.stdout.write(event.data.content);
      } else if (event.type === "tool.execution_start") {
        console.log(`\n[tool:start] ${event.data.toolName}`);
      } else if (event.type === "tool.execution_complete") {
        console.log(`[tool:done] success=${event.data.success}`);
      } else if (event.type === "session.error") {
        reject(new Error(event.data.message));
      } else if (event.type === "session.idle") {
        console.log();
        unsubscribe();
        resolve();
      }
    });
    void session.send({ prompt }).catch(reject);
  });
}
```

`src/index.ts`:

```typescript
import { CopilotClient } from "@github/copilot-sdk";
import { streamResponse } from "./workshop.js";

const client = new CopilotClient();
await client.start();
try {
  const session = await client.createSession({ streaming: true });
  try {
    await streamResponse(
      session,
      "Describe why streaming improves an interactive assistant in one sentence.",
    );
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
## Python で応答をストリーミングする

### 1. セッションイベントを購読する

`main.py` を、ストリーミングを有効にし、`AssistantMessageDeltaData` を処理する
非同期エントリーポイントに置き換えます。`AssistantMessageData` へのフォールバックを備え、
`SessionErrorData` を表に出し、`SessionIdleData` を待機します。

```python
import asyncio

from copilot import CopilotClient
from copilot.session_events import (
    AssistantMessageData,
    AssistantMessageDeltaData,
    SessionErrorData,
    SessionIdleData,
)


async def main() -> None:
    async with CopilotClient() as client:
        async with await client.create_session(streaming=True) as session:
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
                "Explain accessible names in three short bullet points."
            )
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

最終メッセージの分岐は、差分なしで完了するランタイムに対応します。セッションエラー時は
`error` を設定して待機を終了し、ターンが成功したように見えないようにします。

## 実行する

```bash
python main.py
```

イベントコールバックを通じて、箇条書きが少しずつ表示され始めます。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| テキストが最後にまとめて表示される | `create_session` に `streaming=True` を渡していることを確認します。 |
| テキストが表示される前にプロセスが終了する | `session.send` の後に `await done.wait()` を実行していることを確認します。 |
| テキストが 2 回表示される | `AssistantMessageData` の `not received_delta` ガードを残してください。 |
| セッションイベントのインポートエラー | イベント型を `copilot.session_events` からインポートしてください。 |

</details>

> **ツールの追加に進む条件：** 設定した応答処理が回答を表示し、セッションのエラーを隠さずに
> ターンを完了できること。

<details>
<summary>ステップ 2 の完成コード</summary>

ステップ 2 の完成コードと自分の実装を比較してください。

`main.py`:

```python
import asyncio

from copilot import CopilotClient
from copilot.session_events import AssistantMessageData, AssistantMessageDeltaData, SessionErrorData, SessionIdleData


async def main() -> None:
    async with CopilotClient() as client:
        async with await client.create_session(streaming=True) as session:
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
            await session.send("Explain accessible names in three short bullet points.")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

</details>
:::

:::language go
## Go で応答をストリーミングする

### 1. ストリーミング用ヘルパーを追加する

`main.go` のパッケージ内容を、`session.On` で購読し、
`AssistantMessageDeltaData` を表示する `streamResponse` ヘルパーに置き換えます。`SendAndWait` の後に
`AssistantMessageData` へのフォールバックを備え、送信エラーを返します。

```go
package main

import (
	"context"
	"fmt"

	copilot "github.com/github/copilot-sdk/go"
)

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
```

### 2. ストリーミングセッションを作成してヘルパーを呼び出す

ヘルパーの下に `main` を追加します。

```go
func main() {
	client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
	if err := client.Start(context.Background()); err != nil {
		panic(err)
	}
	defer client.Stop()

	session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
		Streaming: copilot.Bool(true),
	})
	if err != nil {
		panic(err)
	}
	defer session.Disconnect()

	if err := streamResponse(session, "Explain accessible names in three short bullet points."); err != nil {
		panic(err)
	}
}
```

## 実行する

```bash
go run .
```

イベントコールバックを通じて、箇条書きが少しずつ表示され始めます。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| テキストが最後にまとめて表示される | `SessionConfig` に `Streaming: copilot.Bool(true)` が設定されていることを確認します。 |
| 何も出力せずにプロセスが終了する | `streamResponse` が `SendAndWait` を使用し、そのエラーを返していることを確認します。 |
| テキストが 2 回表示される | `AssistantMessageData` を表示する前の `!receivedDelta` ガードを残してください。 |
| インポートパスのエラー | `copilot "github.com/github/copilot-sdk/go"` を使用します。 |

</details>

> **ツールの追加に進む条件：** 設定した応答処理が回答を表示し、セッションのエラーを隠さずに
> ターンを完了できること。

<details>
<summary>ステップ 2 の完成コード</summary>

ステップ 2 の完成コードと自分の実装を比較してください。

`main.go`:

```go
package main

import (
	"context"
	"fmt"

	copilot "github.com/github/copilot-sdk/go"
)

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
	client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
	if err := client.Start(context.Background()); err != nil {
		panic(err)
	}
	defer client.Stop()

	session, err := client.CreateSession(context.Background(), &copilot.SessionConfig{
		Streaming: copilot.Bool(true),
	})
	if err != nil {
		panic(err)
	}
	defer session.Disconnect()

	if err := streamResponse(session, "Explain accessible names in three short bullet points."); err != nil {
		panic(err)
	}
}
```

</details>
:::

:::language rust
## Rust で応答をストリーミングする

### 1. ストリーミング用ヘルパーマクロを追加する

`src/main.rs` を、`session.subscribe()` を呼び出し、
`tokio::select!` でアシスタントの差分を表示する `stream_response!` マクロに置き換えます。最終メッセージへの
フォールバックを備え、送信の完了と `session.idle` の両方が発生するまで待機します。

```rust
use std::io::{self, Write};

use github_copilot_sdk::types::SessionConfig;
use github_copilot_sdk::{Client, ClientOptions};

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
```

### 2. ストリーミングセッションを作成してマクロを呼び出す

マクロの下に非同期エントリーポイントを追加します。

```rust
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::start(ClientOptions::default()).await?;
    let mut config = SessionConfig::default();
    config.streaming = Some(true);
    let session = client.create_session(config).await?;

    stream_response!(
        session,
        "Explain accessible names in three short bullet points.".to_owned()
    );
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```

## 実行する

```bash
cargo run
```

購読したイベントを通じて、箇条書きが少しずつ表示され始めます。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| テキストが最後にまとめて表示される | `create_session` の前に `config.streaming = Some(true)` があることを確認します。 |
| テキストが表示される前にプロセスが終了する | `while !sent \|\| !idle` ループを残し、`session.idle` を待機します。 |
| テキストが 2 回表示される | `"assistant.message"` の `if !received_delta` ガードを残してください。 |
| 出力がバッファリングされているように見える | 差分の内容を `print!` で出力するたびに標準出力をフラッシュしてください。 |

</details>

> **ツールの追加に進む条件：** 設定した応答処理が回答を表示し、セッションのエラーを隠さずに
> ターンを完了できること。

<details>
<summary>ステップ 2 の完成コード</summary>

ステップ 2 の完成コードと自分の実装を比較してください。

`src/main.rs`:

```rust
use std::io::{self, Write};

use github_copilot_sdk::types::SessionConfig;
use github_copilot_sdk::{Client, ClientOptions};

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
    let client = Client::start(ClientOptions::default()).await?;
    let mut config = SessionConfig::default();
    config.streaming = Some(true);
    let session = client.create_session(config).await?;

    stream_response!(
        session,
        "Explain accessible names in three short bullet points.".to_owned()
    );
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```

</details>
:::

:::language java
## Java で応答をストリーミングする

### 1. セッションのストリーミングを有効にする

Java SDK の実装では、ストリーミングを有効にした `SessionConfig` と `sendAndWait` を使い、
完成したアシスタントのメッセージを表示します。`src/main/java/workshop/AccessibilityReport.java` を次に置き換えます。

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.MessageOptions;
import com.github.copilot.rpc.PermissionHandler;
import com.github.copilot.rpc.SessionConfig;

public final class AccessibilityReport {
    private AccessibilityReport() {
    }

    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(new SessionConfig()
                    .setStreaming(true)
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();
            var response = session.sendAndWait(new MessageOptions()
                    .setPrompt("Explain accessible names in three short bullet points."))
                    .get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
    }
}
```

`setStreaming(true)` によって、このステップの設定をほかの言語コースとそろえています。Java の実装では、
`sendAndWait` から完成した応答が返るのを待ち、
ターンの終了時にメッセージ全体を表示します。

## 実行する

```bash
mvn compile exec:java
```

プロセスが終了する前に、完成した応答が表示されます。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

<details>
<summary>実行時のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| 応答が表示されない | `SessionConfig` に `setStreaming(true)` があり、`sendAndWait` を呼び出していることを確認します。 |
| 応答が null になり、プロセスが失敗する | `response == null` ガードを残し、メッセージなしでターンが完了した場合は例外を送出します。 |
| Maven がメインクラスを見つけられない | スターターディレクトリから `mvn compile exec:java` で実行します。 |

</details>

> **ツールの追加に進む条件：** 設定した応答処理が回答を表示し、セッションのエラーを隠さずに
> ターンを完了できること。

<details>
<summary>ステップ 2 の完成コード</summary>

ステップ 2 の完成コードと自分の実装を比較してください。

`src/main/java/workshop/AccessibilityReport.java`:

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.MessageOptions;
import com.github.copilot.rpc.PermissionHandler;
import com.github.copilot.rpc.SessionConfig;

public final class AccessibilityReport {
    private AccessibilityReport() {
    }

    public static void main(String[] args) throws Exception {
        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(new SessionConfig()
                    .setStreaming(true)
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();
            var response = session.sendAndWait(new MessageOptions()
                    .setPrompt("Explain accessible names in three short bullet points."))
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

## 理解度を確認する

イベントストリーミングよりも、応答の完了を待つ送信処理が適しているのはどのような場合でしょうか。

<details>
<summary>解答を確認する</summary>

逐次表示や途中のイベントが不要なバックグラウンド処理や、
単純なリクエストと応答のコードでは、応答の完了を待つ送信処理を使います。

</details>

## さらに学ぶ

- [方向転換とキューイング](https://github.com/github/copilot-sdk/blob/main/docs/features/steering-and-queueing.md)：
  ターンの実行中に別のメッセージを送り、方向転換を指示したり、作業をキューに追加したりする方法です。
- [セッションの制限](https://github.com/github/copilot-sdk/blob/main/docs/features/session-limits.md)：
  トークンの生成が始まる前に、セッションに AI Credits の予算を設定する方法です。
- [使用量と課金のメトリクス](https://github.com/github/copilot-sdk/blob/main/docs/features/usage-and-billing.md)：
  同じイベントストリームから、トークン数、コンテキストウィンドウの使用量、コストを読み取る方法です。

[ステップ 3：アプリケーションが管理する知識を追加する](03-local-tool.md)に進んでください。
