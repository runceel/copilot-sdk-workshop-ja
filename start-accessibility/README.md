# ワークショップのスターター

ワークショップのホームページで選んだ言語のディレクトリを選び、その中で直接作業します。
コピーは不要です。そのディレクトリに移動し、同じフォルダーをエディターで開いてください（その中で `code .`
を実行するか、ほかのエディターのフォルダーを開くコマンドを使います）。以降のコマンドもすべてそこで実行します。
スターターは意図的に最小限のひな形にしています。後のレッスンで使う、アプリケーションが管理する
Web Content Accessibility Guidelines（WCAG）のカタログや、権限の範囲を限定するヘルパー、
スナップショット読み取り用のヘルパーが含まれている場合があります。ただし、実行用のエントリーポイントには、
対応するステップに進むまで、Copilot クライアント、セッション、ストリーミング処理、
ローカルツール、MCP サーバー、レポートは組み込まれていません。

| 言語 | 前提条件 | ディレクトリへの移動と確認 |
|---|---|---|
| .NET | [.NET 10 SDK](https://learn.microsoft.com/dotnet/core/install/) | `cd start-accessibility/dotnet && dotnet build` |
| Node.js | [Node.js 22 以降](https://nodejs.org/) | `cd start-accessibility/nodejs && npm install && npm run build` |
| Python | [Python 3.11 以降](https://www.python.org/downloads/) | `cd start-accessibility/python && python -m pip install -r requirements.txt && python -m py_compile *.py` |
| Go | [Go 1.24 以降](https://go.dev/dl/) | `cd start-accessibility/go && go build -mod=readonly ./...` |
| Rust | [Rust 1.94 以降](https://rustup.rs/) | `cd start-accessibility/rust && cargo check --locked` |
| Java | [Java 17 以降](https://adoptium.net/) と [Maven](https://maven.apache.org/install.html) | `cd start-accessibility/java && mvn compile` |

これらのファイルを直接編集するため、変更が `git status` に表示されます。これは想定どおりです。
スターターを初期状態に戻すには、リポジトリのルートで `git checkout -- .` を実行します。Go、Rust、Java の
トラックでは、後でアプリケーションを実行する際に、
[GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) が
`PATH` に含まれている必要があります。SDK のセットアップ手順と API リファレンスは、
[Copilot SDK 公式リポジトリ](https://github.com/github/copilot-sdk)と
[クックブック](https://github.com/github/copilot-sdk/tree/main/cookbook)を参照してください。

ワークショップ中はスターターのディレクトリで作業を続けてください。対話型ビューアーには
[ワークショップのホームページ](../README.md#start-the-workshop)から戻ります。レッスンの Markdown を直接開かないでください。
