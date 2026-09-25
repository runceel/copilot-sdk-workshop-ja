namespace HelloCopilotSDK.Helpers;

public static class AccessibilityRuleCatalog
{
    public static readonly AccessibilityRule[] Rules =
    [
        new(
            "1.1.1",
            "非テキストコンテンツ",
            "情報を伝える画像に、内容を説明する代替テキストがありません。",
            "画像の目的が伝わる簡潔な代替テキストを設定してください。装飾目的の画像に限り alt=\"\" を使用します。",
            ["image", "alt text", "text alternative", "Non-text Content", "画像", "代替テキスト"]),
        new(
            "1.3.1",
            "情報及び関係性",
            "ページの構造や要素間の関係が、見た目だけで示されています。",
            "main などのランドマークや適切な見出し階層を使い、支援技術にも構造が伝わるようにしてください。",
            ["main landmark", "heading hierarchy", "page structure", "semantic", "Info and Relationships", "ランドマーク", "見出し", "ページ構造"]),
        new(
            "1.4.3",
            "コントラスト（最低限）",
            "テキストと背景のコントラストが不足しています。",
            "通常のテキストでは 4.5:1 以上、大きなテキストでは 3:1 以上のコントラスト比を確保してください。",
            ["contrast", "low contrast", "color", "Contrast (Minimum)", "コントラスト", "色"]),
        new(
            "2.4.7",
            "フォーカスの可視化",
            "キーボード操作時に、フォーカスの位置がはっきり見えません。",
            "すべての操作可能な要素に、見やすくコントラストの十分なフォーカス表示を設けてください。",
            ["focus", "keyboard", "outline", "Focus Visible", "フォーカス", "キーボード"]),
        new(
            "3.3.2",
            "ラベル又は説明",
            "フォームに、常に表示されるラベルや必要な入力説明がありません。",
            "入力する内容が分かるラベルと、必要に応じた説明を表示してください。",
            ["visible label", "instructions", "required field", "input format", "Labels or Instructions", "ラベル", "入力説明", "必須項目"]),
        new(
            "4.1.2",
            "名前・役割・値",
            "フォームの入力欄に、支援技術が読み取れるアクセシブルネームがありません。",
            "表示される <label> の for 属性と入力欄の id 属性を一致させ、ラベルを関連付けてください。",
            ["accessible name", "programmatic label", "unlabeled input", "name role value", "Name, Role, Value", "アクセシブルネーム", "ラベルのない入力欄", "名前・役割・値"])
    ];
}

public sealed record AccessibilityRule(
    string Criterion,
    string Title,
    string WhenItApplies,
    string Recommendation,
    string[] Keywords);