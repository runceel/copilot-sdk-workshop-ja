# ステップ 1: 最初のキュレーターセッション

> **所要時間:** 10 分

## 作るもの

本物の博物館向け文章を、ターミナル上で、およそ 10 分で作成します。Copilot ランタイムに接続し、
1 つの会話を開き、単一のプロンプトを送信して、返ってきた内容を表示します。

システムメッセージなし。ファクトカタログなし。ツールなし。インターフェースなし。実装対象は何もありません
— SDK を直接呼び出すだけで、ビルド済みのキュレーターヘルパーはステップ 2 で必要になるまでそのまま残しておきます。

## クライアントとセッションを知る

[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)
はプロンプトを受け取り、モデルを呼び出し、ツールを管理します。**クライアント**は、あなたのアプリケーションを
そのランタイムに接続します。**セッション**は 1 つの継続する会話です。コンテキストを構成するメッセージや
ツールの結果を保持します。

1 つのまとまった作業のあいだは 1 つのクライアントを生かし続け、独立した会話ごとにセッションを作成します。
現時点でのアプリケーションは、単純に `client -> session -> printed response` です。

## 送信する前にパーミッションリクエストに応答する

ランタイムは、ツール呼び出しを実行してよいかどうかを自分だけで判断しません。アプリケーションに問い合わせ、
それに応答するのがセッションの[パーミッションハンドラー](https://github.com/github/copilot-sdk/blob/main/docs/hooks/pre-tool-use.md)です。
パーミッションハンドラーなしでセッションが作成された場合、リクエストは拒否されるわけではなく — イベントとして
発行され、手動で解決されるまで保留のままになります。そのため実行が停止し、決して届かない応答を待ち続けます。

この最初のセッションには approve-all ハンドラーを与え、すべてのリクエストに応答があるようにします。これは
managed settings が無効な場合にリクエストを承認するもので、安全対策というよりもデフォルトです。このセッションを
実際に制約するものはステップ 5 で示し、ステップ 7 と 8 では、これを狭くスコープを限定したハンドラーに置き換えます。

## セッションを書く

:::language dotnet
`Program.cs` を開き、**ファイル全体を置き換えます**:

```csharp
using GitHub.Copilot;
using GitHub.Copilot.Rpc;

Console.WriteLine("=== Museum Exhibit Studio ===");
Console.WriteLine();

await using var client = new CopilotClient();
await client.StartAsync();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    ClientName = "museum-exhibit-studio",
    OnPermissionRequest = PermissionHandler.ApproveAll
});

var response = await session.SendAndWaitAsync(
    "Write two sentences of museum wall text about the Apollo 11 Moon landing.");

if (response is null)
{
    throw new InvalidOperationException("The curator returned no content.");
}

Console.WriteLine(response.Data.Content);

await client.StopAsync();
```

`SendAndWaitAsync` はセッションがアイドルになるまでブロックするため、完成した回答を 1 回の呼び出しで得られます。
`await using` は処理を抜けるときにセッションとクライアントを破棄します。`PermissionHandler.ApproveAll` は
`GitHub.Copilot.Rpc` に由来しており、2 つ目の `using` があるのはそのためです。

ステップ 2 で呼び出し始めるビルド済みのヘルパーは、`Helpers/CuratorFacts.cs`、
`Helpers/CuratorStreamer.cs`、`Helpers/CuratorValidation.cs`、`Helpers/CuratorSafety.cs`、
`Helpers/CuratorTerminal.cs` にあります。これらのファイルは編集せず、読むだけです。
:::

:::language nodejs
`src/index.ts` を開き、**ファイル全体を置き換えます**:

```typescript
import { approveAll, CopilotClient } from "@github/copilot-sdk";

async function main(): Promise<void> {
  console.log("=== Museum Exhibit Studio ===");
  console.log();

  const client = new CopilotClient();
  await client.start();
  const session = await client.createSession({
    clientName: "museum-exhibit-studio",
    onPermissionRequest: approveAll,
  });

  const response = await session.sendAndWait({
    prompt: "Write two sentences of museum wall text about the Apollo 11 Moon landing.",
  });
  console.log(response?.data && "content" in response.data ? response.data.content : response);

  await session.disconnect();
  await client.stop();
}

void main();
```

`sendAndWait` はセッションがアイドルになるまでブロックするため、完成した回答を 1 回の呼び出しで得られます。
`approveAll` は `CopilotClient` とともに SDK からインポートされます。

このファイルの隣にある `src/curator.ts` は、ステップ 2 で呼び出し始めるビルド済みのヘルパーモジュールです。
このファイルは編集せず、読むだけです。
:::

:::language python
`main.py` を開き、**ファイル全体を置き換えます**:

```python
import asyncio

from copilot import CopilotClient, PermissionHandler
from copilot.session_events import AssistantMessageData, SessionErrorData, SessionIdleData


async def main() -> None:
    print("=== Museum Exhibit Studio ===")
    print()

    async with CopilotClient() as client:
        async with await client.create_session(
            client_name="museum-exhibit-studio",
            on_permission_request=PermissionHandler.approve_all,
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
            await session.send(
                "Write two sentences of museum wall text about the Apollo 11 Moon landing."
            )
            await done.wait()
            if error is not None:
                raise error


if __name__ == "__main__":
    asyncio.run(main())
```

Python は 1 つのブロッキングヘルパーを呼び出すのではなく、セッションイベントをリッスンします。アシスタントの
メッセージを表示し、セッションエラーを失敗として扱い、終了する前にアイドルを待ちます。ステップ 2 では、この
リスナー全体を 1 回のヘルパー呼び出しに置き換えます。

このファイルの隣にある `curator.py` は、その置き換えを担うビルド済みのヘルパーモジュールです。このファイルは
編集せず、読むだけです。
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
	})
	if err != nil {
		panic(err)
	}
	defer func() { _ = session.Disconnect() }()

	response, err := session.SendAndWait(ctx, copilot.MessageOptions{
		Prompt: "Write two sentences of museum wall text about the Apollo 11 Moon landing.",
	})
	if err != nil {
		panic(err)
	}
	if response == nil {
		panic("The curator returned no content.")
	}
	if message, ok := response.Data.(*copilot.AssistantMessageData); ok {
		fmt.Println(message.Content)
	}
}
```

`curator.go` はすでにこの同じ `main` パッケージにあるため、そのヘルパーは必要になった瞬間にスコープ内に
あります。`SendAndWait` はセッションがアイドルになるまでブロックします。
:::

:::language rust
`src/main.rs` を開き、**ファイル全体を置き換えます**:

```rust
use github_copilot_sdk::permission;
use github_copilot_sdk::types::{MessageOptions, SessionConfig};
use github_copilot_sdk::{Client, ClientOptions};
use museum_exhibit_studio::RuntimeError;

#[tokio::main]
async fn main() -> Result<(), RuntimeError> {
    println!("=== Museum Exhibit Studio ===");
    println!();

    let client = Client::start(ClientOptions::default()).await?;
    let mut config = SessionConfig::default().with_permission_handler(permission::approve_all());
    config.client_name = Some("museum-exhibit-studio".to_owned());
    let session = client.create_session(config).await?;

    let response = session
        .send_and_wait(MessageOptions::new(
            "Write two sentences of museum wall text about the Apollo 11 Moon landing.",
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

`src/lib.rs` は、ビルド済みのヘルパーを提供する `museum_exhibit_studio` ライブラリクレートであり、編集は
しません。今日ここからインポートする名前は 1 つだけです。`RuntimeError` は、クレートが
`Box<dyn Error + Send + Sync>` に付けたエイリアスです。ステップ 2 以降で呼び出すすべてのヘルパーは、この型で
失敗を報告します。そのため `main` は最初からこの型を返し、レッスンが進んでも `?` が機能し続けます。

`with_permission_handler` は更新後の config を返すので、返された値に対して残りのフィールドを設定してください。
:::

:::language java
`src/main/java/workshop/MuseumExhibitStudio.java` を開き、**ファイル全体を置き換えます**:

```java
package workshop;

import com.github.copilot.CopilotClient;
import com.github.copilot.rpc.MessageOptions;
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
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)).get();
            try {
                var response = session.sendAndWait(new MessageOptions().setPrompt(
                        "Write two sentences of museum wall text about the Apollo 11 Moon landing.")).get();
                if (response == null) {
                    throw new IllegalStateException("The curator returned no content.");
                }
                System.out.println(response.getData().content());
            } finally {
                session.close();
                client.stop().get();
            }
        }
    }
}
```

`sendAndWait` はセッションがアイドルになるまでブロックします。try-with-resources ブロックは、`main` が終了
するときにクライアントをクローズします。`PermissionHandler.APPROVE_ALL` は `com.github.copilot.rpc` に由来します。

ステップ 2 で呼び出し始めるビルド済みのヘルパーは、あなたのファイルの隣、`src/main/java/workshop/` にあります。
`CuratorFacts.java`、`CuratorStreamer.java`、`CuratorValidation.java`、`CuratorSafety.java`、
`CuratorTerminal.java` です。これらのファイルは編集せず、読むだけです。
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

お使いの環境で実際に出力される文言は異なりますが、出力はこのような形になります:

```text
=== Museum Exhibit Studio ===

The Apollo 11 mission carried three astronauts toward the Moon in July 1969. Days later,
two of them stepped onto its surface while the world listened.
```

短い待機の後に、博物館らしい 2 文が届きます。まだ何もストリーミングされず、トーンも強制されておらず、
尋ねた主題を超えてモデルが手を伸ばすのを止めるものもありません。それらが次の 3 つのステップです。

## 理解度チェック

- クライアントが保持していないもので、セッションが保持しているものは何でしょうか?
- 応答は待機の後に一度にまとめて届きました。現在のコードのどの部分がそうさせているのでしょうか?
- セッションはすべてのパーミッションリクエストを保留にせず応答しました。それはセッションをより安全に
  したのでしょうか、それとも単に完了できるようにしただけでしょうか?
- このステップには、モデルが Apollo 11 について主張できる内容を制限するものが何もありません。今この回答を
  おおむね主題に沿わせている唯一のものは何でしょうか?

## さらに学ぶ

- [Build your first Copilot-powered app](https://docs.github.com/en/copilot/how-tos/copilot-sdk/getting-started):
  同じ最初のクライアント、セッション、プロンプトを扱う GitHub のチュートリアルです。
- [Session resume and persistence](https://github.com/github/copilot-sdk/blob/main/docs/features/session-persistence.md):
  セッションが何を保持し、後で会話をどのように再開するか。
- [Authentication](https://github.com/github/copilot-sdk/blob/main/docs/auth/README.md):
  `copilot login` の先へ進んだときにクライアントが使用できる認証情報。

[Stream the curator](museum-02-stream-the-curator.md) に進みます。
