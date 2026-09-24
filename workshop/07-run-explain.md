# ステップ 7: アプリケーションを実行して説明する

> **所要時間:** 10 分

## 説明できるようになること

完成したアプリケーションを実行し、その状態、ツールの境界、パーミッションの境界、そしてレポートの
限界を説明できるようになります。

## エージェントシステム全体を見る

:::language dotnet
完成したアプリケーションはエージェントホストです。そのセッションは、モデル、アプリケーションが所有する
関数、そして別プロセスで動作するブラウザを連携させます。

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
完成したアプリケーションはエージェントホストです。そのセッションは、モデル、アプリケーションが所有する
関数、そして別プロセスで動作するブラウザを連携させます。

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

完成したレポートは
[`finished/nodejs/accessibility-report`](https://github.com/github/copilot-sdk-workshop/tree/main/finished/nodejs/accessibility-report)
にもあります。
:::

:::language python
完成したアプリケーションはエージェントホストです。そのセッションは、モデル、アプリケーションが所有する
関数、そして別プロセスで動作するブラウザを連携させます。

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

完成したレポートは
[`finished/python/accessibility-report`](https://github.com/github/copilot-sdk-workshop/tree/main/finished/python/accessibility-report)
にもあります。
:::

:::language go
完成したアプリケーションはエージェントホストです。そのセッションは、モデル、アプリケーションが所有する
関数、そして別プロセスで動作するブラウザを連携させます。

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
完成したアプリケーションはエージェントホストです。そのセッションは、モデル、アプリケーションが所有する
関数、そして別プロセスで動作するブラウザを連携させます。

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
完成したアプリケーションはエージェントホストです。そのセッションは、モデル、アプリケーションが所有する
関数、そして別プロセスで動作するブラウザを連携させます。

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

## この設計をワークショップの先へ活かす

これらの境界を理解しておくと、ワークショップのコードを再現するだけでなく、別のアプリケーションでも
この設計を再利用できるようになります。データベースの照会、デプロイサービス、課題トラッカーでは
異なるツールを使うかもしれませんが、所有権と信頼に関する同じ問いが当てはまります。

:::language dotnet
全体の流れは
`URL -> Playwright inspection -> C# WCAG lookup -> structured accessibility report`
です。
:::

:::language nodejs
全体の流れは
`URL -> Playwright inspection -> TypeScript WCAG lookup -> structured accessibility report`
です。
:::

:::language python
全体の流れは
`URL -> Playwright inspection -> Python WCAG lookup -> structured accessibility report`
です。
:::

:::language go
全体の流れは
`URL -> Playwright inspection -> Go WCAG lookup -> structured accessibility report`
です。
:::

:::language rust
全体の流れは
`URL -> Playwright inspection -> Rust WCAG lookup -> structured accessibility report`
です。
:::

:::language java
全体の流れは
`URL -> Playwright inspection -> Java WCAG lookup -> structured accessibility report`
です。
:::

## ウイニングランを楽しむ

変更するコードはありません。この実行が実際に構築したアプリケーションをテストできるように、ステップ 6 の
実装をそのまま残しておいてください。

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

> **Java local-demo 警告:** この明示的なフラグは
> [github/copilot-sdk#2273](https://github.com/github/copilot-sdk/issues/2273) に対する一時的な回避策です。
> これがないと、パーミッションのペイロードから正確な URL を検証できない限り、コールバックはフェイルクローズ
> します。これがあると、セッションは設定された Playwright の `browser_navigate` 許可リストの下で、`mcp`
> パーミッション種別のみを 1 リクエストずつ承認しますが、正確なターゲットを強制することはできません。管理された
> ローカルワークショップのターゲットに対してのみ使用し、本番環境、共有環境、信頼できない URL には決して
> 使用しないでください。
:::
ワークショップのターゲットを使用します。

```text
{{TARGET_APP_URL}}
```

5 つのステージすべてに注目してください。

1. クライアントが接続し、1 つのセッションを作成します。
2. Playwright が正確なターゲットへ移動し、アクセシビリティのスナップショットを作成します。
3. 範囲を絞ったローカルリーダーが、その現在の実行のスナップショットを返します。
4. ブラウザで検出可能な指摘事項について、ローカルカタログが呼び出されます。
5. レスポンスはレポートの契約に従い、その限界を明示します。

:::language dotnet
実際のトランスクリプトは異なりますが、次のような形になるはずです。

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
実際のトランスクリプトは異なりますが、次のような形になるはずです。

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

`streamResponse` はツールの start/done 行を出力し、アシスタントのテキストを stdout にストリーミング
します。
:::

:::language python
実際のトランスクリプトは異なりますが、次のような形になるはずです。

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

`main.py` は `report.main` を起動し、デルタをストリーミングした後 `session.idle` を待機します。
:::

:::language go
実際のトランスクリプトは異なりますが、次のような形になるはずです。

```text
# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

`Client` が Copilot CLI のライフサイクルを所有し、`Session` が 1 つの会話を所有し、パーミッション
ハンドラが外部への移動を制御することを説明してください。期待されるレポートは根拠に基づいたものです。
:::

:::language rust
実際のトランスクリプトは異なりますが、次のような形になるはずです。

```text
# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

`Client` がランタイムを管理し、`Session` がイベントをディスパッチし、型付きツールはアプリケーションが
所有し、パーミッションハンドラは正確な移動のみを信頼することを説明してください。
:::

:::language java
実際のトランスクリプトは異なりますが、次のような形になるはずです。

```text
# Accessibility review
## Finding 1: ...
- Evidence: ...
- WCAG criterion: ...
- Recommended remediation: ...
## Review limits
...
```

Maven が Java 17 のアプリケーションをコンパイルし、`CopilotClient` がランタイムを管理し、ツールは
範囲を絞ったままであることを説明してください。デフォルトでは、パーミッションのコールバックは正規の URL のみを
受け入れます。明示的な local-demo フラグを使うと、設定された `mcp` 種別に限定されますが、その URL を
検証することはできません。
:::

この管理されたターゲットには、ブラウザで観測可能な問題が意図的に含まれています。テキスト代替の欠落、
`main` ランドマークの不在、不自然な見出しの順序、アクセシブルな名前を持たないテキストボックスです。
レポートを
[公開されているターゲットの HTML](https://github.com/github/copilot-sdk-workshop/blob/main/docs/target-app/index.html)
と比較してください。スナップショットとソースのどちらにも存在しない指摘事項は受け入れないでください。

<details>
<summary>この完全な実行のトラブルシューティング</summary>

| 症状 | 対処 |
|---|---|
| 既知の問題が省略される | エージェントの出力は変動することがあります。一度だけ再実行してください。ただし、あらかじめ決めた答えを押し付けるのではなく、根拠を要求してください。 |
| 報告された問題がページに存在しない | 根拠がないものとして却下してください。プロンプトは具体的なブラウザの根拠を要求します。 |
| ツールが拒否される | `browser_navigate` が入力された正確なターゲットを使用しているか確認してください。 |
| リーダーがスナップショットを見つけられない | プロンプトの順序を守ってください。`read_latest_accessibility_snapshot` を呼び出す前に移動してください。 |
| ランタイムが起動できない | `copilot login` で再認証し、CLI が `PATH` にあることを確認し、お使いの言語の実行コマンドを再試行してください。 |

</details>

> **コアワークショップを完了したと言えるのは:** レポートが根拠に基づいており、ツール名が表示されていて、
> コードを読まずに以下のアーキテクチャに関する質問に答えられるときです。

## 理解度チェック

1. どの状態がセッションに属しますか?
2. なぜ WCAG カタログはローカルなのですか?
3. なぜ Playwright は外部なのですか?
4. パーミッションはどこで強制されますか?
5. 別の MCP サーバーを追加すると何が変わりますか?

<details>
<summary>自分の説明と比べる</summary>

1. セッションは、1 つの会話のメッセージ、モデルのレスポンス、ツールの結果を所有します。
2. アプリケーションがカタログのデータと決定論的な照会を所有するため、この関数はローカルのままです。
3. Playwright は再利用可能なブラウザ機能であり、独自の Node.js プロセスと依存関係を持ちます。
4. MCP のツール許可リストは移動のみを公開し、パーミッションハンドラは正確なターゲットのみを承認します。
   信頼されるローカルリーダーはパスを受け付けず、新しく生成されたスナップショットのみを読み取ります。
   カタログも読み取り専用です。これらアプリケーションが所有するツールはパーミッションをスキップします。
5. サーバーの設定を追加し、必要なツールのみを公開し、その信頼ポリシーを定義し、同じセッションの
   イベントストリームを通じてその呼び出しを観測し続けます。

</details>

## さらに探求する

アプリケーションでモデルの選択を明示的に制御する必要がある場合は
[オプション: モデルを選択する](08-model-selection.md) を試し、その後
[オプション: インタラクティブな HTML レポートを生成する](09-interactive-html-report.md) に進んでください。
HTML レポートの拡張へ直接進むこともできます。それ以外の場合は、コアワークショップは完了です。

:::language dotnet
完全なリファレンス:

- [完成したアクセシビリティレポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/dotnet/accessibility-report)
- [GitHub Copilot SDK for .NET](https://github.com/github/copilot-sdk/tree/main/dotnet)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
:::

:::language nodejs
完全なリファレンス:

- [完成したアクセシビリティレポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/nodejs/accessibility-report)
- [GitHub Copilot SDK for Node.js](https://github.com/github/copilot-sdk/tree/main/nodejs)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
:::

:::language python
完全なリファレンス:

- [完成したアクセシビリティレポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/python/accessibility-report)
- [GitHub Copilot SDK for Python](https://github.com/github/copilot-sdk/tree/main/python)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)
:::

:::language go
完全なリファレンス:

- [完成したアクセシビリティレポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/go/accessibility-report)
- [GitHub Copilot SDK for Go](https://github.com/github/copilot-sdk/tree/main/go)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

CLI が見つからない場合は、より広いパーミッションを付与するのではなく、インストールしてください。
:::

:::language rust
完全なリファレンス:

- [完成したアクセシビリティレポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/rust/accessibility-report)
- [GitHub Copilot SDK for Rust](https://github.com/github/copilot-sdk/tree/main/rust)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

起動できない場合は、Copilot CLI をインストールして認証してください。
:::

:::language java
完全なリファレンス:

- [完成したアクセシビリティレポーター](https://github.com/github/copilot-sdk-workshop/tree/main/finished/java/accessibility-report)
- [GitHub Copilot SDK for Java](https://github.com/github/copilot-sdk/tree/main/java)
- [Playwright MCP](https://github.com/microsoft/playwright-mcp)

ランタイムが利用できない場合は、Copilot CLI をインストールしてください。Maven を JBang や Gradle に
置き換えないでください。
:::

## さらに学ぶ

このワークショップのアプリケーションはご自身のマシン上で動作します。以下のページでは、同じ設計を
別の場所に移したときに何が変わるかを扱います。

- [バックエンドサービス](https://github.com/github/copilot-sdk/blob/main/docs/setup/backend-services.md):
  ローカルの CLI ではなくヘッドレスの CLI に対して、SDK をサーバーサイドで実行します。
- [スケーリングとマルチテナンシー](https://github.com/github/copilot-sdk/blob/main/docs/setup/scaling.md):
  水平スケーリングと、あるユーザーのセッションを別のユーザーから隔離しておく分離パターンです。
- [OpenTelemetry の計装](https://github.com/github/copilot-sdk/blob/main/docs/observability/opentelemetry.md):
  ターミナルを監視できない場所でエージェントが動作するようになったら、ツール呼び出しとターンをトレースします。
- [Microsoft Agent Framework との統合](https://github.com/github/copilot-sdk/blob/main/docs/integrations/microsoft-agent-framework.md):
  より大きなマルチエージェントのワークフローの中に Copilot セッションを配置します。
