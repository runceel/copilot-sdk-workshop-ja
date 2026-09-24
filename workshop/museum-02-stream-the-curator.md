# ステップ 2: キュレーターの応答をストリーミングする

> **所要時間:** 10 分

## 作成するもの

同じプロンプトを使いますが、何も表示されずに待つ代わりに、応答が少しずつ表示されるようにします。

イベントループを作成する必要はありません。スターターの用意済みキュレーターヘルパーには、
ストリーミング出力機能があります。
[セッションイベント](https://github.com/github/copilot-sdk/blob/main/docs/features/streaming-events.md)を購読し、
各差分を標準出力に書き出し、ツールの動作を報告し、セッションエラーで失敗し、タイムアウトを
適用します。また、すべての終了経路で購読を解除し、蓄積した全文を返します。ここでは
ストリーミングを有効にして、この機能を呼び出すだけです。

## キュレーターにとってストリーミングが重要な理由

展示文は、人間が読んで判断する文章です。逐次表示される様子を見れば、口調が適切か、
モデルが無駄に長くしていないか、主題から逸れていないかを、実行の終了を待たずに
把握できます。ストリーミングによってツール呼び出しにも気づけます。これは、
キュレーターが文章を書く前にアプリケーションの事実ツールを呼び出す必要がある
ステップ 4 以降で重要になります。

ヘルパーは応答全体を文字列で返すため、以降はストリームの終了後に、完成した
テキストをいつでも確認できます。

## 待機する呼び出しをストリーミング出力に置き換える

:::language dotnet
`Program.cs` の内容全体を置き換えます。

```csharp
using GitHub.Copilot;
using GitHub.Copilot.Rpc;
using MuseumExhibitStudio.Helpers;

Console.WriteLine("=== Museum Exhibit Studio ===");
Console.WriteLine();

await using var client = new CopilotClient();
await client.StartAsync();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    ClientName = "museum-exhibit-studio",
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Streaming = true
});

await CuratorStreamer.StreamExhibitAsync(
    session,
    "Write two sentences of museum wall text about the Apollo 11 Moon landing.");

await client.StopAsync();
```

変更は 2 つです。セッション設定に `Streaming = true` を指定し、`SendAndWaitAsync` の代わりに
`CuratorStreamer.StreamExhibitAsync` を使います。ステップ 1 の権限ハンドラーはそのまま残します。
ヘルパーは `Helpers/CuratorStreamer.cs` にあり、編集しません。

**内部を確認:** `Helpers/CuratorStreamer.cs` を開き、`StreamExhibitAsync` を一度読んでください。これは
SDK のイベントループで、ストリーミングの仕組みをワークショップ内で最もわかりやすく確認できる箇所です。
`session.On<SessionEvent>` で購読し、`AssistantMessageDeltaEvent` の各チャンクを
到着と同時に蓄積・出力します。`ToolExecutionStartEvent` ごとに `[tool:start]`、
`ToolExecutionCompleteEvent` ごとに `[tool:done]` の行を出力し、`SessionIdleEvent` で完了、
`SessionErrorEvent` で失敗します。`Task.Delay` との競合によりタイムアウトが `TimeoutException` になり、
どの終了経路でも購読が破棄されます。
:::

:::language nodejs
`src/index.ts` の内容全体を置き換えます。

```typescript
import { approveAll, CopilotClient } from "@github/copilot-sdk";
import { streamExhibit } from "./curator.js";

async function main(): Promise<void> {
  console.log("=== Museum Exhibit Studio ===");
  console.log();

  const client = new CopilotClient();
  await client.start();
  const session = await client.createSession({
    clientName: "museum-exhibit-studio",
    onPermissionRequest: approveAll,
    streaming: true,
  });

  await streamExhibit(
    session,
    "Write two sentences of museum wall text about the Apollo 11 Moon landing.",
  );

  await session.disconnect();
  await client.stop();
}

void main();
```

変更は 2 つです。セッション設定に `streaming: true` を指定し、`sendAndWait` の代わりに
`streamExhibit` を使います。ステップ 1 の権限ハンドラーはそのまま残します。ヘルパーは
`src/curator.ts` にあり、編集しません。

**内部を確認:** `src/curator.ts` を開き、`streamExhibit` を一度読んでください。これは SDK のイベントループで、
ストリーミングの仕組みをワークショップ内で最もわかりやすく確認できる箇所です。
`session.on` で購読し、`assistant.message_delta` の各チャンクを到着と同時に標準出力へ書き出します。
`tool.execution_start` イベントごとに `[tool:start]`、`tool.execution_complete` イベントごとに
`[tool:done]` の行を出力し、`session.idle` で Promise を解決、`session.error` で
拒否します。どちらも届かない場合は `setTimeout` が拒否し、`finish` がすべての
終了経路で購読を解除します。
:::

:::language python
`main.py` の内容全体を置き換えます。

```python
import asyncio

from copilot import CopilotClient, PermissionHandler

from curator import stream_exhibit


async def main() -> None:
    print("=== Museum Exhibit Studio ===")
    print()

    async with CopilotClient() as client:
        async with await client.create_session(
            client_name="museum-exhibit-studio",
            on_permission_request=PermissionHandler.approve_all,
            streaming=True,
        ) as session:
            await stream_exhibit(
                session,
                "Write two sentences of museum wall text about the Apollo 11 Moon landing.",
            )


if __name__ == "__main__":
    asyncio.run(main())
```

ステップ 1 のイベントリスナー全体が 1 回の呼び出しになります。`stream_exhibit` は
`curator.py` にあり、`AssistantMessageDeltaData`、`SessionErrorData`、
`SessionIdleData` の照合処理も実装済みです。編集しません。

**内部を確認:** `curator.py` を開き、`stream_exhibit` を一度読んでください。これは SDK のイベントループで、
ストリーミングの仕組みをワークショップ内で最もわかりやすく確認できる箇所です。
`session.on` で購読し、`AssistantMessageDeltaData` の各チャンクを到着と同時に出力します。
`ToolExecutionStartData` ごとに `[tool:start]`、`ToolExecutionCompleteData` ごとに
`[tool:done]` の行を出力し、`SessionIdleData` で `done` イベントを設定します。
`SessionErrorData` は `RuntimeError` として再送出します。`asyncio.wait_for` がタイムアウトを適用し、
`finally` ブロックがすべての終了経路で購読を解除します。
:::

:::language go
`main.go` の内容全体を置き換えます。

```go
package main

import (
	"context"
	"fmt"

	copilot "github.com/github/copilot-sdk/go"
)

func main() {
	fmt.Println("=== Museum Exhibit Studio ===")
	fmt.Println()

	ctx := context.Background()
	client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
	if err := client.Start(ctx); err != nil {
		panic(err)
	}
	defer func() { _ = client.Stop() }()

	session, err := client.CreateSession(ctx, &copilot.SessionConfig{
		ClientName:          "museum-exhibit-studio",
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
		Streaming:           copilot.Bool(true),
	})
	if err != nil {
		panic(err)
	}
	defer func() { _ = session.Disconnect() }()

	if _, err := StreamExhibit(
		session,
		"Write two sentences of museum wall text about the Apollo 11 Moon landing.",
		GenerationTimeout,
	); err != nil {
		panic(err)
	}
}
```

変更は 2 つです。セッション設定に `Streaming: copilot.Bool(true)` を指定し、`SendAndWait` の代わりに
`StreamExhibit` を使います。ステップ 1 の権限ハンドラーはそのまま残します。`StreamExhibit` と
`GenerationTimeout` は同じパッケージの `curator.go` にあり、このファイルは編集しません。

**内部を確認:** `curator.go` を開き、`StreamExhibit` を一度読んでください。これは SDK のイベントループで、
ストリーミングの仕組みをワークショップ内で最もわかりやすく確認できる箇所です。
`session.On` で購読し、`AssistantMessageDeltaData` の各チャンクを到着と同時に出力します。
`ToolExecutionStartData` ごとに `[tool:start]`、`ToolExecutionCompleteData` ごとに
`[tool:done]` の行を出力し、`SessionErrorData` があれば記録してエラーとして返します。その後、
指定したタイムアウトから作成した `context.WithTimeout` 内で `session.SendAndWait` を待機し、
遅延実行される `unsubscribe` がすべての終了経路で動作します。
:::

:::language rust
`src/main.rs` の内容全体を置き換えます。

```rust
use github_copilot_sdk::permission;
use github_copilot_sdk::types::SessionConfig;
use github_copilot_sdk::{Client, ClientOptions};
use museum_exhibit_studio::{GENERATION_TIMEOUT, RuntimeError, stream_exhibit};

#[tokio::main]
async fn main() -> Result<(), RuntimeError> {
    println!("=== Museum Exhibit Studio ===");
    println!();

    let client = Client::start(ClientOptions::default()).await?;
    let mut config = SessionConfig::default().with_permission_handler(permission::approve_all());
    config.client_name = Some("museum-exhibit-studio".to_owned());
    config.streaming = Some(true);
    let session = client.create_session(config).await?;

    stream_exhibit(
        &session,
        "Write two sentences of museum wall text about the Apollo 11 Moon landing.",
        GENERATION_TIMEOUT,
    )
    .await?;

    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```

変更は 2 つです。`config.streaming = Some(true)` を指定し、`send_and_wait` の代わりに `stream_exhibit` を使います。
ステップ 1 の権限ハンドラーはそのまま残します。`stream_exhibit` と
`GENERATION_TIMEOUT` はどちらも `src/lib.rs` の `museum_exhibit_studio` クレートにあり、
編集しません。

**内部を確認:** `src/lib.rs` を開き、`stream_exhibit` を一度読んでください。これは SDK のイベントループで、
ストリーミングの仕組みをワークショップ内で最もわかりやすく確認できる箇所です。
`session.subscribe` で購読し、`assistant.message_delta` の各チャンクを到着と同時に出力してフラッシュします。
`tool.execution_start` イベントごとに `[tool:start]`、`tool.execution_complete` イベントごとに
`[tool:done]` の行を出力し、`session.idle` で終了、`session.error` で
エラーを返します。送信の Future、イベントストリーム、期限をまとめてポーリングするため、
イベントがまったく届かなくても、指定したタイムアウトが機能します。
:::

:::language java
`src/main/java/workshop/MuseumExhibitStudio.java` の内容全体を置き換えます。

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.PermissionHandler;
import com.github.copilot.rpc.SessionConfig;

public final class MuseumExhibitStudio {
    private MuseumExhibitStudio() {
    }

    public static void main(String[] args) throws Exception {
        System.out.println("=== Museum Exhibit Studio ===");
        System.out.println();

        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(new SessionConfig()
                    .setClientName("museum-exhibit-studio")
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setStreaming(true)).get();
            try {
                CuratorStreamer.streamExhibit(session,
                        "Write two sentences of museum wall text about the Apollo 11 Moon landing.");
            } finally {
                session.close();
                client.stop().get();
            }
        }
    }
}
```

変更は 2 つです。セッション設定に `setStreaming(true)` を指定し、`sendAndWait` の代わりに
`CuratorStreamer.streamExhibit` を使います。ステップ 1 の権限ハンドラーはそのまま残します。ヘルパーは
編集中のファイルの隣にある `CuratorStreamer.java` にあり、編集しません。

**内部を確認:** `CuratorStreamer.java` を開き、`streamExhibit` を一度読んでください。これは SDK の
イベントループで、ストリーミングの仕組みをワークショップ内で最もわかりやすく確認できる箇所です。
イベントの型ごとにリスナーを登録します。`AssistantMessageDeltaEvent` で到着したチャンクを出力・蓄積し、
`ToolExecutionStartEvent` と `ToolExecutionCompleteEvent` で
`[tool:start]` と `[tool:done]` の行を出力します。`SessionIdleEvent` では改行し、`SessionErrorEvent` は
捕捉して再送出します。指定したタイムアウトはミリ秒単位で `session.sendAndWait` に渡され、
すべての購読は `finally` ブロックで閉じられます。
:::

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
.venv/bin/python main.py
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

同じような応答ですが、今回は書かれていく様子を確認できます。

```text
=== Museum Exhibit Studio ===

In July 1969, three astronauts left Earth aboard Apollo 11... 
```

テキストは一度に表示されず、少しずつ続きが追加され、最後の単語が表示されて間もなく
プログラムが終了します。最後まで何も表示されない場合、セッションはストリーミングしていません。
セッション設定にストリーミングフラグを指定したか確認してください。

## 理解度を確認する

- ストリーミングは、概念的にはセッション設定とイベントを読み取るコードの 2 か所で有効にします。
  自分で書いたのはどちらで、ヘルパーにすでに用意されていたのはどちらですか?
- ヘルパーは応答を出力するだけでなく、その全文も返します。この戻り値が
  ステップ 6 で重要になるのはなぜでしょうか?
- モデルがいつまでもアイドル状態にならない場合、プログラムが無限に待機するのを何が防ぎますか?

## さらに学ぶ

- [方向修正とキューイング](https://github.com/github/copilot-sdk/blob/main/docs/features/steering-and-queueing.md):
  ターンの終了を待たず、ストリーミング中に別のメッセージを送信する方法です。
- [使用量と課金の指標](https://github.com/github/copilot-sdk/blob/main/docs/features/usage-and-billing.md):
  出力機能がすでに購読しているイベントから、トークン数やコストを読み取る方法です。
- [コンテキストのクリア](https://github.com/github/copilot-sdk/blob/main/docs/features/context-management.md):
  継続して使いたいセッション内で、会話を置き換える方法です。

次は[キュレーターの文体を設定する](museum-03-curator-voice.md)に進みます。
