# Museum Exhibit Studio: 事前準備

> **所要時間:** 制限なし  
> **ワークショップ:** SDLC 以外の用途のエージェント

## 作成するもの

Museum Exhibit Studio は、教育担当者が承認した事実を、来館者向けの展示文に変換します。

```text
approved facts -> bounded prompt -> curator session -> structural checks -> human review
```

`start-museum/<language>` 内で、1 つのコンソールアプリケーションを段階的に作成します。各
ステップで新しい要素を加えて実行し、キュレーターを少しずつ完成させます。

| ステップ | 追加するもの | 確認できること |
|---|---|---|
| 1 | クライアント、セッション、1 つのプロンプト | ターミナルに表示される展示文 |
| 2 | 用意済みのストリーミング出力機能 | 逐次表示されるテキスト |
| 3 | キュレーターのシステムメッセージ | 文体と構成の変化 |
| 4 | 承認済み事実のプロンプトビルダー | 事実に沿った展示文 |
| 5 | ガードレールを備えたセッション実行関数 | ツールの拒否とわかりやすいエラー処理 |
| 6 | 用意済みの検証機能 | PASS/FAIL による構造検証レポート |
| 7 | 対象を限定した Wikipedia 調査セッション | 展示文には混ぜない、出典付きの背景情報 |
| 8 | 任意のインタラクティブページ | ブラウザーで開く `exhibit.html` |

スターターには、承認済みの事実セットとその制限、ストリーミング出力機能、
決定論的な展示文の検証機能、既定で拒否する権限ハンドラーを備えた対象限定の Wikipedia MCP サーバー、
`exhibit.html` 1 ファイルだけへの書き込み権限、小さなターミナルプロンプトが
用意されています。**ヘルパーモジュールは編集しません。** セッションの設定、2 つの
システムメッセージ、プロンプトビルダー、セッション実行関数、`main` を作成します。

認証済みの GitHub Copilot CLI、使用する言語のランタイム、ターミナルが必要です。完成版ではなく、
`start-museum/<language>` にある最小構成のプロジェクトを直接編集します。
`finished/<language>/museum-exhibit-studio` の完成版は、必要に応じて参照するためのものです。

## ワークショップのリポジトリをクローンする

```bash
git clone https://github.com/github/copilot-sdk-workshop.git
cd copilot-sdk-workshop
```

スターターに移動する前に、ターミナルの作業ディレクトリがリポジトリのルートであることを確認します。

```bash
test "$(git rev-parse --show-toplevel)" = "$PWD"
```

何も出力されず、コマンドが正常終了することを確認してください。

使用する言語のスターターディレクトリ内で、博物館アプリケーションを**直接**作成します。
コピーする手順はありません。リポジトリで追跡されているファイルを編集するため、
`git status` には変更済みファイルとして表示されますが、これは想定どおりです。初期状態の
スターターからやり直す場合は、リポジトリのルートで `git checkout -- .` を実行して編集内容を破棄します。

ここで使用する言語のスターターディレクトリに移動し、この博物館ワークショップの
すべてのコマンドをそこで実行してください。

:::language dotnet
.NET スターターに移動し、復元、ビルド、ローカルのエントリーポイントの実行を行います。

```bash
cd start-museum/dotnet
dotnet restore
dotnet build --no-restore
dotnet run --no-build
```

合格条件: ビルドが成功し、プログラムが `=== Museum Exhibit Studio starter ===`、
続いて `Pre-built curator helpers are ready in Helpers/.` と表示されること。

以降のワークショップでは `start-museum/dotnet` で作業するため、ターミナルはここに置いたままにします。
このフォルダーで `code .` を実行して VS Code で開くか、お好みのエディターで開いてください。

ヘルパーモジュールは `MuseumExhibitStudio.Helpers` 名前空間の `Helpers/Curator*.cs` です。
各レッスンの変更はすべて `Program.cs` に記述します。
:::

:::language nodejs
Node.js スターターに移動します。ロックファイルには SDK 1.0.11 と、
互換性のある `@github/copilot` 1.0.80 プラットフォームパッケージが固定されています。

```bash
cd start-museum/nodejs
npm ci --ignore-scripts --no-audit --fund=false
npm run build
npm start
```

合格条件: ビルドが成功し、プログラムが `=== Museum Exhibit Studio starter ===`、
続いて `Pre-built curator helpers are ready in src/curator.ts.` と表示されること。

以降のワークショップでは `start-museum/nodejs` で作業するため、ターミナルはここに置いたままにします。
このフォルダーで `code .` を実行して VS Code で開くか、お好みのエディターで開いてください。

ヘルパーモジュールは `src/curator.ts` です。各レッスンの変更はすべて `src/index.ts` に記述します。
:::

:::language python
Python スターターに移動し、独立した仮想環境を作成して SDK 1.0.11 をインストールします。

```bash
cd start-museum/python
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m py_compile *.py
.venv/bin/python main.py
```

Windows では、インタープリターは `.venv/Scripts/python.exe` にあります。

合格条件: ソースがコンパイルされ、プログラムが `=== Museum Exhibit Studio starter ===`、
続いて `Pre-built curator helpers are ready in curator.py.` と表示されること。

以降のワークショップでは `start-museum/python` で作業するため、ターミナルはここに置いたままにします。
このフォルダーで `code .` を実行して VS Code で開くか、お好みのエディターで開いてください。

ヘルパーモジュールは `curator.py` です。各レッスンの変更はすべて `main.py` に記述します。
:::

:::language go
Go スターターに移動し、固定された SDK 1.0.11 の依存関係をダウンロードしてビルドします。

```bash
cd start-museum/go
go mod download
go build -mod=readonly ./...
go run .
```

合格条件: ビルドが成功し、プログラムが `=== Museum Exhibit Studio starter ===`、
続いて `Pre-built curator helpers are ready in curator.go.` と表示されること。

以降のワークショップでは `start-museum/go` で作業するため、ターミナルはここに置いたままにします。
このフォルダーで `code .` を実行して VS Code で開くか、お好みのエディターで開いてください。

ヘルパーモジュールは、同じ `main` パッケージ内の `curator.go` です。各レッスンの
変更はすべて `main.go` に記述します。
:::

:::language rust
Rust スターターに移動し、固定された依存関係を取得してチェックします。

```bash
cd start-museum/rust
cargo fetch --locked
cargo check --locked
cargo run --locked
```

合格条件: Cargo が `Cargo.lock` を変更せず、プログラムが
`=== Museum Exhibit Studio starter ===`、続いて
`Pre-built curator helpers are ready in src/lib.rs.` と表示されること。

以降のワークショップでは `start-museum/rust` で作業するため、ターミナルはここに置いたままにします。
このフォルダーで `code .` を実行して VS Code で開くか、お好みのエディターで開いてください。

ヘルパーモジュールは、`src/lib.rs` の `museum_exhibit_studio` ライブラリクレートです。
各レッスンの変更はすべて `src/main.rs` に記述します。
:::

:::language java
Maven スターターに移動し、SDK 1.0.11 の依存関係を解決して、コンパイルと実行を行います。

```bash
cd start-museum/java
mvn dependency:go-offline
mvn compile
mvn exec:java
```

合格条件: Maven が成功し、プログラムが `=== Museum Exhibit Studio starter ===`、
続いて `Pre-built curator helpers are ready in src/main/java/workshop/.` と表示されること。

以降のワークショップでは `start-museum/java` で作業するため、ターミナルはここに置いたままにします。
このフォルダーで `code .` を実行して VS Code で開くか、お好みのエディターで開いてください。

ヘルパーモジュールは `src/main/java/workshop/Curator*.java` です。各レッスンの変更はすべて
`src/main/java/workshop/MuseumExhibitStudio.java` に記述します。
:::

## 信頼境界を明確にする

| 制御手段 | できること |
|---|---|
| システムメッセージ | 役割、口調、対象範囲、出力形式を導く |
| ツールの許可リスト | セッションで使えるツールを厳密に決める |
| アプリケーションコード | ツールが扱うデータを管理し、制限、タイムアウト、検証、後処理を強制する |
| 人間によるレビュー | 歴史に関するすべての記述に根拠があるか判断する |

教育担当者が承認した事実だけが承認済みの情報源であり、キュレーターは
アプリケーションが管理する 1 つのツールを通じてそれを取得します。モデルの記憶は検証済みの博物館知識ではなく、
プロンプトによる指示は認可の境界ではありません。セッションが実際にできることを決めるのは、
許可リストと権限ハンドラーだけです。

## さらに学ぶ

キュレーターが利用する SDK のドキュメントは、このワークショップの外部にあります。
次のページを一緒に開いておくと便利です。

- [GitHub Copilot SDK ハウツー](https://docs.github.com/en/copilot/how-tos/copilot-sdk): この事前準備で扱う
  前提条件も含む、GitHub 公式の SDK ドキュメントです。
- [Copilot SDK ドキュメント一覧](https://github.com/github/copilot-sdk/blob/main/docs/README.md):
  セットアップ、認証、機能、トラブルシューティングの索引です。
- [既定のセットアップ: 同梱 CLI](https://github.com/github/copilot-sdk/blob/main/docs/setup/bundled-cli.md):
  SDK が Copilot CLI を検出して起動する仕組みと、別のバイナリを指定する方法を説明しています。
- [デバッグガイド](https://github.com/github/copilot-sdk/blob/main/docs/troubleshooting/debugging.md):
  出力が表示される前に実行が失敗したとき、最初に確認するページです。

:::language dotnet
- [.NET SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md):
  .NET SDK のパッケージのインストール方法と最小構成のサンプルです。
:::

:::language nodejs
- [Node.js SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md):
  Node.js SDK のパッケージのインストール方法と最小構成のサンプルです。
:::

:::language python
- [Python SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/python/README.md):
  Python SDK のパッケージのインストール方法と最小構成のサンプルです。
:::

:::language go
- [Go SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/go/README.md):
  Go SDK のモジュールのインストール方法と最小構成のサンプルです。
:::

:::language rust
- [Rust SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/rust/README.md):
  Rust SDK のクレートのインストール方法と最小構成のサンプルです。
:::

:::language java
- [Java SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/java/README.md):
  Java SDK の依存関係の座標と最小構成のサンプルです。
:::

次は[最初のキュレーターセッション](museum-01-first-curator-session.md)に進みます。
