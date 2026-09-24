# GitHub Copilot SDK ワークショップ

今すぐ始める: https://runceel.github.io/copilot-sdk-workshop-ja/

GitHub Copilot SDK を体験する 2 つのワークショップから選んでください。
使用できる言語は .NET、Node.js/TypeScript、Python、Go、Rust、Maven Java です。

- **アクセシビリティ レビュアー:** Web ページを調査し、アプリケーションが管理する WCAG ガイダンスを参照して、
  根拠に基づくレポートを作成する、ソフトウェア開発ライフサイクル（SDLC）向けの開発者ツールを構築します。
- **博物館展示スタジオ:** 教育担当者が承認した事実を来館者向けの展示文に変換する、
  SDLC 以外の用途のキュレーターを構築します。アプリケーション側で確実に適用する制約の下で動作させます。

ワークショップでは、次のことを学びます。

1. Copilot クライアントと会話セッションを作成する。
2. 継続的に適用するエージェントの方針と、タスク固有のデータを分離する。
3. ローカルツール、MCP ツール、対象を厳密に限定した単一ツールの許可リストを使い分ける。
4. 機能、入力、タイムアウト、検証、ライフサイクルの制約をアプリケーションコードで強制する。
5. モデルが推論できることと、アプリケーションが確認しなければならないことを説明する。

所要時間は、アクセシビリティ レビュアーも博物館展示スタジオも約 90 分です。
開発環境のセットアップは、各ワークショップの事前準備で別途行います。この時間は所要時間に含まれません。

この日本語版では説明文を日本語に翻訳しています。演習の整合性を保つため、コード、プロンプトのリテラル、
サンプル出力、および意図的に問題を含めた演習対象アプリは原文のままにしています。

<a id="start-the-workshop"></a>

## ワークショップを始める

この日本語版の GitHub Pages サイト https://runceel.github.io/copilot-sdk-workshop-ja/ を開きます。
作成したい成果物と言語を選び、ワークショップを開始してください。サイトは実行時に Pages の
ベース URL を取得するため、組織やユーザーの Pages ホスト名はハードコードされていません。

クローンしたリポジトリでサイトをプレビューするには、次を実行します。

```bash
git clone https://github.com/runceel/copilot-sdk-workshop-ja.git
cd copilot-sdk-workshop-ja
python3 -m http.server 8000
```

<http://localhost:8000/docs/> を開きます。`step.html` を `file://` URL で開かないでください。
レッスンビューアーが使用する Markdown の取得リクエストがブラウザーによってブロックされます。

## 前提条件

- [.NET 10 SDK](https://learn.microsoft.com/dotnet/core/install/)
- [Node.js 22 以降](https://nodejs.org/)
- [Python 3.11 以降](https://www.python.org/downloads/)
- [Go 1.24 以降](https://go.dev/dl/)
- [Rust 1.94 以降](https://rustup.rs/)
- [Java 17 以降](https://adoptium.net/) と [Maven](https://maven.apache.org/install.html)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)
- GitHub Copilot のサブスクリプションまたは試用版
- Microsoft Edge（ワークショップの既定ブラウザー）または Google Chrome

事前準備では、インストールの確認、認証、OS ごとのコマンド、想定される出力、
トラブルシューティングを説明します。

## リポジトリの構成

```text
copilot-sdk-workshop-ja/
|-- docs/                         GitHub Pages site and controlled target page
|-- workshop/                     Two complete workshop tracks and optional extensions
|-- start-accessibility/          Accessibility Reviewer starters in all six languages
|-- start-museum/                 Museum Exhibit Studio starters in all six languages
|-- finished/dotnet/
|   |-- hello-copilot-sdk/        Completed local-tool example in every language
|   |-- accessibility-report/     Completed .NET local + MCP reporter
|   `-- museum-exhibit-studio/    Grounded museum curator sample, one application-owned tool
|-- finished/nodejs/              Completed TypeScript projects
|-- finished/python/              Completed Python projects
|-- finished/go/                  Completed Go projects
|-- finished/rust/                Completed Rust projects
|-- finished/java/                Completed Maven Java projects
|-- src/BlazorApp/                Source counterpart of the deployed target
|-- scripts/                      Deterministic content and build validation
`-- .github/workflows/            Validation and Pages deployment
```

## 変更を検証する

```bash
bash scripts/validate-workshop.sh
```

このコマンドは、レッスンの構造、内部リンク、サイトの動作に必要なフック、プロジェクトの網羅性を確認します。
続いて、ブラウザーに依存しない言語選択テストを実行し、アクセシビリティと博物館のすべてのスターター、
すべての完成版プロジェクト、Blazor の対象アプリについて、依存関係の復元、ビルド、または構文チェックを行います。
Copilot の認証、ブラウザーの起動、プロンプトの送信は行いません。博物館プロジェクトにはテスト、モック、
フィクスチャが含まれないため、復元とビルドのみを行います。

言語 ID を渡すと、その言語のスモークビルドだけを実行できます。

```bash
bash scripts/validate-workshop.sh nodejs
```

プルリクエストでは、コンテンツの検証と 6 言語それぞれのスモークビルドを別々の GitHub Actions ジョブで
実行するため、失敗した場合に影響を受ける SDK の言語トラックを特定できます。

## 博物館展示スタジオのワークショップ

博物館展示スタジオのスターターは `start-museum/<language>` に、完成版の参照実装は
`finished/<language>/museum-exhibit-studio` にあります。各スターターには、学習者が編集する必要のない
キュレーター用ヘルパーモジュールが含まれます。承認済みの事実セットとその制約、ストリーミング表示、
決定的な展示検証、対象範囲を限定した Wikipedia MCP サーバーと既定で拒否する権限ハンドラー、
`exhibit.html` 1 ファイルだけへの書き込み権限、簡単なターミナル入力プロンプトを提供します。

学習者は `start-museum/<language>` で直接作業し、各ステップで実行しながら、レッスンを通して
1 つのプロジェクトを拡張します。作成するのは、セッション設定、キュレーターと調査用のシステムメッセージ、
プロンプトビルダー、ライフサイクルとガードレールを管理する 1 つのセッションランナー、
および `main` だけです。完成版サンプルは学習者が最終的に作り上げるものであり、別の参照アーキテクチャではありません。

学習トラックは
[`workshop/museum-00-preflight.md`](workshop/museum-00-preflight.md) から始まり、最初のセッション、
ストリーミング、キュレーターの語り口、承認済みの事実、ガードレール、構造チェック、
Wikipedia MCP による調査の 7 つの基本ステップへと進みます。さらに、対話型の `exhibit.html` を作る任意の総合演習があります。

Rust のチェックでは、すべてのワークショッププロジェクトで 1 つの Cargo ターゲットディレクトリを共有し、
SDK の依存関係を何度もコンパイルすることを避けています。

## デプロイ

検証に成功したら、`main` にプッシュします。
[Pages ワークフロー](.github/workflows/deploy.yml) は `docs/` と
`workshop/` の Markdown レッスンを公開します。ビルドとコンテンツの検証は、検証用ワークフローで別途実行されます。

リポジトリの設定で GitHub Pages を有効にし、公開元として **GitHub Actions** を選択します。
デプロイジョブの環境に、ワークショップの正式な URL が表示されます。

デプロイワークフローは、公開されたすべての HTML ページ、サイトアセット、Markdown レッスンを検証します。
既定では GitHub Pages が返す URL を確認します。今後使用する公開ドメインやカスタムドメインを検証する場合は、
リポジトリの Actions 変数 `WORKSHOP_SITE_URL` にそのサイトのベース URL を設定してください。
同じチェックを手動で実行することもできます。

```bash
WORKSHOP_SITE_URL=https://workshop.example.com/ python3 scripts/validate_deployment.py
```

## 参考資料

- [.NET 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/dotnet)
- [Node.js/TypeScript 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/nodejs)
- [Python 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/python)
- [Go 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/go)
- [Rust 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/rust)
- [Java 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/java)
- [Copilot SDK クックブック](https://github.com/github/copilot-sdk/tree/main/cookbook)
- [Copilot SDK の API とソースコード](https://github.com/github/copilot-sdk)
- [GitHub Copilot CLI のインストール](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## ライセンス

このプロジェクトは [MIT ライセンス](LICENSE)で公開されています。

このワークショップは、教育目的で現状のまま提供されています。
完成した本番サービスではなく、概念やパターンを示すことを目的としています。
