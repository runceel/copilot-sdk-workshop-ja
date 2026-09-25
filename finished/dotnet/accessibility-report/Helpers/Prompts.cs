namespace AccessibilityReport.Helpers;

public static class Prompts
{
    public static string CreateReportPrompt(Uri targetUri) => $"""
        次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  {targetUri.AbsoluteUri}.

        1. `browser_navigate` を使って、指定された URL を開いてください。
        2. `read_latest_accessibility_snapshot` を呼び出して、アクセシビリティツリーを確認してください。
        3. スナップショットで確認できる、確度の高い課題を 3〜5 件特定してください。
        4. 修正案を提案する前に、各課題について `accessibility_rule_lookup` を呼び出してください。

        次の構成だけを返してください:

        # Accessibility review
        ## Finding 1: <短い名称>
        - Evidence: <ブラウザーで観測した具体的な要素またはページ構造>
        - WCAG criterion: <カタログが返した基準とタイトル>
        - Recommended remediation: <具体的な実装上の変更>

        必要に応じて指摘事項のセクションを繰り返してください。

        ## Review limits
        これはブラウザーで観測できる根拠に限定したレビューであり、WCAG 適合性の完全な監査ではないことを明記してください。

        根拠を捏造したり、裏付けのない統計を報告したり、このページが WCAG に適合していると断定したりしないでください。
        """;
}