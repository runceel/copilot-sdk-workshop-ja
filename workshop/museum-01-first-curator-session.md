# ステップ 1: 最初のキュレーターセッション

> **所要時間:** 10 分

## 作成するもの

約 10 分で、実際の展示文をターミナルに表示します。Copilot ランタイムに接続して
会話を 1 つ開始し、プロンプトを 1 つ送信して、その応答を出力します。

システムメッセージも、事実カタログも、ツールも、インターフェイスもありません。何かの仕様に合わせて実装する必要はなく、
SDK を直接呼び出します。用意済みのキュレーターヘルパーは、ステップ 2 で必要になるまで使いません。

## クライアントとセッションを知る

[**Copilot ランタイム**](https://github.com/github/copilot-sdk/blob/main/docs/features/agent-loop.md)は、
プロンプトを受け取り、モデルを呼び出し、ツールを管理します。**クライアント**はアプリケーションと
ランタイムを接続します。**セッション**は継続する 1 つの会話であり、コンテキストを構成する
メッセージやツールの結果を保持します。

一連の作業中は 1 つのクライアントを維持し、独立した会話ごとにセッションを作成します。
現時点のアプリケーションは、単純に `client -> session -> printed response` という構成です。

## 送信前に権限要求への応答を設定する

ランタイムは、ツール呼び出しを実行してよいかを独断では決めません。アプリケーションに問い合わせ、
セッションの[権限ハンドラー](https://github.com/github/copilot-sdk/blob/main/docs/hooks/pre-tool-use.md)が
応答します。ハンドラーなしでセッションを作成すると、要求は拒否されるのではなく、
イベントとして発行され、手動での解決待ちになります。その結果、実行が止まり、
届くことのない応答を待ち続けます。

最初のセッションには全承認ハンドラーを設定し、すべての要求に応答できるようにします。このハンドラーは
管理対象の設定が無効な場合に要求を承認する、既定の動作であって安全対策ではありません。ステップ 5 では
このセッションを実際に制限する仕組みを学び、ステップ 7 と 8 では対象を狭く限定したハンドラーに置き換えます。

## セッションを記述する

:::language dotnet
`Program.cs` を開き、**ファイル全体を置き換えます**。

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

`SendAndWaitAsync` はセッションがアイドル状態になるまで待機するので、1 回の呼び出しで完成した応答を取得できます。
`await using` は終了時にセッションとクライアントを破棄します。`PermissionHandler.ApproveAll` は
`GitHub.Copilot.Rpc` に含まれるため、2 つ目の `using` が必要です。

ステップ 2 から呼び出す用意済みのヘルパーは、`Helpers/CuratorFacts.cs`、
`Helpers/CuratorStreamer.cs`、`Helpers/CuratorValidation.cs`、`Helpers/CuratorSafety.cs`、
`Helpers/CuratorTerminal.cs` にあります。これらのファイルは読むだけで、編集しません。
:::

:::language nodejs
`src/index.ts` を開き、**ファイル全体を置き換えます**。

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

`sendAndWait` はセッションがアイドル状態になるまで待機するので、1 回の呼び出しで完成した応答を取得できます。
`approveAll` は `CopilotClient` と一緒に SDK からインポートします。

このファイルの隣にある `src/curator.ts` は、ステップ 2 から呼び出す用意済みのヘルパーモジュールです。
読むだけで、編集しません。
:::

:::language python
`main.py` を開き、**ファイル全体を置き換えます**。

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

Python では、待機を伴うヘルパーを 1 回呼び出す代わりに、セッションイベントを監視します。アシスタントの
メッセージを出力し、セッションエラーは失敗として扱い、アイドル状態になってから終了します。ステップ 2 では
このリスナー全体を 1 回のヘルパー呼び出しに置き換えます。

このファイルの隣にある `curator.py` は、その置き換え先を提供する用意済みのヘルパーモジュールです。
読むだけで、編集しません。
:::

:::language go
`main.go` を開き、**ファイル全体を置き換えます**。

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

`curator.go` はすでに同じ `main` パッケージにあるため、必要になればすぐにヘルパーを
利用できます。`SendAndWait` はセッションがアイドル状態になるまで待機します。
:::

:::language rust
`src/main.rs` を開き、**ファイル全体を置き換えます**。

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

`src/lib.rs` は、用意済みのヘルパーを提供する `museum_exhibit_studio` ライブラリクレートで、
編集しません。今回はそこから `RuntimeError` という名前だけをインポートします。これはクレート内での
`Box<dyn Error + Send + Sync>` の別名です。ステップ 2 以降に呼び出すヘルパーはすべてこの型で
失敗を報告するため、最初から `main` の戻り値にしておけば、レッスンが進んでも `?` を使い続けられます。

`with_permission_handler` は更新した設定を返すため、
残りのフィールドはその戻り値に設定してください。
:::

:::language java
`src/main/java/workshop/MuseumExhibitStudio.java` を開き、**ファイル全体を置き換えます**。

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

`sendAndWait` はセッションがアイドル状態になるまで待機します。try-with-resources ブロックは
`main` の終了時にクライアントを閉じます。`PermissionHandler.APPROVE_ALL` は `com.github.copilot.rpc` に含まれます。

ステップ 2 から呼び出す用意済みのヘルパーは、編集中のファイルと同じ
`src/main/java/workshop/` にあります。`CuratorFacts.java`、`CuratorStreamer.java`、`CuratorValidation.java`、
`CuratorSafety.java`、`CuratorTerminal.java` です。これらのファイルは読むだけで、編集しません。
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

具体的な文言は変わりますが、出力は次のような形になります。

```text
=== Museum Exhibit Studio ===

The Apollo 11 mission carried three astronauts toward the Moon in July 1969. Days later,
two of them stepped onto its surface while the world listened.
```

少し待つと、博物館の展示文らしい 2 文が表示されます。まだストリーミングは行われず、口調も
指定されていません。また、質問した主題をモデルが逸脱することも防いでいません。これらを
次の 3 ステップで扱います。

## 理解度を確認する

- クライアントにはなく、セッションが保持しているものは何ですか?
- 少し待った後、応答が一度に表示されました。現在のコードのどの部分がその動作を生んでいますか?
- セッションはすべての権限要求に応答し、保留にしませんでした。これでセッションは安全になったのでしょうか、
  それとも単に最後まで実行できるようになっただけでしょうか?
- このステップでは、アポロ 11 号についてモデルが何を述べるかを制限していません。今のところ、
  応答をおおむね主題に沿わせている唯一のものは何ですか?

## さらに学ぶ

- [Copilot を活用した最初のアプリを作成する](https://docs.github.com/en/copilot/how-tos/copilot-sdk/getting-started):
  同じように最初のクライアント、セッション、プロンプトを作成する GitHub のチュートリアルです。
- [セッションの再開と永続化](https://github.com/github/copilot-sdk/blob/main/docs/features/session-persistence.md):
  セッションが保持するものと、後で会話を再開する方法を説明しています。
- [認証](https://github.com/github/copilot-sdk/blob/main/docs/auth/README.md):
  `copilot login` 以外に、クライアントで利用できる認証情報を説明しています。

次は[キュレーターの応答をストリーミングする](museum-02-stream-the-curator.md)に進みます。
