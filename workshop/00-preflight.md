# 事前準備: マシンを準備する

> **時間制限なしの準備**  
> 90分のワークショップを始める前に、このページを完了してください。

## 準備できるもの

事前準備を終えるころには、リポジトリのクローン、Copilot CLI の認証、スターター
プロジェクトのビルド、そして Playwright MCP のダウンロードと準備が完了しています。

:::language dotnet
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [.NET 10 SDK](https://learn.microsoft.com/dotnet/core/install/) | C# コンソールアプリケーションのビルドと実行 | `dotnet --version` |
| [Node.js 22 or newer](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | SDK が使用する Copilot ランタイムを提供 | `copilot --version` |
| [GitHub Copilot access](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge (default) or Google Chrome | Playwright が対象ページを検査できるようにする | ワークショップ前に一度ブラウザを開く |

コマンドは次のような形式の出力を返すはずです。

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
| [Node.js 22.12 or newer](https://nodejs.org/) | TypeScript のワークショップアプリと Playwright MCP の実行 | `node --version` |
| [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) | `@github/copilot-sdk` とビルドツールのインストール | `npm --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | SDK が使用する Copilot ランタイムを提供 | `copilot --version` |
| [GitHub Copilot access](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge (default) or Google Chrome | Playwright が対象ページを検査できるようにする | ワークショップ前に一度ブラウザを開く |

コマンドは次のような形式の出力を返すはずです。

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
| [Python 3.11 or newer](https://www.python.org/downloads/) | 非同期のワークショップアプリケーションの実行 | `python --version` |
| [pip](https://pip.pypa.io/en/stable/installation/) | 固定バージョンの `github-copilot-sdk` wheel のインストール | `python -m pip --version` |
| [Node.js 22 or newer](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | `COPILOT_CLI_PATH` によるローカルランタイムの任意の上書き | `copilot --version` |
| [GitHub Copilot access](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge (default) or Google Chrome | Playwright が対象ページを検査できるようにする | ワークショップ前に一度ブラウザを開く |

コマンドは次のような形式の出力を返すはずです。

```text
$ python --version
Python 3.11.x
$ node --version
v22.x.x
$ copilot --version
GitHub Copilot CLI ...
```

Python SDK は初回使用時に固定バージョンのランタイムをダウンロードできます。公式の
[Python SDK インストールガイド](https://github.com/github/copilot-sdk/tree/main/python)を参照してください。
:::

:::language go
## 必要なもの

| 要件 | ワークショップで必要な理由 | 確認方法 |
|---|---|---|
| [Go 1.24 or newer](https://go.dev/dl/) | Go のワークショップモジュールのビルドと実行 | `go version` |
| [Node.js 22 or newer](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | SDK のために `PATH`（または `COPILOT_CLI_PATH`）上で必要 | `copilot --version` |
| [GitHub Copilot access](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge (default) or Google Chrome | Playwright が対象ページを検査できるようにする | ワークショップ前に一度ブラウザを開く |

コマンドは次のような形式の出力を返すはずです。

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
| [Rust 1.94 or newer](https://rustup.rs/) | 非同期の Rust ワークショップクレートのビルド | `rustc --version` |
| [Cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html) | ロックされた依存関係を解決しアプリを実行 | `cargo --version` |
| [Node.js 22 or newer](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | 同梱バイナリのみに依存しない場合に使用するランタイム | `copilot --version` |
| [GitHub Copilot access](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge (default) or Google Chrome | Playwright が対象ページを検査できるようにする | ワークショップ前に一度ブラウザを開く |

コマンドは次のような形式の出力を返すはずです。

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
| [Java 17 or newer](https://adoptium.net/) (JDK) | Maven のワークショップアプリのコンパイルと実行 | `java -version` |
| [Apache Maven 3.9+](https://maven.apache.org/install.html) | プロジェクトのビルドと `exec:java` の起動 | `mvn -version` |
| [Node.js 22 or newer](https://nodejs.org/) | Playwright MCP サーバーの実行 | `node --version` |
| [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli) | Java SDK ランタイムのために `PATH` 上で必要 | `copilot --version` |
| [GitHub Copilot access](https://github.com/features/copilot) | Copilot リクエストの認可 | `copilot login` |
| Microsoft Edge (default) or Google Chrome | Playwright が対象ページを検査できるようにする | ワークショップ前に一度ブラウザを開く |

コマンドは次のような形式の出力を返すはずです。

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

このトラックでは Maven を使用してください。JBang や Gradle で代用しないでください。公式の
[Java SDK インストールガイド](https://github.com/github/copilot-sdk/tree/main/java)を参照してください。
:::

## 1. リポジトリをクローンしてスターターを選ぶ

```bash
git clone https://github.com/runceel/copilot-sdk-workshop-ja.git
cd copilot-sdk-workshop-ja
```

作業は**リポジトリ内で直接**行います。コピー手順はありません。自分の言語のスターター
ディレクトリに移動し、ワークショップ全体を通してそこにとどまります。つまり、追跡対象の
リポジトリファイルを編集することになるため、変更は `git status` に表示されます。これは想定どおりです。
再びクリーンなスターターに戻したい場合は、リポジトリのルートで `git checkout -- .` を実行して編集を破棄してください。

## 2. Copilot を認証する

[公式セットアップガイド](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)の
方法で CLI をインストールし、次を実行します。

```bash
copilot login
```

ブラウザのフローを完了させ、後続の SDK 呼び出しが GitHub Copilot に到達できるようにします。

## 3. Playwright MCP をウォームアップする

固定バージョンのパッケージをダウンロードし、サーバーを起動せずにそのオプションを表示するには、これを一度実行します。

```bash
npx -y @playwright/mcp@0.0.78 --help
```

パッケージのバージョンは固定されているため、全員が同じツール名と動作を目にします。コードは
`--browser=msedge` で Microsoft Edge を使用します。代わりに Google Chrome を準備した場合は、
ステップ4で引数が登場したときに `--browser=chrome` を使用してください。

:::language dotnet
## 4. スターターに移動してビルドする

後で `dotnet build` が Copilot CLI を見つけられない場合は、現在のターミナルにそのパスを設定します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定する">
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

.NET スターターに移動してビルドします。以降のすべてのステップでこのディレクトリにとどまってください。

```bash
cd start-accessibility/dotnet
dotnet build
```

ビルドが成功すると、次のように終わります。

```text
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

ワークショップの残りは `start-accessibility/dotnet` で作業するため、このターミナルはここに置いておきます。
このフォルダーから `code .` と入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

管理された対象ページを一度開いて、到達できることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `copilot` が認識されない | インストール後にターミナルを再起動するか、上記のコマンドで `COPILOT_CLI_BINARY_PATH` を設定します。 |
| Copilot が認証を求めてくる | `copilot login` を実行し、ブラウザのフローを完了してから再試行します。 |
| NuGet の復元がパッケージソースに到達できない | プロキシまたはパッケージソースの設定を確認し、`dotnet restore` を実行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後でブラウザが起動しない | Edge または Chrome をインストールするか、[Playwright MCP browser configuration](https://github.com/microsoft/playwright-mcp#configuration) に従います。 |

</details>

> **ステップ1を始めるタイミング:** `dotnet build` が成功し、`copilot login` が完了し、対象ページが
> 開くとき。
:::

:::language nodejs
## 4. スターターに移動してビルドする

後で SDK が Copilot CLI を見つけられない場合は、現在のターミナルでインストール先を指定します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定する">
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

Node.js スターターに移動し、依存関係をインストールして型チェックします。以降のすべての
ステップでこのディレクトリにとどまってください。

```bash
cd start-accessibility/nodejs
npm install
npm run build
```

型チェックが成功すると、TypeScript のエラーなしで終わります（`tsc --noEmit` からの出力が空）。
`package.json` の start スクリプトは `tsx src/index.ts` です。

ワークショップの残りは `start-accessibility/nodejs` で作業するため、このターミナルはここに置いておきます。
このフォルダーから `code .` と入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

管理された対象ページを一度開いて、到達できることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `node` または `npm` が認識されない | Node.js 22.12 以降をインストールし、ターミナルを再起動します。 |
| Node バージョンに関するエンジンの警告 | Node.js 22.12+ にアップグレードします。スターターは `"node": ">=22.12.0"` を宣言しています。 |
| `npm install` がロックファイルで失敗する | `start-accessibility/nodejs` にとどまり `package-lock.json` を保持します。削除しないでください。 |
| `copilot` が認識されない | インストール後にターミナルを再起動するか、上記のコマンドで `COPILOT_CLI_PATH` を設定します。 |
| Copilot が認証を求めてくる | `copilot login` を実行し、ブラウザのフローを完了してから再試行します。 |
| `npx` が Playwright MCP をダウンロードできない | ネットワークアクセスを確認し、セクション3のウォームアップコマンドを再実行します。 |
| 後でブラウザが起動しない | Edge または Chrome をインストールするか、[Playwright MCP browser configuration](https://github.com/microsoft/playwright-mcp#configuration) に従います。 |

</details>

> **ステップ1を始めるタイミング:** `npm run build` が成功し、`copilot login` が完了し、対象ページが
> 開くとき。
:::

:::language python
## 4. スターターに移動してビルドする

任意: SDK にランタイムをダウンロードさせる代わりに、インストール済みの CLI を使用させます。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定する">
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

Python スターターに移動し、仮想環境を作成し、固定バージョンの要件をインストールして、
コンパイルチェックします。以降のすべてのステップでこのディレクトリにとどまってください。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Python の仮想環境を作成する">
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

インストールが成功すると、`github-copilot-sdk==...` を含む解決済みのパッケージが表示されます。
コンパイルチェックが成功すると、出力は表示されません。以降のステップのために仮想環境を有効化したままにしておきます。

ワークショップの残りは `start-accessibility/python` で作業するため、このターミナルはここに置いておきます。
このフォルダーから `code .` と入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

任意で、最初のステップ1の実行を速くするために、今のうちにランタイムを事前ダウンロードしておきます。

```bash
python -m copilot download-runtime
```

管理された対象ページを一度開いて、到達できることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `python` が Python 2 を指しているか存在しない | Python 3.11+（macOS/Linux では `python3`）を使用し、venv を再作成します。 |
| `pip install` が PyPI に到達できない | プロキシ設定を確認し、`python -m pip install -r requirements.txt` を再実行します。 |
| パッケージのバージョンが誤っている | 固定された `requirements.txt` からのみインストールします。`==` の固定を緩めないでください。 |
| 後でランタイムのダウンロードが失敗する | `python -m copilot download-runtime` を実行するか、動作する CLI に `COPILOT_CLI_PATH` を設定します。 |
| Copilot が認証を求めてくる | `copilot login` を実行し、ブラウザのフローを完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後でブラウザが起動しない | Edge または Chrome をインストールするか、[Playwright MCP browser configuration](https://github.com/microsoft/playwright-mcp#configuration) に従います。 |

</details>

> **ステップ1を始めるタイミング:** 固定された要件がインストールされ、`py_compile` が成功し、`copilot login` が
> 完了し、対象ページが開くとき。
:::

:::language go
## 4. スターターに移動してビルドする

Go SDK は Copilot CLI が `PATH` 上にあること、または `COPILOT_CLI_PATH` を通じて指定されることを期待します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定する">
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

Go スターターに移動し、ロックを強制した状態でビルドします。以降のすべてのステップで
このディレクトリにとどまってください。

```bash
cd start-accessibility/go
go build -mod=readonly ./...
```

ビルドが成功するとエラーは表示されず、スターターディレクトリにバイナリが生成されます。
モジュール解決が決定的なままになるよう、`go.sum` はそのまま保持してください。

ワークショップの残りは `start-accessibility/go` で作業するため、このターミナルはここに置いておきます。
このフォルダーから `code .` と入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

管理された対象ページを一度開いて、到達できることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `go: go.mod requires go >= 1.24` | Go 1.24 以降をインストールし、ターミナルを開き直します。 |
| `missing go.sum entry` | コミット済みの `go.sum` を復元します。ロックを書き換える代わりに `-mod=readonly` でビルドします。 |
| モジュールのダウンロードがブロックされる | `GOPROXY`／プロキシアクセスを構成し、スターターディレクトリからビルドを再試行します。 |
| `copilot` が認識されない | CLI をインストールし、ターミナルを再起動するか、`COPILOT_CLI_PATH` を設定します。 |
| Copilot が認証を求めてくる | `copilot login` を実行し、ブラウザのフローを完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後でブラウザが起動しない | Edge または Chrome をインストールするか、[Playwright MCP browser configuration](https://github.com/microsoft/playwright-mcp#configuration) に従います。 |

</details>

> **ステップ1を始めるタイミング:** `go build -mod=readonly ./...` が成功し、`copilot login` が完了し、
> 対象ページが開くとき。

ステップ1の後で参照点が欲しい場合は、
[`finished/go/hello-copilot-sdk`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/go/hello-copilot-sdk)
と比較してください。
:::

:::language rust
## 4. スターターに移動してビルドする

後でランタイム起動時に CLI を解決できない場合は、`COPILOT_CLI_PATH` を設定します。

<div class="workshop-tabs" data-tabs>
  <div role="tablist" aria-label="Copilot CLI のパスを設定する">
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

Rust スターターに移動し、ロックファイルと照合してチェックします。以降のすべてのステップで
このディレクトリにとどまってください。

```bash
cd start-accessibility/rust
cargo check --locked
```

チェックが成功すると、`Finished` の行で終わり、エラーは表示されません。クレートグラフが
固定されたままになるよう、`Cargo.lock` はコミットしたまま保持してください。

ワークショップの残りは `start-accessibility/rust` で作業するため、このターミナルはここに置いておきます。
このフォルダーから `code .` と入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

管理された対象ページを一度開いて、到達できることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `rustc 1.xx is too old` | `rustup update` で Rust 1.94+ をインストールし、ターミナルを開き直します。 |
| `--locked` でロックファイルが一致しない | スターターの `Cargo.lock` を保持します。制約のない `cargo update` を実行しないでください。 |
| クレートのダウンロードがブロックされる | crates.io へのネットワーク／プロキシアクセスを確認し、`cargo check` を再試行します。 |
| 後でランタイムが起動できない | `copilot` をインストールして認証するか、`COPILOT_CLI_PATH` を設定します。 |
| Copilot が認証を求めてくる | `copilot login` を実行し、ブラウザのフローを完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後でブラウザが起動しない | Edge または Chrome をインストールするか、[Playwright MCP browser configuration](https://github.com/microsoft/playwright-mcp#configuration) に従います。 |

</details>

> **ステップ1を始めるタイミング:** `cargo check --locked` が成功し、`copilot login` が完了し、
> 対象ページが開くとき。

ステップ1の後で参照点が欲しい場合は、
[`finished/rust/hello-copilot-sdk`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/rust/hello-copilot-sdk)
と比較してください。
:::

:::language java
## 4. スターターに移動してビルドする

Java SDK は、アプリケーションの起動時に Copilot CLI が `PATH` 上にあることを期待します。
ビルドする前に確認してください。

```bash
copilot --version
```

Java スターターに移動し、Maven でコンパイルします。以降のすべてのステップでこのディレクトリにとどまってください。

```bash
cd start-accessibility/java
mvn compile
```

コンパイルが成功すると、次のように終わります。

```text
[INFO] BUILD SUCCESS
```

`pom.xml` は、`mainClass` を `workshop.AccessibilityReport` として `exec-maven-plugin` を
すでに構成しています。このトラックでは Maven を使い続けてください。

ワークショップの残りは `start-accessibility/java` で作業するため、このターミナルはここに置いておきます。
このフォルダーから `code .` と入力して VS Code で開くか、お好みのエディターでフォルダーを開いてください。

管理された対象ページを一度開いて、到達できることを確認します。

```text
{{TARGET_APP_URL}}
```

<details>
<summary>事前準備のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| `java` または `mvn` が認識されない | JDK 17+ と Maven をインストールし、ターミナルを再起動します。 |
| コンパイラーのリリースエラー | `java -version` が 17 以降を報告することを確認します。POM は `maven.compiler.release` を 17 に設定しています。 |
| 依存関係のダウンロードが失敗する | Maven Central／プロキシの設定を確認し、`mvn compile` を再実行します。 |
| ツールを切り替えたくなる | このワークショップでは Maven を JBang や Gradle に置き換えないでください。 |
| `copilot` が認識されない | CLI をインストールし、ターミナルを再起動して、`copilot --version` を確認します。 |
| Copilot が認証を求めてくる | `copilot login` を実行し、ブラウザのフローを完了してから再試行します。 |
| `npx` が認識されない | Node.js 22 以降をインストールし、ターミナルを再起動します。 |
| 後でブラウザが起動しない | Edge または Chrome をインストールするか、[Playwright MCP browser configuration](https://github.com/microsoft/playwright-mcp#configuration) に従います。 |

</details>

> **ステップ1を始めるタイミング:** `mvn compile` が `BUILD SUCCESS` を表示し、`copilot login` が完了し、
> 対象ページが開くとき。

ステップ1の後で参照点が欲しい場合は、
[`finished/java/hello-copilot-sdk`](https://github.com/runceel/copilot-sdk-workshop-ja/tree/main/finished/java/hello-copilot-sdk)
と比較してください。
:::

## さらに学ぶ

これからインストールする SDK は、このワークショップの外でドキュメント化されています。ステップ1の前に
ブックマークしておく価値があるのは次のページです。

- [GitHub Copilot SDK how-tos](https://docs.github.com/en/copilot/how-tos/copilot-sdk): GitHub 自身の
  SDK ドキュメントで、この事前準備が反映している前提条件を含みます。
- [Copilot SDK documentation map](https://github.com/github/copilot-sdk/blob/main/docs/README.md):
  セットアップ、認証、機能、トラブルシューティングの索引です。
- [Default setup: the bundled CLI](https://github.com/github/copilot-sdk/blob/main/docs/setup/bundled-cli.md):
  SDK が Copilot CLI をどのように探して起動するか、そして別のバイナリを指定する方法です。
- [Debugging guide](https://github.com/github/copilot-sdk/blob/main/docs/troubleshooting/debugging.md):
  出力を生成する前に実行が失敗したときに最初に見るべき場所です。

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
  Java SDK の依存関係の座標と最小限の例です。
:::

[ステップ1: 最初の Copilot セッションを作成する](01-first-session.md)に進みます。
