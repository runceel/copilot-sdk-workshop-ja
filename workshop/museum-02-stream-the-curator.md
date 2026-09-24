# ステップ 2: キュレーターをストリーミングする

> **所要時間:** 10 分

## 作るもの

同じプロンプトですが、答えが沈黙の間を置いてからまとめて返ってくるのではなく、単語ごとに表示されます。

イベントループを書く必要はありません。スターターには、事前に作り込まれたキュレーターのヘルパーとしてストリーミング用のプリンターがすでに含まれています。これは
[セッションイベント](https://github.com/github/copilot-sdk/blob/main/docs/features/streaming-events.md)
を購読し、各デルタを標準出力に書き込み、ツールの動作をレポートし、セッションエラー時には失敗し、タイムアウトを適用し、あらゆる経路で購読を解除し、蓄積したテキスト全体を返します。あなたの仕事は、ストリーミングを有効にして、それを呼び出すことです。

## キュレーターにとってストリーミングが重要な理由

展示のコピーは、人間が読んで判断する必要のある文章です。それが表示されていく様子を見ることで、トーンが適切かどうか、モデルが冗長になっていないか、主題からそれていないかを、実行が終わるずっと前に即座に把握できます。また、ストリーミングはツール呼び出しに気づく場所も提供してくれます。これはステップ 4 以降で重要になります。そこではキュレーターが何かを書く前に、アプリケーションのファクトツールを呼び出さなければならないからです。

ヘルパーはレスポンス全体を文字列として返すため、ここから先はストリーム終了後に完成したテキストをいつでも確認できます。

## ブロッキング呼び出しをストリーマーに置き換える

:::language dotnet
`Program.cs` の内容全体を置き換えます:

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

変更点は 2 つです。セッション設定の `Streaming = true` と、`SendAndWaitAsync` の代わりの
`CuratorStreamer.StreamExhibitAsync` です。ステップ 1 のパーミッションハンドラーは、まったく同じ位置に残ります。ヘルパーは
`Helpers/CuratorStreamer.cs` にあり、編集することはありません。

**中を見てみましょう:** `Helpers/CuratorStreamer.cs` を開いて、`StreamExhibitAsync` を一度読んでみてください。これは
SDK のイベントループであり、ストリーミングが実際にどう動くかを見るうえで、このワークショップで最も分かりやすい場所です。
これは `session.On<SessionEvent>` で購読し、各 `AssistantMessageDeltaEvent` のチャンクが届いた瞬間に追加して書き出し、
すべての `ToolExecutionStartEvent` に対して `[tool:start]` 行を、すべての `ToolExecutionCompleteEvent` に対して
`[tool:done]` 行を出力し、`SessionIdleEvent` で完了し、`SessionErrorEvent` で失敗します。`Task.Delay` の競合により
タイムアウトが `TimeoutException` になり、購読はあらゆる経路で破棄されます。
:::

:::language nodejs
`src/index.ts` の内容全体を置き換えます:

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

変更点は 2 つです。セッション設定の `streaming: true` と、`sendAndWait` の代わりの `streamExhibit` です。
ステップ 1 のパーミッションハンドラーは、まったく同じ位置に残ります。ヘルパーは
`src/curator.ts` にあり、編集することはありません。

**中を見てみましょう:** `src/curator.ts` を開いて、`streamExhibit` を一度読んでみてください。これは SDK のイベントループであり、
ストリーミングが実際にどう動くかを見るうえで、このワークショップで最も分かりやすい場所です。これは
`session.on` で購読し、各 `assistant.message_delta` のチャンクが届いた瞬間に標準出力へ書き込み、
すべての `tool.execution_start` イベントに対して `[tool:start]` 行を、すべての `tool.execution_complete` イベントに対して
`[tool:done]` 行を出力し、`session.idle` で Promise を解決し、`session.error` で拒否します。`setTimeout` は
どちらも届かない場合に拒否し、`finish` があらゆる経路で購読を解除します。
:::

:::language python
`main.py` の内容全体を置き換えます:

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

ステップ 1 のイベントリスナー全体が 1 回の呼び出しにまとまります。`stream_exhibit` は
`curator.py` にあり、すでに `AssistantMessageDeltaData`、`SessionErrorData`、`SessionIdleData` に対するマッチングを行っており、
編集することはありません。

**中を見てみましょう:** `curator.py` を開いて、`stream_exhibit` を一度読んでみてください。これは SDK のイベントループであり、
ストリーミングが実際にどう動くかを見るうえで、このワークショップで最も分かりやすい場所です。これは
`session.on` で購読し、各 `AssistantMessageDeltaData` のチャンクが届いた瞬間に出力し、
すべての `ToolExecutionStartData` に対して `[tool:start]` 行を、すべての `ToolExecutionCompleteData` に対して
`[tool:done]` 行を出力し、`SessionIdleData` で `done` イベントをセットし、`SessionErrorData` を
`RuntimeError` として再送出します。`asyncio.wait_for` がタイムアウトを適用し、`finally`
ブロックがあらゆる経路で購読を解除します。
:::

:::language go
`main.go` の内容全体を置き換えます:

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

変更点は 2 つです。セッション設定の `Streaming: copilot.Bool(true)` と、`SendAndWait` の代わりの `StreamExhibit` です。
ステップ 1 のパーミッションハンドラーは、まったく同じ位置に残ります。`StreamExhibit` と
`GenerationTimeout` は、同じパッケージの `curator.go` にあり、そのファイルを編集することはありません。

**中を見てみましょう:** `curator.go` を開いて、`StreamExhibit` を一度読んでみてください。これは SDK のイベントループであり、
ストリーミングが実際にどう動くかを見るうえで、このワークショップで最も分かりやすい場所です。これは
`session.On` で購読し、各 `AssistantMessageDeltaData` のチャンクが届いた瞬間に出力し、
すべての `ToolExecutionStartData` に対して `[tool:start]` 行を、すべての `ToolExecutionCompleteData` に対して
`[tool:done]` 行を出力し、`SessionErrorData` を記録してエラーとして返します。その後、渡したタイムアウトから作成した
`context.WithTimeout` の中で `session.SendAndWait` を待ち、
遅延実行される `unsubscribe` があらゆる経路で実行されます。
:::

:::language rust
`src/main.rs` の内容全体を置き換えます:

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

変更点は 2 つです。`config.streaming = Some(true)` と、`send_and_wait` の代わりの `stream_exhibit` です。
ステップ 1 のパーミッションハンドラーは、まったく同じ位置に残ります。`stream_exhibit` と
`GENERATION_TIMEOUT` はどちらも `src/lib.rs` の `museum_exhibit_studio` クレートにあり、
編集することはありません。

**中を見てみましょう:** `src/lib.rs` を開いて、`stream_exhibit` を一度読んでみてください。これは SDK のイベントループであり、
ストリーミングが実際にどう動くかを見るうえで、このワークショップで最も分かりやすい場所です。これは
`session.subscribe` で購読し、各 `assistant.message_delta` のチャンクが届いた瞬間に出力してフラッシュし、
すべての `tool.execution_start` イベントに対して `[tool:start]` 行を、すべての
`tool.execution_complete` イベントに対して `[tool:done]` 行を出力し、`session.idle` で完了し、`session.error` では
エラーを返します。送信の future、イベントストリーム、デッドラインを同時にポーリングするため、たとえイベントが
まったく届かなくても、渡したタイムアウトが有効です。
:::

:::language java
`src/main/java/workshop/MuseumExhibitStudio.java` の内容全体を置き換えます:

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

変更点は 2 つです。セッション設定の `setStreaming(true)` と、`sendAndWait` の代わりの `CuratorStreamer.streamExhibit` です。
ステップ 1 のパーミッションハンドラーは、まったく同じ位置に残ります。ヘルパーは
あなたのファイルの隣にある `CuratorStreamer.java` にあり、編集することはありません。

**中を見てみましょう:** `CuratorStreamer.java` を開いて、`streamExhibit` を一度読んでみてください。これは SDK のイベント
ループであり、ストリーミングが実際にどう動くかを見るうえで、このワークショップで最も分かりやすい場所です。これは
イベントの種類ごとに 1 つのリスナーを登録します。`AssistantMessageDeltaEvent` は各チャンクが届くたびに出力して蓄積し、
`ToolExecutionStartEvent` と `ToolExecutionCompleteEvent` は
`[tool:start]` 行と `[tool:done]` 行を出力し、`SessionIdleEvent` は行を終了させ、`SessionErrorEvent` は
捕捉されて再送出されます。渡したタイムアウトはミリ秒単位で `session.sendAndWait` に渡され、
すべての購読は `finally` ブロックでクローズされます。
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

同じような答えが表示されますが、今回はそれが書き込まれていく様子を見ることができます:

```text
=== Museum Exhibit Studio ===

In July 1969, three astronauts left Earth aboard Apollo 11... 
```

テキストは一度にまとめて現れるのではなく、その場で伸びていき、最後の単語の直後にプログラムが終了します。
最後の最後まで何も表示されない場合、セッションはストリーミングになっていません。セッション設定で
ストリーミングフラグを設定したか確認してください。

## 理解度チェック

- ストリーミングは概念的に 2 か所で有効になります。セッション設定と、イベントを読み取るコードです。
  あなたが書いたのはどちらで、ヘルパーがすでに担っていたのはどちらでしょうか?
- ヘルパーはレスポンステキストを出力もしていますが、その全体を返しもします。その戻り値がステップ 6 で
  重要になるのはなぜでしょうか?
- モデルが決してアイドルにならない場合、何があなたのプログラムが永遠に待ち続けるのを防ぐのでしょうか?

## さらに学ぶ

- [Steering and queueing](https://github.com/github/copilot-sdk/blob/main/docs/features/steering-and-queueing.md):
  ターンがまだストリーミングされている最中に、その完了を待たずに別のメッセージを送信します。
- [Usage and billing metrics](https://github.com/github/copilot-sdk/blob/main/docs/features/usage-and-billing.md):
  プリンターがすでに購読しているのと同じイベントから、トークン数とコストを読み取ります。
- [Context clearing](https://github.com/github/copilot-sdk/blob/main/docs/features/context-management.md):
  使い続けたいセッションの中で、会話を入れ替えます。

[キュレーターに声を与える](museum-03-curator-voice.md)へ進みましょう。
