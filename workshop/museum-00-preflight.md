# Museum Exhibit Studio: 事前準備

> **所要時間:** 計測なし  
> **ワークショップ:** Non-SDLC agent

## 作るもの

Museum Exhibit Studio は、教育者が承認したファクトを、来場者向けの展示コピーへと変換します。

```text
approved facts -> bounded prompt -> curator session -> structural checks -> human review
```

1 つのコンソールアプリケーションを、`start-museum/<language>` 内でその場所のまま少しずつ育てていきます。各
ステップでは 1 つのアイデアを追加し、実際の実行で締めくくるので、キュレーターが目の前で組み上がっていきます。

| ステップ | 追加するもの | 見えるもの |
|---|---|---|
| 1 | クライアント、セッション、1 つのプロンプト | ターミナルに表示される展示コピー |
| 2 | ビルド済みのストリーミングプリンター | ライブで届くテキスト |
| 3 | キュレーターのシステムメッセージ | 異なる声とかたち |
| 4 | 承認済みファクトのプロンプトビルダー | あなたのファクトに沿ったコピー |
| 5 | ガードレール付きの 1 つのセッションランナー | 拒否されるツールと親切なエラー処理 |
| 6 | ビルド済みのバリデーター | PASS/FAIL の構造チェックレポート |
| 7 | スコープを限定した Wikipedia のリサーチセッション | 展示には入れずに残す、出典付きの背景情報 |
| 8 | 任意のインタラクティブなページ | ブラウザで開く `exhibit.html` |

スターターには、あなたが自分で書く必要のない配管があらかじめ同梱されています。承認済みファクトのセットと
その境界、ストリーミングプリンター、決定論的な展示バリデーション、deny-by-default のパーミッションハンドラー付きの
スコープ限定 Wikipedia MCP サーバー、単一ファイル `exhibit.html` への書き込みパーミッション、そして
小さなターミナルプロンプトです。**ヘルパーモジュールを編集することは決してありません。** あなたが書くのは、セッションのセットアップ、2 つの
システムメッセージ、プロンプトビルダー、1 つのセッションランナー、そして `main` です。

必要なものは、認証済みの GitHub Copilot CLI、あなたの言語ランタイム、そしてターミナルです。作業は
完成版アプリではなく、`start-museum/<language>` 配下の最小構成のプロジェクトで直接行います。`finished/<language>/museum-exhibit-studio`
配下の完成プロジェクトは、任意で参照する資料にすぎません。

## ワークショップリポジトリをクローンする

```bash
git clone https://github.com/runceel/copilot-sdk-workshop-ja.git
cd copilot-sdk-workshop-ja
```

スターターへ移動する前に、ターミナルがリポジトリのルートにあることを確認します:

```bash
test "$(git rev-parse --show-toplevel)" = "$PWD"
```

このコマンドは、出力を出さずに正常終了しなければなりません。

博物館アプリケーションは、あなたの言語のスターターディレクトリ内で**その場所のまま**ビルドします。
コピーの手順はありません。つまり、追跡対象のリポジトリファイルを編集しているため、作業内容は
`git status` に変更済みファイルとして表示されます。これは想定どおりで正しい動作です。クリーンな
スターターからやり直したい場合は、リポジトリのルートで `git checkout -- .` を実行して編集内容を破棄します。

いま自分の言語のスターターディレクトリへ移動し、博物館ワークショップのすべてのコマンドをそこで実行し続けてください。

:::language dotnet
.NET スターターへ移動し、そのローカルエントリーポイントを restore、build、run します。

```bash
cd start-museum/dotnet
dotnet restore
dotnet build --no-restore
dotnet run --no-build
```

合格条件: ビルドが成功し、プログラムが `=== Museum Exhibit Studio starter ===` に続けて
`Pre-built curator helpers are ready in Helpers/.` を出力します。

このワークショップの残りは `start-museum/dotnet` で作業するので、このターミナルはここに置いておいてください。この
フォルダーから `code .` と入力すると VS Code で開けます。あるいは、お好みのエディターでフォルダーを開いてください。

ヘルパーモジュールは `MuseumExhibitStudio.Helpers` 名前空間にある `Helpers/Curator*.cs` です。各
レッスンの変更はすべて `Program.cs` に書きます。
:::

:::language nodejs
Node.js スターターへ移動します。そのロックファイルは SDK 1.0.11 と
互換性のある `@github/copilot` 1.0.80 プラットフォームパッケージを固定しています。

```bash
cd start-museum/nodejs
npm ci --ignore-scripts --no-audit --fund=false
npm run build
npm start
```

合格条件: ビルドが成功し、プログラムが `=== Museum Exhibit Studio starter ===` に続けて
`Pre-built curator helpers are ready in src/curator.ts.` を出力します。

このワークショップの残りは `start-museum/nodejs` で作業するので、このターミナルはここに置いておいてください。この
フォルダーから `code .` と入力すると VS Code で開けます。あるいは、お好みのエディターでフォルダーを開いてください。

ヘルパーモジュールは `src/curator.ts` です。各レッスンの変更はすべて `src/index.ts` に書きます。
:::

:::language python
Python スターターへ移動し、隔離された仮想環境を作成して、SDK 1.0.11 をインストールします。

```bash
cd start-museum/python
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m py_compile *.py
.venv/bin/python main.py
```

Windows では、インタープリターは `.venv/Scripts/python.exe` にあります。

合格条件: ソースがコンパイルされ、プログラムが `=== Museum Exhibit Studio starter ===` に続けて
`Pre-built curator helpers are ready in curator.py.` を出力します。

このワークショップの残りは `start-museum/python` で作業するので、このターミナルはここに置いておいてください。この
フォルダーから `code .` と入力すると VS Code で開けます。あるいは、お好みのエディターでフォルダーを開いてください。

ヘルパーモジュールは `curator.py` です。各レッスンの変更はすべて `main.py` に書きます。
:::

:::language go
Go スターターへ移動し、固定された SDK 1.0.11 の依存関係をダウンロードして、ビルドします。

```bash
cd start-museum/go
go mod download
go build -mod=readonly ./...
go run .
```

合格条件: ビルドが成功し、プログラムが `=== Museum Exhibit Studio starter ===` に続けて
`Pre-built curator helpers are ready in curator.go.` を出力します。

このワークショップの残りは `start-museum/go` で作業するので、このターミナルはここに置いておいてください。この
フォルダーから `code .` と入力すると VS Code で開けます。あるいは、お好みのエディターでフォルダーを開いてください。

ヘルパーモジュールは、同じ `main` パッケージ内の `curator.go` です。各レッスンの変更はすべて
`main.go` に書きます。
:::

:::language rust
Rust スターターへ移動し、固定された依存関係を取得して、チェックします。

```bash
cd start-museum/rust
cargo fetch --locked
cargo check --locked
cargo run --locked
```

合格条件: Cargo が `Cargo.lock` を変更せずに残し、プログラムが
`=== Museum Exhibit Studio starter ===` に続けて
`Pre-built curator helpers are ready in src/lib.rs.` を出力します。

このワークショップの残りは `start-museum/rust` で作業するので、このターミナルはここに置いておいてください。この
フォルダーから `code .` と入力すると VS Code で開けます。あるいは、お好みのエディターでフォルダーを開いてください。

ヘルパーモジュールは `src/lib.rs` にある `museum_exhibit_studio` ライブラリクレートです。各
レッスンの変更はすべて `src/main.rs` に書きます。
:::

:::language java
Maven スターターへ移動し、SDK 1.0.11 を解決して、コンパイルし、実行します。

```bash
cd start-museum/java
mvn dependency:go-offline
mvn compile
mvn exec:java
```

合格条件: Maven が成功し、プログラムが `=== Museum Exhibit Studio starter ===` に続けて
`Pre-built curator helpers are ready in src/main/java/workshop/.` を出力します。

このワークショップの残りは `start-museum/java` で作業するので、このターミナルはここに置いておいてください。この
フォルダーから `code .` と入力すると VS Code で開けます。あるいは、お好みのエディターでフォルダーを開いてください。

ヘルパーモジュールは `src/main/java/workshop/Curator*.java` です。各レッスンの変更はすべて
`src/main/java/workshop/MuseumExhibitStudio.java` に書きます。
:::

## トラストバウンダリーを確立する

| コントロール | できること |
|---|---|
| システムメッセージ | 役割、トーン、スコープ、出力のかたちを導く |
| ツール許可リスト | セッションに存在するツールを正確に決める |
| アプリケーションコード | ツールの背後にあるデータを所有し、上限、タイムアウト、バリデーション、クリーンアップを強制する |
| 人間によるレビュー | すべての歴史的主張に根拠があるかを判断する |

教育者の承認済みファクトが唯一の承認済みソースであり、キュレーターは
アプリケーションが所有する 1 つのツールを通じてそれらに到達します。モデルの記憶は検証済みの博物館知識ではなく、プロンプトによる案内は
認可の境界ではありません。セッションが実際に何をできるかを決めるのは、許可リストとパーミッションハンドラーだけです。

## さらに学ぶ

キュレーターの背後にある SDK は、このワークショップの外部でドキュメント化されています。以下のページは、
ワークショップと並べて開いておく価値があります。

- [GitHub Copilot SDK how-tos](https://docs.github.com/en/copilot/how-tos/copilot-sdk): GitHub 自身の
  SDK ドキュメントで、この事前準備で扱う前提条件も含まれています。
- [Copilot SDK documentation map](https://github.com/github/copilot-sdk/blob/main/docs/README.md):
  セットアップ、認証、機能、トラブルシューティングのインデックスです。
- [Default setup: the bundled CLI](https://github.com/github/copilot-sdk/blob/main/docs/setup/bundled-cli.md):
  SDK が Copilot CLI をどのように見つけて起動するか、そして別のバイナリを指すように設定する方法です。
- [Debugging guide](https://github.com/github/copilot-sdk/blob/main/docs/troubleshooting/debugging.md):
  実行が出力を生成する前に失敗したときに、最初に確認すべき場所です。

:::language dotnet
- [.NET SDK reference](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md):
  .NET SDK のパッケージインストールと最小限の例です。
:::

:::language nodejs
- [Node.js SDK reference](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md):
  Node.js SDK のパッケージインストールと最小限の例です。
:::

:::language python
- [Python SDK reference](https://github.com/github/copilot-sdk/blob/main/python/README.md):
  Python SDK のパッケージインストールと最小限の例です。
:::

:::language go
- [Go SDK reference](https://github.com/github/copilot-sdk/blob/main/go/README.md):
  Go SDK のモジュールインストールと最小限の例です。
:::

:::language rust
- [Rust SDK reference](https://github.com/github/copilot-sdk/blob/main/rust/README.md):
  Rust SDK のクレートインストールと最小限の例です。
:::

:::language java
- [Java SDK reference](https://github.com/github/copilot-sdk/blob/main/java/README.md):
  Java SDK の依存関係座標と最小限の例です。
:::

[はじめてのキュレーターセッション](museum-01-first-curator-session.md) に進みます。
