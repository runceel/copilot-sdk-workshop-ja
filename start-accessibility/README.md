# ワークショップスターター

ワークショップのホームページで選択した言語のディレクトリを選び、その中で直接作業してください。コピー手順は
ありません。そのディレクトリに移動し、エディターで同じフォルダーを開き（その中から `code .` を実行するか、
他のエディターのフォルダーを開くコマンドを使用します）、すべてのコマンドをそこで実行し続けてください。
スターターは意図的に最小限の足場です。アプリケーションが所有する Web Content Accessibility
Guidelines (WCAG) カタログと、スコープ化されたパーミッション/スナップショットリーダーのヘルパーは、
後のレッスンのために存在している場合がありますが、その実行可能なエントリポイントは、対応するステップまで
Copilot クライアント、セッション、ストリーミングフロー、ローカルツール、MCP サーバー、レポートを配線しません。

| 言語 | 前提条件 | ディレクトリを変更して確認 |
|---|---|---|
| .NET | [.NET 10 SDK](https://learn.microsoft.com/dotnet/core/install/) | `cd start-accessibility/dotnet && dotnet build` |
| Node.js | [Node.js 22+](https://nodejs.org/) | `cd start-accessibility/nodejs && npm install && npm run build` |
| Python | [Python 3.11+](https://www.python.org/downloads/) | `cd start-accessibility/python && python -m pip install -r requirements.txt && python -m py_compile *.py` |
| Go | [Go 1.24+](https://go.dev/dl/) | `cd start-accessibility/go && go build -mod=readonly ./...` |
| Rust | [Rust 1.94+](https://rustup.rs/) | `cd start-accessibility/rust && cargo check --locked` |
| Java | [Java 17+](https://adoptium.net/) と [Maven](https://maven.apache.org/install.html) | `cd start-accessibility/java && mvn compile` |

これらのファイルをその場で編集するため、作業内容は `git status` に表示されます。それは想定どおりです。
きれいなスターターに復元するには、リポジトリのルートから `git checkout -- .` を実行します。Go、Rust、Java の
トラックでは、後でアプリケーションを実行する際に
[GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) が
`PATH` 上にあることが必要です。SDK のセットアップと API リファレンスは、
[公式 Copilot SDK リポジトリ](https://github.com/github/copilot-sdk)と
[クックブック](https://github.com/github/copilot-sdk/tree/main/cookbook)で入手できます。

ワークショップ全体を通じて、スターターディレクトリにとどまってください。インタラクティブビューアーには
[ワークショップのホームページ](../README.md#start-the-workshop)から戻ってください。レッスンの Markdown を
直接開かないでください。
