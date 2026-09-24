# GitHub Copilot SDK ワークショップ

今すぐ始める: https://runceel.github.io/copilot-sdk-workshop-ja/

.NET、Node.js/TypeScript、Python、Go、Rust、または Maven Java で実施する、2 つのハンズオン形式の
GitHub Copilot SDK ワークショップのいずれかを選んでください:

- **Accessibility Reviewer:** Web ページを検査し、アプリケーションが所有する WCAG ガイダンスを参照して、
  根拠に基づくレポートを生成する SDLC 開発者ツールを作成します。
- **Museum Exhibit Studio:** 教育者が承認したファクトを、決定的なアプリケーション境界の内側で
  来場者向けの展示コピーへと変換する、非 SDLC のキュレーターを作成します。

これらのワークショップを通じて、次のことを行います:

1. Copilot クライアントと会話セッションを作成します。
2. 永続的なエージェントポリシーとタスク固有のデータを分離します。
3. ローカルツール、MCP ツール、そして厳密にスコープを絞った単一ツールの許可リストの間で選択します。
4. 能力、入力、タイムアウト、検証、ライフサイクルの境界をアプリケーションコードで強制します。
5. モデルが推論できることと、アプリケーションが証明しなければならないことを説明します。

Accessibility Reviewer に約 90 分、または Museum Exhibit Studio に 90 分を見込んでください。
マシンのセットアップは、各ワークショップの時間計測なしの事前準備で別途行います。

## ワークショップを始める

リポジトリの **Deploy to GitHub Pages** ワークフローが生成した GitHub Pages の URL を開きます。
ワークショップの成果物を選び、言語を選び、選択したワークショップを開始します。サイトは実行時に Pages の
ベース URL を導出するため、組織やユーザーの Pages ホスト名がハードコードされていることはありません。

クローンからサイトをプレビューするには:

```bash
git clone https://github.com/runceel/copilot-sdk-workshop-ja.git
cd copilot-sdk-workshop-ja
python3 -m http.server 8000
```

<http://localhost:8000/docs/> を開きます。`step.html` を `file://` URL で開かないでください。
レッスンビューアーが使用する Markdown リクエストをブラウザーがブロックします。

## 前提条件

- [.NET 10 SDK](https://learn.microsoft.com/dotnet/core/install/)
- [Node.js 22 以降](https://nodejs.org/)
- [Python 3.11 以降](https://www.python.org/downloads/)
- [Go 1.24 以降](https://go.dev/dl/)
- [Rust 1.94 以降](https://rustup.rs/)
- [Java 17 以降](https://adoptium.net/) と [Maven](https://maven.apache.org/install.html)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)
- GitHub Copilot のサブスクリプションまたはトライアル
- Microsoft Edge（ワークショップの既定）または Google Chrome

事前準備では、インストールチェック、認証、OS 固有のコマンド、期待される出力、
トラブルシューティングを順に説明します。

## リポジトリ構成

```text
copilot-sdk-workshop/
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

このコマンドは、レッスン構造、内部リンク、サイトの挙動フック、プロジェクトの網羅性をチェックします。
続いて、ブラウザーに依存しない言語選択テストを実行し、Copilot の認証、ブラウザーの起動、プロンプトの送信を
行うことなく、すべての accessibility および museum スターター、すべての finished プロジェクト、そして
Blazor ターゲットを復元・ビルド・構文チェックします。museum プロジェクトはテスト、モック、フィクスチャを
一切同梱しないため、そのターゲットは復元とビルドのみを行います。

言語 ID を渡すと、1 つのスモークビルドターゲットを実行できます:

```bash
bash scripts/validate-workshop.sh nodejs
```

プルリクエストでは、コンテンツ検証と 6 つすべての言語のスモークビルドが個別の GitHub Actions ジョブとして
実行されるため、失敗した場合は影響を受けた SDK トラックを特定できます。

## Museum Exhibit Studio ワークショップ

Museum Exhibit Studio のスターターは `start-museum/<language>` の下にあり、完成した参照実装は
`finished/<language>/museum-exhibit-studio` の下にあります。各スターターには、学習者が決して編集しない、
事前ビルド済みのキュレーターヘルパーモジュールが 1 つ同梱されています。承認済みファクトセットとその境界、
ストリーミングプリンター、決定的な展示検証、拒否をデフォルトとするパーミッションハンドラー付きのスコープ化された
Wikipedia MCP サーバー、単一ファイル `exhibit.html` の書き込みパーミッション、そして小さなターミナルプロンプトです。

学習者は `start-museum/<language>` の中で直接作業し、レッスンを通じてその 1 つのプロジェクトを成長させ、
各ステップで実行します。学習者が書くのは、セッションのセットアップ、キュレーターとリサーチのシステムメッセージ、
プロンプトビルダー、ライフサイクルとガードレールを所有する 1 つのセッションランナー、そして `main` だけです。
完成サンプルは、別個の参照アーキテクチャではなく、学習者が最終的に到達するものです。

学習者向けのトラックは
[`workshop/museum-00-preflight.md`](workshop/museum-00-preflight.md) から始まり、7 つのコアステップ
——最初のセッション、ストリーミング、キュレーターの語り口、承認済みファクト、ガードレール、構造チェック、
Wikipedia MCP リサーチ——を経て、任意のインタラクティブな `exhibit.html` の総仕上げまで進みます。

Rust のチェックは、すべてのワークショッププロジェクトで 1 つの Cargo ターゲットディレクトリを共有し、
SDK 依存関係の繰り返しコンパイルを回避します。

## デプロイ

検証に合格したら、`main` にプッシュします。
[Pages ワークフロー](.github/workflows/deploy.yml)が `docs/` と `workshop/` 内の Markdown レッスンを
公開します。ビルドとコンテンツの検証は、検証ワークフローで別途実行されます。

リポジトリ設定で GitHub Pages を有効にし、ソースとして **GitHub Actions** を選択します。デプロイジョブは、
その環境に正規のワークショップ URL をレポートします。

デプロイワークフローは、公開されるすべての HTML ページ、サイトアセット、Markdown レッスンを検証します。
既定では GitHub Pages が返す URL をチェックします。将来の公開ドメインまたはカスタムドメインを代わりに
検証するには、リポジトリの Actions 変数 `WORKSHOP_SITE_URL` にそのサイトのベース URL を設定します。
同じチェックを手動で実行することもできます:

```bash
WORKSHOP_SITE_URL=https://workshop.example.com/ python3 scripts/validate_deployment.py
```

## 参考資料

- [.NET 向け GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/dotnet)
- [Node.js/TypeScript 向け GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/nodejs)
- [Python 向け GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/python)
- [Go 向け GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/go)
- [Rust 向け GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/rust)
- [Java 向け GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/java)
- [Copilot SDK クックブック](https://github.com/github/copilot-sdk/tree/main/cookbook)
- [Copilot SDK の API とソース](https://github.com/github/copilot-sdk)
- [GitHub Copilot CLI をインストールする](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下でライセンスされています。

このワークショップは教育目的で現状のまま提供されます。完全な本番環境向けサービスとして機能させることを
意図したものではなく、概念やパターンを示すことを目的としています。
