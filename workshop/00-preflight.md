# 事前準備：開発環境を整える

> **所要時間に含まれない事前準備**  
> 90 分間のワークショップを始める前に、このページの準備を済ませてください。

## 準備が完了すると

事前準備では、リポジトリのクローン、Copilot CLI の認証、
スタータープロジェクトのビルド、Playwright MCP のダウンロードを済ませます。

:::language dotnet
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [.NET 10 SDK](https://learn.microsoft.com/dotnet/core/install/) | C# コンソールアプリケーションのビルドと実行 | `dotnet --version` |
| [Node.js 22 以降](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | SDK が使用する Copilot ランタイムの提供 | `copilot --version` |
| [GitHub Copilot の利用権限](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge（既定）または Google Chrome | Playwright による対象ページの検査 | ワークショップの前に一度ブラウザーを開く |

各コマンドで、次のような出力が得られることを確認してください。

```text
$ dotnet --version
10.0.x
$ node --version
v22.x.x
$ copilot --version
GitHub Copilot CLI ...
```
:::

:::language nodejs
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [Node.js 22.12 以降](https://nodejs.org/) | TypeScript のワークショップアプリと Playwright MCP の実行 | `node --version` |
| [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) | `@github/copilot-sdk` とビルドツールのインストール | `npm --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | SDK が使用する Copilot ランタイムの提供 | `copilot --version` |
| [GitHub Copilot の利用権限](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge（既定）または Google Chrome | Playwright による対象ページの検査 | ワークショップの前に一度ブラウザーを開く |

各コマンドで、次のような出力が得られることを確認してください。

```text
$ node --version
v22.12.x
$ npm --version
10.x.x
$ copilot --version
GitHub Copilot CLI ...
```

公式の
[Node.js SDK インストールガイド](https://github.com/github/copilot-sdk/tree/main/nodejs)を参照してください。
:::

:::language python
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [Python 3.11 以降](https://www.python.org/downloads/) | 非同期のワークショップアプリケーションの実行 | `python --version` |
| [pip](https://pip.pypa.io/en/stable/installation/) | バージョンを固定した `github-copilot-sdk` の wheel のインストール | `python -m pip --version` |
| [Node.js 22 以降](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | 必要に応じて `COPILOT_CLI_PATH` でローカルランタイムを指定 | `copilot --version` |
| [GitHub Copilot の利用権限](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge（既定）または Google Chrome | Playwright による対象ページの検査 | ワークショップの前に一度ブラウザーを開く |

各コマンドで、次のような出力が得られることを確認してください。

```text
$ python --version
Python 3.11.x
$ node --version
v22.x.x
$ copilot --version
GitHub Copilot CLI ...
```

Python SDK は初回使用時にバージョンを固定したランタイムをダウンロードできます。公式の
[Python SDK インストールガイド](https://github.com/github/copilot-sdk/tree/main/python)を参照してください。
:::

:::language go
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [Go 1.24 以降](https://go.dev/dl/) | Go のワークショップモジュールのビルドと実行 | `go version` |
| [Node.js 22 以降](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | SDK のために `PATH`（または `COPILOT_CLI_PATH`）で参照できる必要がある | `copilot --version` |
| [GitHub Copilot の利用権限](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge（既定）または Google Chrome | Playwright による対象ページの検査 | ワークショップの前に一度ブラウザーを開く |

各コマンドで、次のような出力が得られることを確認してください。

```text
$ go version
go version go1.24.x ...
$ node --version
v22.x.x
$ copilot --version
GitHub Copilot CLI ...
```

公式の
[Go SDK インストールガイド](https://github.com/github/copilot-sdk/tree/main/go)を参照してください。
:::

:::language rust
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [Rust 1.94 以降](https://rustup.rs/) | 非同期の Rust ワークショップクレートのビルド | `rustc --version` |
| [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html) | ロックされた依存関係の解決とアプリの実行 | `cargo --version` |
| [Node.js 22 以降](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | 同梱バイナリだけを使用しない場合のランタイム | `copilot --version` |
| [GitHub Copilot の利用権限](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge（既定）または Google Chrome | Playwright による対象ページの検査 | ワークショップの前に一度ブラウザーを開く |

各コマンドで、次のような出力が得られることを確認してください。

```text
$ rustc --version
rustc 1.94.x
$ cargo --version
cargo 1.94.x
$ node --version
v22.x.x
$ copilot --version
GitHub Copilot CLI ...
```

公式の
[Rust SDK インストールガイド](https://github.com/github/copilot-sdk/tree/main/rust)を参照してください。
:::

:::language java
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [Java 17 以降](https://adoptium.net/)（JDK） | Maven のワークショップアプリのコンパイルと実行 | `java -version` |
| [Apache Maven 3.9 以降](https://maven.apache.org/install.html) | プロジェクトのビルドと `exec:java` の起動 | `mvn -version` |
| [Node.js 22 以降](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | Java SDK ランタイムのために `PATH` で参照できる必要がある | `copilot --version` |
| [GitHub Copilot の利用権限](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge（既定）または Google Chrome | Playwright による対象ページの検査 | ワークショップの前に一度ブラウザーを開く |

各コマンドで、次のような出力が得られることを確認してください。

```text
$ java -version
openjdk version "17.x.x" ...
$ mvn -version
Apache Maven 3.9.x
$ node --version
v22.x.x
$ copilot --version
GitHub Copilot CLI ...
```

このコースでは Maven を使用します。JBang や Gradle で代用しないでください。公式の
[Java SDK インストールガイド](https://github.com/github/copilot-sdk/tree/main/java)を参照してください。
:::

## 1. リポジトリをクローンしてスターターを選ぶ

```bash
git clone https://github.com/github/copilot-sdk-workshop.git
cd copilot-sdk-workshop
```

作業は**リポジトリ内で直接**行います。コピーは不要です。使用する言語のスターター
ディレクトリに移動し、ワークショップを通してそこで作業します。リポジトリで追跡されている
ファイルを編集するため、変更が `git status` に表示されますが、これは正常です。
スターターを初期状態に戻すには、リポジトリのルートで `git checkout -- .` を実行して編集内容を破棄します。

## 2. Copilot を認証する

[公式セットアップガイド](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)の方法で
CLI をインストールし、次を実行します。

```bash
copilot login
```

後で SDK から GitHub Copilot にアクセスできるよう、ブラウザーでの認証手順を完了してください。

## 3. Playwright MCP を事前にダウンロードする

次を一度実行すると、バージョンを固定したパッケージをダウンロードし、サーバーを起動せずにオプションを表示できます。

```bash
npx -y @playwright/mcp@0.0.78 --help
```

全員が同じツール名と動作で進められるよう、パッケージのバージョンを固定しています。コードでは
`--browser=msedge` を指定して Microsoft Edge を使用します。代わりに Google Chrome を準備した場合は、
ステップ 4 でこの引数が登場したときに `--browser=chrome` を使用してください。

:::language dotnet
## 4. スターターに移動してビルドする

後で `dotnet build` が Copilot CLI を見つけられない場合は、現在のターミナルでパスを設定します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定">
    <button type="button" role="tab" aria-selected="true" data-tab="cli-windows">Windows</button>
    <button type="button" role="tab" aria-selected="false" data-tab="cli-unix">macOS または Linux</button>
  </div>
  <div role="tabpanel" data-panel="cli-windows">
    <pre><code class="language-powershell">$env:COPILOT_CLI_BINARY_PATH = (Get-Command copilot).Source</code></pre>
  </div>
  <div role="tabpanel" data-panel="cli-unix" hidden>
    <pre><code class="language-bash">export COPILOT_CLI_BINARY_PATH="$(command -v copilot)"</code></pre>
  </div>
</div>

.NET のスターターに移動してビルドします。以降のステップもこのディレクトリで作業してください。

```bash
cd start-accessibility/dotnet
dotnet build
```

ビルドが成功すると、最後に次のように表示されます。

```text
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

この後のワークショップでは `start-accessibility/dotnet` で作業するため、ターミナルはこの場所のままにします。
このフォルダーで `code .` を入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

ワークショップ用に管理された対象ページを一度開き、アクセスできることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `copilot` が認識されない | インストール後にターミナルを再起動するか、上記のコマンドで `COPILOT_CLI_BINARY_PATH` を設定します。 |
| Copilot に認証を求められる | `copilot login` を実行し、ブラウザーでの認証を完了してから再試行します。 |
| NuGet の復元でパッケージソースに接続できない | プロキシやパッケージソースの設定を確認し、`dotnet restore` を実行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後のステップでブラウザーが起動しない | Edge または Chrome をインストールするか、[Playwright MCP のブラウザー設定](https://github.com/microsoft/playwright-mcp#configuration)に従います。 |

</details>

> **ステップ 1 に進む条件：** `dotnet build` が成功し、`copilot login` が完了し、対象ページを
> 開けること。
:::

:::language nodejs
## 4. スターターに移動してビルドする

後で SDK が Copilot CLI を見つけられない場合は、現在のターミナルでインストール先を指定します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定">
    <button type="button" role="tab" aria-selected="true" data-tab="cli-windows">Windows</button>
    <button type="button" role="tab" aria-selected="false" data-tab="cli-unix">macOS または Linux</button>
  </div>
  <div role="tabpanel" data-panel="cli-windows">
    <pre><code class="language-powershell">$env:COPILOT_CLI_PATH = (Get-Command copilot).Source</code></pre>
  </div>
  <div role="tabpanel" data-panel="cli-unix" hidden>
    <pre><code class="language-bash">export COPILOT_CLI_PATH="$(command -v copilot)"</code></pre>
  </div>
</div>

Node.js のスターターに移動し、依存関係をインストールして型チェックを行います。
以降のステップもこのディレクトリで作業してください。

```bash
cd start-accessibility/nodejs
npm install
npm run build
```

型チェックが成功すると TypeScript のエラーは表示されません（`tsc --noEmit` の出力は空になります）。
`package.json` の起動スクリプトは `tsx src/index.ts` です。

この後のワークショップでは `start-accessibility/nodejs` で作業するため、ターミナルはこの場所のままにします。
このフォルダーで `code .` を入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

ワークショップ用に管理された対象ページを一度開き、アクセスできることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `node` または `npm` が認識されない | Node.js 22.12 以降をインストールし、ターミナルを再起動します。 |
| Node のバージョンに関するエンジン警告が出る | Node.js 22.12 以降に更新します。スターターでは `"node": ">=22.12.0"` が指定されています。 |
| ロックファイルが原因で `npm install` が失敗する | `start-accessibility/nodejs` で作業し、`package-lock.json` は削除せずに保持します。 |
| `copilot` が認識されない | インストール後にターミナルを再起動するか、上記のコマンドで `COPILOT_CLI_PATH` を設定します。 |
| Copilot に認証を求められる | `copilot login` を実行し、ブラウザーでの認証を完了してから再試行します。 |
| `npx` で Playwright MCP をダウンロードできない | ネットワーク接続を確認し、セクション 3 の事前ダウンロード用コマンドを再実行します。 |
| 後のステップでブラウザーが起動しない | Edge または Chrome をインストールするか、[Playwright MCP のブラウザー設定](https://github.com/microsoft/playwright-mcp#configuration)に従います。 |

</details>

> **ステップ 1 に進む条件：** `npm run build` が成功し、`copilot login` が完了し、対象ページを
> 開けること。
:::

:::language python
## 4. スターターに移動してビルドする

任意：ランタイムをダウンロードせず、インストール済みの CLI を SDK に使用させることもできます。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定">
    <button type="button" role="tab" aria-selected="true" data-tab="cli-windows">Windows</button>
    <button type="button" role="tab" aria-selected="false" data-tab="cli-unix">macOS または Linux</button>
  </div>
  <div role="tabpanel" data-panel="cli-windows">
    <pre><code class="language-powershell">$env:COPILOT_CLI_PATH = (Get-Command copilot).Source</code></pre>
  </div>
  <div role="tabpanel" data-panel="cli-unix" hidden>
    <pre><code class="language-bash">export COPILOT_CLI_PATH="$(command -v copilot)"</code></pre>
  </div>
</div>

Python のスターターに移動し、仮想環境を作成してバージョンを固定した依存関係をインストールし、
コンパイルチェックを行います。以降のステップもこのディレクトリで作業してください。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Python の仮想環境を作成">
    <button type="button" role="tab" aria-selected="true" data-tab="venv-windows">Windows</button>
    <button type="button" role="tab" aria-selected="false" data-tab="venv-unix">macOS または Linux</button>
  </div>
  <div role="tabpanel" data-panel="venv-windows">
    <pre><code class="language-powershell">cd start-accessibility/python
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m py_compile main.py workshop.py report.py accessibility_rule_catalog.py</code></pre>
  </div>
  <div role="tabpanel" data-panel="venv-unix" hidden>
    <pre><code class="language-bash">cd start-accessibility/python
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m py_compile main.py workshop.py report.py accessibility_rule_catalog.py</code></pre>
  </div>
</div>

インストールが成功すると、`github-copilot-sdk==...` を含む解決済みパッケージが表示されます。
コンパイルチェックが成功した場合は何も出力されません。以降のステップでも仮想環境を有効にしておいてください。

この後のワークショップでは `start-accessibility/python` で作業するため、ターミナルはこの場所のままにします。
このフォルダーで `code .` を入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

必要に応じて今ランタイムをダウンロードしておくと、ステップ 1 の初回実行が速くなります。

```bash
python -m copilot download-runtime
```

ワークショップ用に管理された対象ページを一度開き、アクセスできることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `python` が Python 2 を指している、または見つからない | Python 3.11 以降（macOS/Linux では `python3`）を使用し、仮想環境を作り直します。 |
| `pip install` で PyPI に接続できない | プロキシ設定を確認し、`python -m pip install -r requirements.txt` を再実行します。 |
| パッケージのバージョンが違う | バージョンを固定した `requirements.txt` からのみインストールし、`==` の固定指定を緩めないでください。 |
| 後のステップでランタイムのダウンロードに失敗する | `python -m copilot download-runtime` を実行するか、動作する CLI を `COPILOT_CLI_PATH` に設定します。 |
| Copilot に認証を求められる | `copilot login` を実行し、ブラウザーでの認証を完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後のステップでブラウザーが起動しない | Edge または Chrome をインストールするか、[Playwright MCP のブラウザー設定](https://github.com/microsoft/playwright-mcp#configuration)に従います。 |

</details>

> **ステップ 1 に進む条件：** バージョンを固定した依存関係のインストールと `py_compile` が成功し、
> `copilot login` が完了し、対象ページを開けること。
:::

:::language go
## 4. スターターに移動してビルドする

Go SDK は `PATH` または `COPILOT_CLI_PATH` を使って Copilot CLI を参照します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定">
    <button type="button" role="tab" aria-selected="true" data-tab="cli-windows">Windows</button>
    <button type="button" role="tab" aria-selected="false" data-tab="cli-unix">macOS または Linux</button>
  </div>
  <div role="tabpanel" data-panel="cli-windows">
    <pre><code class="language-powershell">$env:COPILOT_CLI_PATH = (Get-Command copilot).Source</code></pre>
  </div>
  <div role="tabpanel" data-panel="cli-unix" hidden>
    <pre><code class="language-bash">export COPILOT_CLI_PATH="$(command -v copilot)"</code></pre>
  </div>
</div>

Go のスターターに移動し、ロックを維持したままビルドします。
以降のステップもこのディレクトリで作業してください。

```bash
cd start-accessibility/go
go build -mod=readonly ./...
```

ビルドが成功するとエラーは表示されず、スターターディレクトリにバイナリが生成されます。
モジュール解決の再現性を保つため、`go.sum` をそのまま保持してください。

この後のワークショップでは `start-accessibility/go` で作業するため、ターミナルはこの場所のままにします。
このフォルダーで `code .` を入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

ワークショップ用に管理された対象ページを一度開き、アクセスできることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `go: go.mod requires go >= 1.24` | Go 1.24 以降をインストールし、ターミナルを開き直します。 |
| `missing go.sum entry` | コミット済みの `go.sum` を復元し、ロックを書き換えずに `-mod=readonly` でビルドします。 |
| モジュールのダウンロードがブロックされる | `GOPROXY` やプロキシへのアクセスを設定し、スターターディレクトリからビルドを再試行します。 |
| `copilot` が認識されない | CLI のインストール、ターミナルの再起動、または `COPILOT_CLI_PATH` の設定を行います。 |
| Copilot に認証を求められる | `copilot login` を実行し、ブラウザーでの認証を完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後のステップでブラウザーが起動しない | Edge または Chrome をインストールするか、[Playwright MCP のブラウザー設定](https://github.com/microsoft/playwright-mcp#configuration)に従います。 |

</details>

> **ステップ 1 に進む条件：** `go build -mod=readonly ./...` が成功し、`copilot login` が完了し、
> 対象ページを開けること。

ステップ 1 の後で参照用のコードが必要になったら、
[`finished/go/hello-copilot-sdk`](https://github.com/github/copilot-sdk-workshop/tree/main/finished/go/hello-copilot-sdk)
と比較してください。
:::

:::language rust
## 4. スターターに移動してビルドする

後でランタイムの起動時に CLI が見つからない場合は、`COPILOT_CLI_PATH` を設定します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定">
    <button type="button" role="tab" aria-selected="true" data-tab="cli-windows">Windows</button>
    <button type="button" role="tab" aria-selected="false" data-tab="cli-unix">macOS または Linux</button>
  </div>
  <div role="tabpanel" data-panel="cli-windows">
    <pre><code class="language-powershell">$env:COPILOT_CLI_PATH = (Get-Command copilot).Source</code></pre>
  </div>
  <div role="tabpanel" data-panel="cli-unix" hidden>
    <pre><code class="language-bash">export COPILOT_CLI_PATH="$(command -v copilot)"</code></pre>
  </div>
</div>

Rust のスターターに移動し、ロックファイルに従ってチェックします。
以降のステップもこのディレクトリで作業してください。

```bash
cd start-accessibility/rust
cargo check --locked
```

チェックが成功すると、エラーは表示されず、最後に `Finished` の行が表示されます。
クレートの依存関係を固定するため、コミット済みの `Cargo.lock` を保持してください。

この後のワークショップでは `start-accessibility/rust` で作業するため、ターミナルはこの場所のままにします。
このフォルダーで `code .` を入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

ワークショップ用に管理された対象ページを一度開き、アクセスできることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `rustc 1.xx is too old` | `rustup update` で Rust 1.94 以降をインストールし、ターミナルを開き直します。 |
| `--locked` でロックファイルの不一致が出る | スターターの `Cargo.lock` を保持し、制約なしの `cargo update` を実行しないでください。 |
| クレートのダウンロードがブロックされる | crates.io へのネットワークやプロキシ経由のアクセスを確認し、`cargo check` を再試行します。 |
| 後のステップでランタイムが起動しない | `copilot` をインストールして認証するか、`COPILOT_CLI_PATH` を設定します。 |
| Copilot に認証を求められる | `copilot login` を実行し、ブラウザーでの認証を完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後のステップでブラウザーが起動しない | Edge または Chrome をインストールするか、[Playwright MCP のブラウザー設定](https://github.com/microsoft/playwright-mcp#configuration)に従います。 |

</details>

> **ステップ 1 に進む条件：** `cargo check --locked` が成功し、`copilot login` が完了し、
> 対象ページを開けること。

ステップ 1 の後で参照用のコードが必要になったら、
[`finished/rust/hello-copilot-sdk`](https://github.com/github/copilot-sdk-workshop/tree/main/finished/rust/hello-copilot-sdk)
と比較してください。
:::

:::language java
## 4. スターターに移動してビルドする

Java SDK はアプリケーションの起動時に `PATH` から Copilot CLI を参照します。
ビルド前に確認してください。

```bash
copilot --version
```

Java のスターターに移動し、Maven でコンパイルします。以降のステップもこのディレクトリで作業してください。

```bash
cd start-accessibility/java
mvn compile
```

コンパイルが成功すると、最後に次のように表示されます。

```text
[INFO] BUILD SUCCESS
```

`pom.xml` では、`exec-maven-plugin` の
`mainClass` に `workshop.AccessibilityReport` が設定済みです。このコースでは引き続き Maven を使用してください。

この後のワークショップでは `start-accessibility/java` で作業するため、ターミナルはこの場所のままにします。
このフォルダーで `code .` を入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

ワークショップ用に管理された対象ページを一度開き、アクセスできることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| `java` または `mvn` が認識されない | JDK 17 以降と Maven をインストールし、ターミナルを再起動します。 |
| コンパイラーのリリース指定でエラーが出る | `java -version` が 17 以降を示すことを確認します。POM の `maven.compiler.release` は 17 に設定されています。 |
| 依存関係のダウンロードに失敗する | Maven Central やプロキシの設定を確認し、`mvn compile` を再実行します。 |
| 別のツールに切り替えたくなった | このワークショップでは Maven を JBang や Gradle に置き換えないでください。 |
| `copilot` が認識されない | CLI をインストールし、ターミナルを再起動して `copilot --version` を確認します。 |
| Copilot に認証を求められる | `copilot login` を実行し、ブラウザーでの認証を完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後のステップでブラウザーが起動しない | Edge または Chrome をインストールするか、[Playwright MCP のブラウザー設定](https://github.com/microsoft/playwright-mcp#configuration)に従います。 |

</details>

> **ステップ 1 に進む条件：** `mvn compile` で `BUILD SUCCESS` が表示され、`copilot login` が完了し、
> 対象ページを開けること。

ステップ 1 の後で参照用のコードが必要になったら、
[`finished/java/hello-copilot-sdk`](https://github.com/github/copilot-sdk-workshop/tree/main/finished/java/hello-copilot-sdk)
と比較してください。
:::

## さらに学ぶ

これからインストールする SDK には、ワークショップ以外にもドキュメントがあります。
ステップ 1 の前に、次のページをブックマークしておくと便利です。

- [GitHub Copilot SDK ハウツー](https://docs.github.com/en/copilot/how-tos/copilot-sdk)：この事前準備の基になっている
  前提条件を含む、GitHub 公式の SDK ドキュメントです。
- [Copilot SDK ドキュメント一覧](https://github.com/github/copilot-sdk/blob/main/docs/README.md)：
  セットアップ、認証、機能、トラブルシューティングの索引です。
- [既定のセットアップ：同梱 CLI](https://github.com/github/copilot-sdk/blob/main/docs/setup/bundled-cli.md)：
  SDK が Copilot CLI を検出して起動する仕組みと、別のバイナリを指定する方法を説明しています。
- [デバッグガイド](https://github.com/github/copilot-sdk/blob/main/docs/troubleshooting/debugging.md)：
  何も出力されないまま実行が失敗したときに、最初に確認するページです。

:::language dotnet
- [.NET SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/dotnet/README.md)：
  .NET SDK のパッケージのインストール方法と最小限の例です。
:::

:::language nodejs
- [Node.js SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/nodejs/README.md)：
  Node.js SDK のパッケージのインストール方法と最小限の例です。
:::

:::language python
- [Python SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/python/README.md)：
  Python SDK のパッケージのインストール方法と最小限の例です。
:::

:::language go
- [Go SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/go/README.md)：
  Go SDK のモジュールのインストール方法と最小限の例です。
:::

:::language rust
- [Rust SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/rust/README.md)：
  Rust SDK のクレートのインストール方法と最小限の例です。
:::

:::language java
- [Java SDK リファレンス](https://github.com/github/copilot-sdk/blob/main/java/README.md)：
  Java SDK の依存関係の指定と最小限の例です。
:::

[ステップ 1：最初の Copilot セッションを作成する](01-first-session.md)に進んでください。
