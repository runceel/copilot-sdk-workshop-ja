# ステップ 2: レスポンスをストリーミングする

> **所要時間:** 10 分

## 確認すること

ストリーミングを有効にしたセッションを構成し、完了を可視化します。ほとんどの言語トラックでは、
セッションがまだ処理している間にレスポンステキストを出力します。Java トラックでは同じストリーミング
セッション構成を有効にし、`sendAndWait` が返す完了済みのアシスタントメッセージを出力します。

## ストリーミングが体験をどう変えるか

[**ストリーミング**](https://github.com/github/copilot-sdk/blob/main/docs/features/streaming-events.md)
は回答自体を変えるものではありません。イベントストリームを購読するアプリケーションが回答を受け取る
タイミングを変えます。1 つの完了済みメッセージを待つのではなく、セッションはターン全体を通じてイベントを
発行します。

- アシスタントメッセージのデルタイベントには、レスポンステキストの新しい各断片が含まれます。
- 完了済みのアシスタントメッセージイベントには、メッセージ全体が含まれます。
- セッションのアイドルイベントは、ターンおよびすべてのツール処理が完了したことを意味します。
- セッションのエラーイベントは、失敗したターンを報告します。

## 段階的な出力の方が快適に感じられる理由

テキストが届く様子が見えることで、アプリケーションの応答性が高く感じられます。後ほど、同じイベント
ストリームでローカルツールと MCP ツールの活動も表示されるようになります。

セッションのフローは現在 `response deltas -> final message -> idle` となっています。

:::language dotnet
## C# でレスポンスをストリーミングする

### 1. ストリーミングヘルパーを追加する

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

最終メッセージのケースは、デルタを送信せずに完了するランタイムに対応します。エラーは、成功した
ターンのように見せるのではなく、例外でタスクを完了させます。

### 2. ヘルパーを使用する

`Program.cs` で `using HelloCopilotSDK.Helpers;` を追加し、セッションとレスポンスのコードを次のように
置き換えます。

```csharp
await using var session = await client.CreateSessionAsync(new SessionConfig
{
    Streaming = true
});

Console.WriteLine("\nCopilot:");
await ResponseStreamer.SendAndPrintAsync(
    session,
    "アクセシブルネームについて、短い箇条書き 3 点で説明してください。");
```


## 実行する

```bash
dotnet run
```

箇条書きは、プロセスが終了する前に段階的に表示され始めるはずです。

```text
=== First Copilot session ===

Connected to the Copilot runtime: pong: workshop

Copilot:

- アクセシブルネーム(accessible name)とは、スクリーンリーダー等の支援技術がUI要素を読み上げる際に使う「名前」で、ボタンやリンク、フォーム部品が何であるかをユーザーに伝える役割を持つ。
- 決定方法には優先順位があり、aria-labelledby > aria-label > ネイティブなラベル付け(labelタグ、alt属性など) > 要素のテキストコンテンツ、といった順で計算される(Accessible Name and Description Computation仕様に準拠)。
- 適切なアクセシブルネームがないと、アイコンのみのボタンや画像リンクなどが「ボタン」「リンク」としか読み上げられず、視覚障害のあるユーザーが操作目的を理解できなくなるため、明確で簡潔な名前を設定することが重要。
```

> **日本語補足（出力例）:** Copilot の回答が 3 つの箇条書きとして表示される例です。各項目が段階的に表示され、最後まで出力されてプロセスが終了すれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| テキストが最後にしか表示されない | このセッションの `SessionConfig` に `Streaming = true` があることを確認します。 |
| テキストが表示される前にアプリケーションが終了する | ヘルパーが `SendAsync` の後で `completed.Task` を await していることを確認します。 |
| テキストが 2 回出力される | `AssistantMessageEvent` の `when !receivedDelta` ガードを維持します。 |

</details>

> **ツールを追加できる状態:** 設定したレスポンス処理が回答を返し、セッションエラーを隠さずに
> ターンを完了していること。

<details>
<summary>ステップ 2 の完全な実装</summary>

この完全なステップ 2 の実装と自分の作業を比較してください。

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
    "アクセシブルネームについて、短い箇条書き 3 点で説明してください。");
```

</details>
:::

:::language nodejs
## TypeScript でレスポンスをストリーミングする

### 1. ストリーミングヘルパーを確認する

`src/workshop.ts` を開きます。スターターにはすでに `streamResponse` がエクスポートされています。これは
`session.on` で購読し、アシスタントのデルタを出力し、最終メッセージのフォールバックを保持し、セッション
エラーを reject し、アイドル時に resolve します。

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

ツールの開始および完了の分岐は、このステップでは何も表示しませんが、後でツールを登録すると役立つように
なります。

### 2. ヘルパーをエントリーポイントに組み込む

`src/index.ts` を次のように置き換えます。

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
      "ストリーミングが対話型アシスタントをどのように改善するか、1 文で説明してください。",
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

1 文のレスポンスが、イベントコールバックを通じて段階的に表示され始めるはずです。

```text
Streaming shows partial answers as soon as tokens arrive, so the assistant feels responsive while it works.
```

> **日本語補足（出力例）:** ストリーミングによって部分的な回答が届き次第表示されることを説明する 1 文の例です。応答性の向上に触れた文が表示されれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| テキストが最後にしか表示されない | `createSession` に `streaming: true` が渡されていることを確認します。 |
| テキストが表示される前にプロセスが終了する | `streamResponse` が resolve する前に `session.idle` を待っていることを確認します。 |
| テキストが 2 回出力される | `assistant.message` の分岐にある `!receivedDelta` ガードを維持します。 |
| モジュール `./workshop.js` が見つからない | ソースファイルが `workshop.ts` であっても、ヘルパーは `./workshop.js` としてインポートします。 |

</details>

> **ツールを追加できる状態:** 設定したレスポンス処理が回答を返し、セッションエラーを隠さずに
> ターンを完了していること。

<details>
<summary>ステップ 2 の完全な実装</summary>

この完全なステップ 2 の実装と自分の作業を比較してください。

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
      "ストリーミングが対話型アシスタントをどのように改善するか、1 文で説明してください。",
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
## Python でレスポンスをストリーミングする

### 1. セッションイベントを購読する

`main.py` を、ストリーミングを有効にし、`AssistantMessageDeltaData` を処理し、
`AssistantMessageData` のフォールバックを保持し、`SessionErrorData` を表面化させ、
`SessionIdleData` を待機する非同期エントリーポイントに置き換えます。

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
                "アクセシブルネームについて、短い箇条書き 3 点で説明してください。"
            )
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```


最終メッセージのケースは、デルタを送信せずに完了するランタイムに対応します。セッションエラーは
`error` を設定して待機を完了させるため、ターンが成功したようには見えません。

## 実行する

```bash
python main.py
```

箇条書きは、イベントコールバックを通じて段階的に表示され始めるはずです。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

> **日本語補足（出力例）:** Copilot の回答が 3 つの箇条書きとして表示される例です。各項目が段階的に表示され、最後まで出力されてプロセスが終了すれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| テキストが最後にしか表示されない | `create_session` に `streaming=True` が渡されていることを確認します。 |
| テキストが表示される前にプロセスが終了する | `session.send` の後で `await done.wait()` していることを確認します。 |
| テキストが 2 回出力される | `AssistantMessageData` の `not received_delta` ガードを維持します。 |
| セッションイベントのインポートエラー | イベント型は `copilot.session_events` からインポートします。 |

</details>

> **ツールを追加できる状態:** 設定したレスポンス処理が回答を返し、セッションエラーを隠さずに
> ターンを完了していること。

<details>
<summary>ステップ 2 の完全な実装</summary>

この完全なステップ 2 の実装と自分の作業を比較してください。

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
            await session.send("アクセシブルネームについて、短い箇条書き 3 点で説明してください。")
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

</details>
:::

:::language go
## Go でレスポンスをストリーミングする

### 1. ストリーミングヘルパーを追加する

`main.go` で、パッケージの内容を、`session.On` で購読し、`AssistantMessageDeltaData` を出力し、
`SendAndWait` の後に `AssistantMessageData` のフォールバックを保持し、送信エラーを返す
`streamResponse` ヘルパーに置き換えます。

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

	if err := streamResponse(session, "アクセシブルネームについて、短い箇条書き 3 点で説明してください。"); err != nil {
		panic(err)
	}
}
```


## 実行する

```bash
go run .
```

箇条書きは、イベントコールバックを通じて段階的に表示され始めるはずです。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

> **日本語補足（出力例）:** Copilot の回答が 3 つの箇条書きとして表示される例です。各項目が段階的に表示され、最後まで出力されてプロセスが終了すれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| テキストが最後にしか表示されない | `SessionConfig` に `Streaming: copilot.Bool(true)` が設定されていることを確認します。 |
| 出力されずにプロセスが終了する | `streamResponse` が `SendAndWait` を使用し、そのエラーを返していることを確認します。 |
| テキストが 2 回出力される | `AssistantMessageData` を出力する前の `!receivedDelta` ガードを維持します。 |
| インポートパスのエラー | `copilot "github.com/github/copilot-sdk/go"` を使用します。 |

</details>

> **ツールを追加できる状態:** 設定したレスポンス処理が回答を返し、セッションエラーを隠さずに
> ターンを完了していること。

<details>
<summary>ステップ 2 の完全な実装</summary>

この完全なステップ 2 の実装と自分の作業を比較してください。

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

	if err := streamResponse(session, "アクセシブルネームについて、短い箇条書き 3 点で説明してください。"); err != nil {
		panic(err)
	}
}
```

</details>
:::

:::language rust
## Rust でレスポンスをストリーミングする

### 1. ストリーミングヘルパーマクロを追加する

`src/main.rs` を、`session.subscribe()` を呼び出し、`tokio::select!` でアシスタントのデルタを出力し、
最終メッセージのフォールバックを保持し、送信完了と `session.idle` の両方が発生するまで待機する
`stream_response!` マクロに置き換えます。

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
        "アクセシブルネームについて、短い箇条書き 3 点で説明してください。".to_owned()
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

箇条書きは、イベント購読を通じて段階的に表示され始めるはずです。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

> **日本語補足（出力例）:** Copilot の回答が 3 つの箇条書きとして表示される例です。各項目が段階的に表示され、最後まで出力されてプロセスが終了すれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| テキストが最後にしか表示されない | `create_session` の前に `config.streaming = Some(true)` があることを確認します。 |
| テキストが表示される前にプロセスが終了する | `while !sent \|\| !idle` ループを維持し、`session.idle` を待ちます。 |
| テキストが 2 回出力される | `"assistant.message"` の `if !received_delta` ガードを維持します。 |
| 出力がバッファリングされているように見える | デルタ内容を `print!` するたびに stdout をフラッシュします。 |

</details>

> **ツールを追加できる状態:** 設定したレスポンス処理が回答を返し、セッションエラーを隠さずに
> ターンを完了していること。

<details>
<summary>ステップ 2 の完全な実装</summary>

この完全なステップ 2 の実装と自分の作業を比較してください。

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
        "アクセシブルネームについて、短い箇条書き 3 点で説明してください。".to_owned()
    );
    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```

</details>
:::

:::language java
## Java でレスポンスをストリーミングする

### 1. セッションでストリーミングを有効にする

Java SDK の実装では、ストリーミングを有効にした `SessionConfig` と `sendAndWait` を使用し、その後
完了済みのアシスタントメッセージを出力します。`src/main/java/workshop/AccessibilityReport.java` を
次のように置き換えます。

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
                    .setPrompt("アクセシブルネームについて、短い箇条書き 3 点で説明してください。"))
                    .get();
            if (response == null) {
                throw new IllegalStateException("Copilot completed without an assistant message.");
            }
            System.out.println(response.getData().content());
        }
    }
}
```


`setStreaming(true)` により、このステップを他の言語トラックと足並みをそろえます。Java の実装は
`sendAndWait` からの完了済みレスポンスを待ち、ターンが終了したときにそのメッセージ全体を出力します。

## 実行する

```bash
mvn compile exec:java
```

完了済みのレスポンスが、プロセスが終了する前に出力されるはずです。

```text
- Gives a control a programmatic identity.
- Helps screen-reader users understand its purpose.
- Connects visible labels to form controls.
```

> **日本語補足（出力例）:** Copilot の回答が 3 つの箇条書きとして表示される例です。各項目が段階的に表示され、最後まで出力されてプロセスが終了すれば成功です。

<details>
<summary>この実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| レスポンスが出力されない | `SessionConfig` に `setStreaming(true)` があり、`sendAndWait` を呼び出していることを確認します。 |
| null レスポンスでプロセスが失敗する | `response == null` ガードを維持し、ターンがメッセージなしで完了したときにスローします。 |
| Maven がメインクラスを見つけられない | スターターディレクトリから `mvn compile exec:java` を実行します。 |

</details>

> **ツールを追加できる状態:** 設定したレスポンス処理が回答を返し、セッションエラーを隠さずに
> ターンを完了していること。

<details>
<summary>ステップ 2 の完全な実装</summary>

この完全なステップ 2 の実装と自分の作業を比較してください。

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
                    .setPrompt("アクセシブルネームについて、短い箇条書き 3 点で説明してください。"))
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

## 理解度チェック

完了済みレスポンスの送信が、イベントストリーミングよりも良い選択となるのはどのような場合でしょうか。

<details>
<summary>答えを確認する</summary>

段階的な出力や中間イベントを必要としない、バックグラウンド処理やシンプルなリクエスト/レスポンスの
コードには、完了済みレスポンスの送信を使用します。

</details>

## 参考資料

- [Steering and queueing](https://github.com/github/copilot-sdk/blob/main/docs/features/steering-and-queueing.md):
  応答の生成中に別のメッセージを送り、指示を変えたり、次の作業を予約したりする方法です。
- [Session limits](https://github.com/github/copilot-sdk/blob/main/docs/features/session-limits.md):
  トークン数などに上限を設け、セッションの利用量を制限する方法を説明しています。
- [Usage and billing metrics](https://github.com/github/copilot-sdk/blob/main/docs/features/usage-and-billing.md):
  イベントストリームからトークン数やコンテキストの使用量、コストを取得する方法を説明しています。

[ステップ 3: アプリ独自の知識を追加する](03-local-tool.md)に進みましょう。
