# Museum Exhibit Studio スターター

ワークショップの言語のディレクトリを選び、その中で直接作業してください。その中に移動したら、同じフォルダーを
エディターで開き（その中から `code .` を実行するか、他のエディターのフォルダーを開くコマンドを使用します）、
ターミナルをそこに保ってください。これらのスターターには、固定された依存関係、最小限の実行可能ファイル、そして
1 つの事前ビルド済みキュレーターヘルパーモジュールが含まれています。ヘルパーは、あなたが書く必要のない配管を
保持しています。承認済みファクトセットとその境界、それらのファクトをキュレーターに渡す事前ビルド済みの
`approved_fact_lookup` ローカルツール、ストリーミングプリンター、決定的な展示検証、スコープ化された
Wikipedia MCP サーバーと、その拒否をデフォルトとするパーミッションハンドラー、単一ファイル `exhibit.html` の
書き込みパーミッション、そして小さなターミナルプロンプトです。ヘルパーを編集することは決してありません。

スターターには、キュレーターのシステムメッセージ、展示プロンプト、セッション構成、ツール登録、
オーケストレーションは **含まれていません**。それらはレッスン中に書きます。1 つのセッション、次にストリーミング、
次にキュレーターの語り口、ファクトツールの登録とそのプロンプト、ガードレールを所有する 1 つのセッションランナー、
検証レポート、スコープ化された Wikipedia リサーチ、そして任意の `exhibit.html` ページです。各スターターの
エントリポイントには、各ステップのコードがどこに入るかを正確に示すコメントが付いています。
[`workshop/museum-00-preflight.md`](../workshop/museum-00-preflight.md) から始めてください。

| 言語 | ヘルパーモジュール | ディレクトリを変更してビルドし、実行する |
|---|---|---|
| .NET | `Helpers/Curator*.cs` | `cd start-museum/dotnet && dotnet build && dotnet run` |
| Node.js | `src/curator.ts` | `cd start-museum/nodejs && npm ci && npm run build && npm start` |
| Python | `curator.py` | `cd start-museum/python && python -m venv .venv && .venv/bin/python -m pip install -r requirements.txt && .venv/bin/python main.py` |
| Go | `curator.go` | `cd start-museum/go && go build -mod=readonly ./... && go run .` |
| Rust | `src/lib.rs` | `cd start-museum/rust && cargo check --locked && cargo run --locked` |
| Java | `src/main/java/workshop/Curator*.java` | `cd start-museum/java && mvn compile && mvn exec:java` |

スターターを実行すると、その識別情報が出力され、Copilot は起動せず、認証も必要としません。
これらのファイルをその場で編集するため、作業内容は `git status` に表示されます。それは想定どおりです。
きれいなスターターに復元するには、リポジトリのルートから `git checkout -- .` を実行します。

すべてのスターターは、完成したアプリケーションが必要とする依存関係をすでに固定しているため、ワークショップ中に
プロジェクトのマニフェストを編集することは決してありません。Rust スターターは、`src/lib.rs` から
`museum_exhibit_studio` ライブラリクレートをビルドします。`src/main.rs` の中でそこからヘルパーを
インポートしてください。
