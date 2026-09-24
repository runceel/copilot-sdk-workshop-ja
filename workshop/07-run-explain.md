# ステップ 7: アプリケーションを実行して説明する

> **所要時間:** 10 分

## このステップで説明できるようになること

完成したアプリケーションを実行し、その状態、ツールの境界、権限の境界、
レポートの限界を説明します。

## エージェントシステムの全体像を見る

:::language dotnet
完成したアプリケーションはエージェントのホストです。そのセッションは、モデル、アプリケーションが管理する
関数、別プロセスで動くブラウザーを連携させます。

```text
Console application
  |
  +-- CopilotClient -------- runtime connection
       |
       `-- CopilotSession --- one conversation and its context
            |
            +-- accessibility_rule_lookup
            |     same process, application-owned data
            |
            `-- Playwright MCP
                  separate process, scoped permission handler
                       |
                       `-- Browser target
```
:::

:::language nodejs
完成したアプリケーションはエージェントのホストです。そのセッションは、モデル、アプリケーションが管理する
関数、別プロセスで動くブラウザーを連携させます。

```text
Node.js application
  |
  +-- CopilotClient -------- runtime connection
       |
       `-- CopilotSession --- one conversation and its context
            |
            +-- accessibility_rule_lookup
            |     same process, application-owned data
            |
            `-- Playwright MCP
                  separate process, scoped permission handler
                       |
                       `-- Browser target
```

完成版のレポートは、次の場所にもあります。
[`finished/nodejs/accessibility-report`](https://github.com/github/copilot-sdk-workshop/tree/main/finished/nodejs/accessibility-report).
:::

:::language python
完成したアプリケーションはエージェントのホストです。そのセッションは、モデル、アプリケーションが管理する
関数、別プロセスで動くブラウザーを連携させます。

```text
Python application
  |
  +-- CopilotClient -------- runtime connection
       |
       `-- session ---------- one conversation and its context
            |
            +-- accessibility_rule_lookup
            |     same process, application-owned data
            |
            `-- Playwright MCP
                  separate process, scoped permission handler
                       |
                       `-- Browser target
```

完成版のレポートは、次の場所にもあります。
[`finished/python/accessibility-report`](https://github.com/github/copilot-sdk-workshop/tree/main/finished/python/accessibility-report).
:::

:::language go
完成したアプリケーションはエージェントのホストです。そのセッションは、モデル、アプリケーションが管理する
関数、別プロセスで動くブラウザーを連携させます。

```text
Go application
  |
  +-- Client ---------------- runtime connection
       |
       `-- Session ---------- one conversation and its context
            |
            +-- accessibility_rule_lookup
            |     same process, application-owned data
            |
            `-- Playwright MCP
                  separate process, scoped permission handler
                       |
                       `-- Browser target
```
:::

:::language rust
完成したアプリケーションはエージェントのホストです。そのセッションは、モデル、アプリケーションが管理する
関数、別プロセスで動くブラウザーを連携させます。

```text
Rust application
  |
  +-- Client ---------------- runtime connection
       |
       `-- Session ---------- one conversation and its context
            |
            +-- accessibility_rule_lookup
            |     same process, application-owned data
            |
            `-- Playwright MCP
                  separate process, scoped permission handler
                       |
                       `-- Browser target
```
:::

:::language java
完成したアプリケーションはエージェントのホストです。そのセッションは、モデル、アプリケーションが管理する
関数、別プロセスで動くブラウザーを連携させます。

```text
Java application
  |
  +-- CopilotClient -------- runtime connection
       |
       `-- session ---------- one conversation and its context
            |
            +-- accessibility_rule_lookup
            |     same process, application-owned data
            |
            `-- Playwright MCP
                  separate process, scoped permission handler
                       |
                       `-- Browser target
```
:::

## この設計をワークショップ以外にも応用する

これらの境界を理解すれば、ワークショップのコードを再現するだけでなく、設計を別のアプリケーションにも
再利用できます。データベース検索、デプロイサービス、課題管理ツールでは使用するツールが異なっていても、
誰が何を管理し、何を信頼するかという問いは共通です。

:::language dotnet
全体の流れは次のとおりです。
`URL -> Playwright inspection -> C# WCAG lookup -> structured accessibility report`.
:::

:::language nodejs
全体の流れは次のとおりです。
`URL -> Playwright inspection -> TypeScript WCAG lookup -> structured accessibility report`.
:::

:::language python
全体の流れは次のとおりです。
`URL -> Playwright inspection -> Python WCAG lookup -> structured accessibility report`.
:::

:::language go
全体の流れは次のとおりです。
`URL -> Playwright inspection -> Go WCAG lookup -> structured accessibility report`.
:::

:::language rust
全体の流れは次のとおりです。
`URL -> Playwright inspection -> Rust WCAG lookup -> structured accessibility report`.
:::

:::language java
全体の流れは次のとおりです。
`URL -> Playwright inspection -> Java WCAG lookup -> structured accessibility report`.
:::

## 完成した成果を確かめる

コードの変更は不要です。ステップ 6 の実装をそのまま残し、
自分で構築したアプリケーションを今回の実行で確認します。

## 実行する

:::language dotnet
```bash
dotnet run
```
:::
:::language nodejs
```bash
npm start -- "{{TARGET_APP_URL}}"
```
:::
:::language python
```bash
python main.py "{{TARGET_APP_URL}}"
```
:::
:::language go
```bash
go run . "{{TARGET_APP_URL}}"
```
:::
:::language rust
```bash
cargo run -- "{{TARGET_APP_URL}}"
```
:::
:::language java
```bash
mvn compile exec:java -Dexec.args="--allow-local-demo-mcp {{TARGET_APP_URL}}"
```

> **Java のローカルデモに関する警告:** この明示的なフラグは、
> [github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273) に対する一時的な回避策です。フラグがない場合、
> コールバックは権限ペイロードから正確な URL を確認できない限り、安全側に倒して拒否します。フラグがある場合、
> セッションは設定済みの Playwright `browser_navigate` 許可リストの下で、`mcp` 種別の権限だけを
> リクエストごとに承認します。ただし、正確な対象を強制することはできません。管理されたローカルの
> ワークショップ対象にのみ使用し、本番環境、共有の URL、信頼できない URL には決して使用しないでください。
:::
ワークショップの対象を使います。

```text
{{TARGET_APP_URL}}
```

次の 5 段階をすべて確認してください。

1. クライアントが接続し、1 つのセッションを作成する。
2. Playwright が指定した対象に正確に移動し、アクセシビリティスナップショットを作成する。
3. 範囲を限定したローカルリーダーが、今回の実行で作成されたスナップショットを返す。
4. ブラウザーの証拠に裏付けられた指摘について、ローカルカタログが呼び出される。
5. 応答がレポートの契約に従い、その限界を明記する。

:::language dotnet
実際の出力は異なりますが、おおむね次のような形になります。

```text
=== Accessibility Report Generator ===

Enter URL to analyze: {{TARGET_APP_URL}}

Connected to the Copilot runtime: ...
Analyzing: {{TARGET_APP_URL}}

[tool:start] browser_navigate / playwright-browser_navigate
[tool:done] success=True
[tool:start] read_latest_accessibility_snapshot
[tool:done] success=True
[tool:start] accessibility_rule_lookup
[tool:done] success=True
...

# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```
:::

:::language nodejs
実際の出力は異なりますが、おおむね次のような形になります。

```text
[tool:start] browser_navigate
[tool:done] success=true
[tool:start] read_latest_accessibility_snapshot
[tool:done] success=true
[tool:start] accessibility_rule_lookup
[tool:done] success=true
...

# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

`streamResponse` はツールの開始・完了行を表示し、アシスタントのテキストを標準出力へストリーミングします。
:::

:::language python
実際の出力は異なりますが、おおむね次のような形になります。

```text
[tool:start] browser_navigate
[tool:done] success=True
[tool:start] read_latest_accessibility_snapshot
[tool:done] success=True
[tool:start] accessibility_rule_lookup
[tool:done] success=True
...

# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

`main.py` は `report.main` を起動し、差分をストリーミングした後、`session.idle` を待ちます。
:::

:::language go
実際の出力は異なりますが、おおむね次のような形になります。

```text
# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

`Client` が Copilot CLI のライフサイクルを管理し、`Session` が 1 つの会話を管理し、
権限ハンドラーが外部への移動を制御することを説明してください。レポートは証拠に基づく範囲に限定されるべきです。
:::

:::language rust
実際の出力は異なりますが、おおむね次のような形になります。

```text
# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

`Client` がランタイムを管理し、`Session` がイベントを配信し、型付きツールはアプリケーションが管理し、
権限ハンドラーは指定どおりの移動だけを信頼することを説明してください。
:::

:::language java
実際の出力は異なりますが、おおむね次のような形になります。

```text
# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

Maven が Java 17 アプリケーションをコンパイルし、`CopilotClient` がランタイムを管理し、
ツールの範囲が限定されていることを説明してください。既定の権限コールバックは正式な URL だけを受け入れます。
明示的なローカルデモ用フラグを指定すると、設定済みの `mcp` 種別に限定されますが、その URL は検証できません。
:::

管理された対象には、ブラウザーで観察できる問題を意図的に含めています。代替テキストの欠落、
`main` ランドマークの欠如、不適切な見出し順序、アクセシブルな名前のないテキストボックスです。
レポートを
[公開されている対象の HTML](https://github.com/github/copilot-sdk-workshop/blob/main/docs/target-app/index.html) と比較してください。
スナップショットにもソースにも存在しない指摘は受け入れないでください。

<details>
<summary>全体実行のトラブルシューティング</summary>

| 症状 | 対処方法 |
|---|---|
| 既知の問題が抜けている | エージェントの出力は変動します。一度再実行してみてください。ただし、あらかじめ決めた答えを強制するのではなく、証拠を求めてください。 |
| 報告された問題がページにない | 根拠がない指摘として退けてください。プロンプトでは具体的なブラウザーの証拠を求めています。 |
| ツールが拒否される | `browser_navigate` が入力した対象を正確に使っていることを確認してください。 |
| リーダーがスナップショットを見つけられない | プロンプトの順序を維持してください。`read_latest_accessibility_snapshot` を呼ぶ前にページへ移動します。 |
| ランタイムが起動しない | `copilot login` で再認証し、CLI が `PATH` にあることを確認して、使用言語の実行コマンドを再試行してください。 |

</details>

> **基本ワークショップの完了条件:** レポートに根拠があり、ツール名が表示され、
> コードを読まずに以下のアーキテクチャに関する質問へ答えられることです。

## 理解度を確認する

1. セッションが管理する状態は何ですか？
2. WCAG カタログがローカルにあるのはなぜですか？
3. Playwright が外部にあるのはなぜですか？
4. 権限はどこで強制されますか？
5. 別の MCP サーバーを追加すると、何が変わりますか？

<details>
<summary>自分の説明と比べる</summary>

1. セッションは、1 つの会話のメッセージ、モデルの応答、ツールの結果を管理します。
2. カタログのデータと決定的な検索処理はアプリケーションが管理するため、関数はローカルに置きます。
3. Playwright は、独自の Node.js プロセスと依存関係を持つ、再利用可能なブラウザー機能です。
4. MCP ツールの許可リストは移動機能だけを公開し、権限ハンドラーは指定した対象だけを承認します。
   信頼されたローカルリーダーはパスを受け取らず、新しく生成されたスナップショットだけを読み取ります。
   カタログも読み取り専用です。これらのアプリケーション管理ツールは権限確認を省略します。
5. サーバー設定を追加し、必要なツールだけを公開し、信頼ポリシーを定義します。その呼び出しも、
   同じセッションのイベントストリームを通じて引き続き観察します。

</details>

## さらに探究する

アプリケーションでモデルの選択を明示的に制御する必要がある場合は、[任意: モデルを選択する](08-model-selection.md)
に取り組んでから、[任意: 対話型 HTML レポートを生成する](09-interactive-html-report.md) へ進んでください。
HTML レポートの拡張に直接進むこともできます。拡張に進まない場合は、これで基本ワークショップは完了です。

:::language dotnet
完成版と参考資料:

- [完成版アクセシビリティ レポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/dotnet/accessibility-report)
- [.NET 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/dotnet)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
:::

:::language nodejs
完成版と参考資料:

- [完成版アクセシビリティ レポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/nodejs/accessibility-report)
- [Node.js 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/nodejs)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
:::

:::language python
完成版と参考資料:

- [完成版アクセシビリティ レポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/python/accessibility-report)
- [Python 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/python)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
:::

:::language go
完成版と参考資料:

- [完成版アクセシビリティ レポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/go/accessibility-report)
- [Go 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/go)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

CLI がない場合は、権限を広げるのではなく CLI をインストールしてください。
:::

:::language rust
完成版と参考資料:

- [完成版アクセシビリティ レポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/rust/accessibility-report)
- [Rust 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/rust)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

起動できない場合は、Copilot CLI をインストールして認証してください。
:::

:::language java
完成版と参考資料:

- [完成版アクセシビリティ レポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/java/accessibility-report)
- [Java 用 GitHub Copilot SDK](https://github.com/github/copilot-sdk/tree/main/java)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

ランタイムを利用できない場合は、Copilot CLI をインストールしてください。Maven を JBang や Gradle に置き換えないでください。
:::

## さらに学ぶ

ワークショップのアプリケーションは自分のマシンで動作します。以下のページでは、
同じ設計を別の環境へ移すときに何が変わるかを説明しています。

- [バックエンドサービス](https://github.com/github/copilot-sdk/blob/main/docs/setup/backend-services.md):
  ローカルの CLI ではなく、ヘッドレス CLI を使って SDK をサーバー側で実行する方法。
- [スケーリングとマルチテナンシー](https://github.com/github/copilot-sdk/blob/main/docs/setup/scaling.md):
  水平スケーリングと、ユーザー間でセッションが混在しないようにする分離パターン。
- [OpenTelemetry による計装](https://github.com/github/copilot-sdk/blob/main/docs/observability/opentelemetry.md):
  ターミナルを直接見られない場所でエージェントが動くときに、ツール呼び出しとターンを追跡する方法。
- [Microsoft Agent Framework との統合](https://github.com/github/copilot-sdk/blob/main/docs/integrations/microsoft-agent-framework.md):
  より大きなマルチエージェントワークフローに Copilot セッションを組み込む方法。
