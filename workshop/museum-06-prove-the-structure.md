# ステップ 6: 構造を証明する

> **所要時間:** 10 分

## 作るもの

すべての展示の下に表示される PASS/FAIL レポートです。追加するコードはわずか 2 行だけで、セッション
ランナーがすでに返しているテキストを取得し、それを構築済みのバリデーターに渡します。

## 決定論的なチェックが証明できること・できないこと

ヘルパーモジュールのバリデーターは、モデルを一切含まない通常のコードです。同じテキストを与えれば
常に同じ判定を返します。次の点をチェックします。

- レベル 1 のタイトルがちょうど 1 つあること
- `## Narrative` セクションがあること
- 100〜140 語の展示ストーリーであること
- `## Visitor questions` セクションに番号付き項目がちょうど 3 つあること
- すべての番号付き項目が疑問符で終わっていること
- 禁止語彙（`software`、`codebase`、`repository`、`terminal`、`GitHub Copilot`）が含まれていないこと

これは**構造的な**契約であり、実際に強制できるものです。しかし**事実的な**契約ではありません。
完璧に構造化された展示でも、承認済みファクトが裏付けない主張を含んでいる可能性があります。レポートは
最後にそのことを明言しており、その一文がこのアプリケーションの誠実な境界線です。

```text
Structural checks do not prove factual grounding. Unsupported claims require human review or a separate evaluator.
```

> **日本語補足（出力例）:** 構造チェックが合格しても、事実の裏付けまでは保証しないことを示す英語メッセージです。人間のレビューや別の評価が必要な境界を明示している点を確認します。

あなたはバリデーターを書くわけではありません。マシンの判定に*反応する*方法を学ぶこと、そして
それが何をカバーしていないのかを正確に知ることが、このレッスンの主眼です。

## バリデーターを組み込む

:::language dotnet
`Program.cs` を開きます。返された展示を取得してレポートを出力します。

```csharp
    Console.WriteLine();
    var exhibit = await RunSessionAsync(
        GenerationConfig(approvedFacts),
        BuildExhibitPrompt(),
        CuratorStreamer.GenerationTimeout);

    Console.WriteLine();
    Console.WriteLine(CuratorValidation.FormatValidation(CuratorValidation.ValidateExhibit(exhibit)));

    return 0;
```

`CuratorValidation` は、ステップ 2 でインポートした `MuseumExhibitStudio.Helpers` 名前空間に
すでに含まれているため、ファイル冒頭に新たに追加するものはありません。

**中を見てみましょう:** `Helpers/CuratorValidation.cs` は「これを証明するのはアプリケーションであって
モデルではない」という主張の具体的な答えです。`ValidateExhibit` はテキストを行に分割し、`TitlePattern`
のマッチ数を数え、`## Narrative` と `## Visitor questions` の見出しを見つけ、`WordPattern` で展示
ストーリーの語数を数え、`QuestionPattern` で番号付き項目を収集し、`ProhibitedVocabulary` の 5 つの語を
テキスト全体から走査します。ルールに失敗するたびにプレーンな一文を `Errors` に追加し、
`FormatValidation` がそれらを出力するレポートに整形します。この間、モデルは一切関与しません。
:::

:::language nodejs
`src/index.ts` を開きます。ヘルパーのインポートに `formatValidation` と `validateExhibit` を追加し、
返された展示を取得してレポートを出力します。

```typescript
    console.log();
    const exhibit = await runSession(
      generationConfig(approvedFacts),
      buildExhibitPrompt(),
      generationTimeoutMs,
    );

    console.log();
    console.log(formatValidation(validateExhibit(exhibit)));
```

**中を見てみましょう:** `src/curator.ts` は「これを証明するのはアプリケーションであってモデルでは
ない」という主張の具体的な答えです。`validateExhibit` はテキストを行に分割し、`titlePattern` の
マッチ数を数え、`## Narrative` と `## Visitor questions` の見出しを見つけ、`wordPattern` で展示
ストーリーの語数を数え、`questionPattern` で番号付き項目を収集し、`prohibitedVocabulary` の 5 つの語を
テキスト全体から走査します。ルールに失敗するたびにプレーンな一文を `errors` に追加し、
`formatValidation` がそれらを出力するレポートに整形します。この間、モデルは一切関与しません。
:::

:::language python
`main.py` を開きます。ヘルパーのインポートに `format_validation` と `validate_exhibit` を追加し、
返された展示を取得してレポートを出力します。

```python
    try:
        print()
        exhibit = await run_session(
            generation_config(facts),
            build_exhibit_prompt(),
            GENERATION_TIMEOUT_SECONDS,
        )

        print()
        print(format_validation(validate_exhibit(exhibit)))
        return 0
```

**中を見てみましょう:** `curator.py` は「これを証明するのはアプリケーションであってモデルでは
ない」という主張の具体的な答えです。`validate_exhibit` はテキストを行に分割し、`_TITLE_PATTERN` の
マッチ数を数え、`## Narrative` と `## Visitor questions` の見出しを見つけ、`_WORD_PATTERN` で展示
ストーリーの語数を数え、`_QUESTION_PATTERN` で番号付き項目を収集し、`PROHIBITED_VOCABULARY` の 5 つの
語をテキスト全体から走査します。ルールに失敗するたびにプレーンな一文を `errors` に追加し、
`format_validation` がそれらを出力するレポートに整形します。この間、モデルは一切関与しません。
:::

:::language go
`main.go` を開きます。返された展示を取得してレポートを出力します。

```go
	fmt.Println()
	exhibit, err := runSession(ctx, exhibitConfig, buildExhibitPrompt(), GenerationTimeout)
	if err != nil {
		return err
	}

	fmt.Println()
	fmt.Println(FormatValidation(ValidateExhibit(exhibit)))
	return nil
```

`FormatValidation` と `ValidateExhibit` は同じパッケージ内の `curator.go` にあるため、追加する
インポートはありません。

**中を見てみましょう:** `curator.go` は「これを証明するのはアプリケーションであってモデルでは
ない」という主張の具体的な答えです。`ValidateExhibit` はテキストを行に分割し、タイトルパターンの
マッチ数を数え、`## Narrative` と `## Visitor questions` の見出しを見つけ、展示ストーリーの語数を
数え、番号付き項目を収集し、小文字化したテキストから `prohibitedVocabulary` の 5 つの語を走査します。
ルールに失敗するたびにプレーンな一文を `validation.Errors` に追加し、`FormatValidation` がそれらを
出力するレポートに整形します。この間、モデルは一切関与しません。
:::

:::language rust
`src/main.rs` を開きます。クレートのインポートに `format_validation` と `validate_exhibit` を追加し、
返された展示を取得してレポートを出力します。

```rust
    println!();
    let exhibit = run_session(
        generation_config(&facts)?,
        build_exhibit_prompt(),
        GENERATION_TIMEOUT,
    )
    .await?;

    println!();
    println!("{}", format_validation(&validate_exhibit(&exhibit)));

    Ok(())
```

**中を見てみましょう:** `src/lib.rs` は「これを証明するのはアプリケーションであってモデルでは
ない」という主張の具体的な答えです。`validate_exhibit` はテキストを行に分割し、タイトルパターンの
マッチ数を数え、`## Narrative` と `## Visitor questions` の見出しを見つけ、展示ストーリーの語数を
数え、番号付き項目を収集し、小文字化したテキストから `PROHIBITED_VOCABULARY` の 5 つの語を走査します。
ルールに失敗するたびにプレーンな一文を `errors` に追加し、`format_validation` がそれらを出力する
レポートに整形します。この間、モデルは一切関与しません。
:::

:::language java
`src/main/java/workshop/MuseumExhibitStudio.java` を開きます。返された展示を取得してレポートを
出力します。

```java
            System.out.println();
            String exhibit = runSession(
                    generationConfig(facts),
                    buildExhibitPrompt(),
                    CuratorStreamer.GENERATION_TIMEOUT);

            System.out.println();
            System.out.println(CuratorValidation.formatValidation(CuratorValidation.validateExhibit(exhibit)));
```

`CuratorValidation` は同じ `workshop` パッケージ内にあるため、追加するインポートはありません。

**中を見てみましょう:** `CuratorValidation.java` は「これを証明するのはアプリケーションであって
モデルではない」という主張の具体的な答えです。`validateExhibit` はテキストを行に分割し、`TITLE_PATTERN`
のマッチ数を数え、`## Narrative` と `## Visitor questions` の見出しを見つけ、`WORD_PATTERN` で展示
ストーリーの語数を数え、`QUESTION_PATTERN` で番号付き項目を収集し、小文字化したテキストから
`PROHIBITED_VOCABULARY` の 5 つの語を走査します。ルールに失敗するたびにプレーンな一文を `errors` に
追加し、`formatValidation` がそれらを出力するレポートに整形します。この間、モデルは一切関与しません。
:::

## 実行する

:::language dotnet
```bash
dotnet run
```
:::
:::language nodejs
```bash
npm start
```
:::
:::language python
```bash
.venv/bin/python main.py
```
:::
:::language go
```bash
go run .
```
:::
:::language rust
```bash
cargo run
```
:::
:::language java
```bash
mvn compile exec:java
```
:::

展示はこれまでと同じようにストリーミングされ、その下に判定が表示されます。

```text
Structural checks passed.
- One level-one title: true
- Narrative section: true
- Narrative length: 126 words (within 100-140: true)
- Visitor questions section: true
- Numbered questions: 3 (exactly three: true)
- Every item is a question: true
- Prohibited vocabulary: none

Structural checks do not prove factual grounding. Unsupported claims require human review or a separate evaluator.
```

> **日本語補足（出力例）:** 構造チェックがすべて成功した場合のレポート例です。タイトル、見出し、語数、質問数、禁止語彙がすべて条件を満たし、最後に事実確認の限界が表示されていることを確認します。

失敗した実行も同じくらい有益で、いずれ目にすることになります。展示ストーリーの語数がその原因で
あることがほとんどです。

```text
Structural checks found issues:
- One level-one title: true
- Narrative section: true
- Narrative length: 163 words (within 100-140: false)
- Visitor questions section: true
- Numbered questions: 3 (exactly three: true)
- Every item is a question: true
- Prohibited vocabulary: none
  - The narrative must contain 100-140 words; found 163.

Structural checks do not prove factual grounding. Unsupported claims require human review or a separate evaluator.
```

> **日本語補足（出力例）:** 構造チェックで語数違反が見つかった場合のレポート例です。`Narrative length` が `false` になり、具体的な語数エラーが追加されていることを確認します。

それでも実行は正常に終了します。これは意図的なものです。このレポートは公開するかどうかを判断する
人間のキュレーターのためのものであり、ビルドのゲートではありません。展示を再実行するか、ファクトの
リストを絞り込んで、もう一度試してみてください。

語彙ルールが発火する様子を見るために、意図的に失敗させてみましょう。次のような独自のファクトを 1 つ
与えます。

```text
The museum's ticketing terminal was installed in 1998.
```


展示は `terminal` という語を繰り返し、レポートがそれを指摘します。このチェックはあなたの意図では
なく、出力を読み取っているのです。

## 理解度チェック

- レポートは構造が合格したと伝えています。展示について、*何を*伝えていないでしょうか。
- 構造上の失敗はプログラムを止めません。それをハードな失敗にするのが適切なのはどんなときで、
  不適切なのはどんなときでしょうか。
- このバリデーターは決定論的です。少し賢いモデルベースのレビュアーと比べて、なぜそれが博物館に
  とってより重要なのでしょうか。

## さらに学ぶ

- [User prompt submitted hook](https://github.com/github/copilot-sdk/blob/main/docs/hooks/user-prompt-submitted.md):
  ランタイムが送信する前に、コード内でプロンプトをチェックまたは拒否します。
- [User prompt transformed hook](https://github.com/github/copilot-sdk/blob/main/docs/hooks/user-prompt-transformed.md):
  ランタイムが実際に構築したモデル向けのプロンプトを読み取ります。
- [Hooks overview](https://github.com/github/copilot-sdk/blob/main/docs/hooks/hooks-overview.md):
  後から実行するチェックではなく、ランタイムが強制するチェックが欲しい場合に、各フックがターンの
  どこに位置するかを解説します。

[Wikipedia MCP でリサーチする](museum-07-wikipedia-research.md) に進みましょう。
