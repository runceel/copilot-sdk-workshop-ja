# 博物館展示スタジオのスターター

ワークショップで使う言語のディレクトリを選び、その中で直接作業します。移動したら、
同じフォルダーをエディターで開き（その中で `code .` を実行するか、ほかのエディターの
フォルダーを開くコマンドを使います）、ターミナルもそのディレクトリのままにします。スターターには、
バージョンを固定した依存関係、最小限の実行プログラム、キュレーター用の実装済みヘルパーモジュールが含まれます。
ヘルパーは、自分で書く必要のない基盤処理を提供します。承認済みの事実セットとその制約、事実をキュレーターに渡す
実装済みのローカルツール `approved_fact_lookup`、ストリーミング表示、決定的な展示検証、
対象範囲を限定した Wikipedia MCP サーバーと既定で拒否する権限ハンドラー、
`exhibit.html` 1 ファイルだけへの書き込み権限、簡単なターミナル入力プロンプトです。ヘルパーは編集しません。

スターターには、キュレーターのシステムメッセージ、展示用プロンプト、セッション設定、ツール登録、
処理全体の制御は**含まれていません**。これらはレッスンで作成します。まず 1 つのセッションから始め、
ストリーミング、キュレーターの語り口、事実ツールの登録とプロンプト、ガードレールを管理する
1 つのセッションランナー、検証レポート、対象範囲を限定した Wikipedia 調査、任意の
`exhibit.html` ページへと進みます。各スターターのエントリーポイントには、各ステップのコードを
追加する位置を示すコメントがあります。[`workshop/museum-00-preflight.md`](../workshop/museum-00-preflight.md) から始めてください。

| 言語 | ヘルパーモジュール | ディレクトリへの移動、ビルド、実行 |
|---|---|---|
| .NET | `Helpers/Curator*.cs` | `cd start-museum/dotnet && dotnet build && dotnet run` |
| Node.js | `src/curator.ts` | `cd start-museum/nodejs && npm ci && npm run build && npm start` |
| Python | `curator.py` | `cd start-museum/python && python -m venv .venv && .venv/bin/python -m pip install -r requirements.txt && .venv/bin/python main.py` |
| Go | `curator.go` | `cd start-museum/go && go build -mod=readonly ./... && go run .` |
| Rust | `src/lib.rs` | `cd start-museum/rust && cargo check --locked && cargo run --locked` |
| Java | `src/main/java/workshop/Curator*.java` | `cd start-museum/java && mvn compile && mvn exec:java` |

スターターを実行すると、そのスターターを識別するメッセージが表示されます。Copilot は起動せず、認証も不要です。
ファイルを直接編集するため、変更が `git status` に表示されます。これは想定どおりです。
スターターを初期状態に戻すには、リポジトリのルートで `git checkout -- .` を実行します。

すべてのスターターで完成版アプリに必要な依存関係のバージョンが固定されているため、
ワークショップ中にプロジェクトのマニフェストを編集する必要はありません。Rust スターターは
`src/lib.rs` から `museum_exhibit_studio` ライブラリクレートをビルドします。`src/main.rs` でそこからヘルパーをインポートしてください。
