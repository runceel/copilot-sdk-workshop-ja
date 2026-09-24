# 博物館展示スタジオ

この Rust サンプルは、GitHub Copilot SDK をソフトウェア開発以外の用途に特化したエージェント実行基盤として使います。実装済みのヘルパーは `src/lib.rs` に、学習者が作成する処理全体の制御は `src/main.rs` にあります。

## サンプルを実行する

```bash
cargo run --manifest-path finished/rust/museum-exhibit-studio/Cargo.toml --locked
```

生成モデルを選ぶには `COPILOT_MODEL` を設定します。サンプルには認証済みの GitHub Copilot CLI が必要です。

モデルに接続せずに確認するには、次を実行します。

```bash
cargo check --locked --manifest-path finished/rust/museum-exhibit-studio/Cargo.toml
```

## このサンプルで学べること

生成セッションでは、置換用のキュレーターシステムメッセージを使い、承認済みの事実を検証し、120 秒のタイムアウト付きでストリーミングします。アプリケーション管理のツール 1 つだけ（制約を適用した承認済みの事実を返す `approved_fact_lookup`）を許可リストに登録し、空の出力を拒否し、決定的な構造検証の結果を表示します。

任意の Wikipedia 調査は別に実行します。範囲を限定した MCP ツール `search` と `readArticle` だけを公開し、既定で拒否する権限ハンドラーを使い、文章形式のメモと引用元を求めます。調査結果を承認済みの事実に統合することはありません。

任意の HTML 生成では、アプリケーションの作業ディレクトリ内の `exhibit.html` だけに書き込める単一ファイル用の権限ハンドラーとともに、`builtin:apply_patch` を使います。

これは博物館のレッスンを終えた学習者が作り上げるアプリケーションであり、別の参照アーキテクチャではありません。
エントリーポイントには、クライアントの起動、セッションの作成、タイムアウトの適用、空の出力の拒否、
すべての実行経路でのクリーンアップを担う、小さなセッションランナーが 1 つあります。調査、生成、
任意の HTML 作成ステップは、異なるセッション設定でこれを再利用します。学習トラックは次のファイルから
始めてください。
[`workshop/museum-00-preflight.md`](https://github.com/github/copilot-sdk-workshop/blob/main/workshop/museum-00-preflight.md).
