# ステップ 4: 承認済みファクトに基づかせる

> **所要時間:** 15 分

## 作るもの

これまでキュレーターはモデルの記憶をもとに文章を書いてきました。しかし博物館ではそれは許容されません。展示ラベルは組織としての主張であり、「モデルが知っていた」ことは出典にはならないからです。

このステップでは、教育者がファクトを提供し、**アプリケーション**が自身の所有するツールを通じてそれをキュレーターに渡します。あらかじめ用意された `approved_fact_lookup` ツールを登録し、それをモデルが呼び出せる唯一のツールにして、キュレーターに一言書く前に必ず呼び出すよう命じるプロンプトを書きます。また、教育者が 3 つの承認済みファクトセットのいずれかを選ぶか、自分で入力できるようにします。

## なぜファクトはプロンプトの中ではなくツールの背後に置くのか

ファクトのリストをプロンプトのテキストに貼り付けることもできます。多くのアプリケーションがそうしています。しかしそうすると、ファクトはモデルが自由にゆるく読める、リクエスト内の単なる余分な語句にすぎなくなり、モデルが必要とするかどうかにかかわらず、毎回の実行がカタログ全体を運ぶことになります。

[**ローカルツール**](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md#how-tools-work)は違います。それはあなたのプロセス内で動作し、何を返すかはあなたのコードが決め、モデルがそれを求めた瞬間がトランスクリプトに記録されます。`approved_fact_lookup` がそのツールです。引数を取らず、境界の設けられた承認済みファクトのリストを返すため、同じファクトセットに対する 2 回の実行は同じ問いを発し、同じ答えを得ます。つまり、根拠付けが決定論的に保たれます。

ヘルパーはすでにこのツールと境界を所有しています。`boundFacts` はすべてのファクトをトリムし、空白を取り除き、そのバッチが空、または 20 件を超える、あるいは 500 文字を超えるファクトを含む場合は拒否します。ツールファクトリーは与えられたものにその境界を適用するため、モデルに境界のないリストが渡されることは決してありません。境界は礼儀ではありません。境界のないファクトリストは、予測不能なコスト、レイテンシー、そして攻撃対象領域を意味します。

このツールには `skip permission` が設定されています。教育者が画面上で承認したばかりの、アプリケーションが所有するデータを読み取るだけだからです。ステップ 7 の外部 Wikipedia プロセスには、代わりにパーミッションの境界が設けられます。

これは、アクセシビリティトラックにおける `accessibility_rule_lookup` の博物館版です。引数を取らず、アプリケーションが所有するローカルツールが 1 つあり、モデルが他の手段では到達できないキュレーション済みのデータを渡します。

## 2 つのリスト、2 つの異なる役割

ツールの登録には 2 つの設定が必要で、それらを混同することがこのワークショップで最もよくある間違いです。

- **`tools`** は*実装*を運びます。ここで、ランタイムは `approved_fact_lookup` という関数が存在することと、それをどう実行するかを学びます。
- **`availableTools`** は*許可リスト*です。このセッションでモデルが呼び出すことを許可されているツールを指定します。登録されていても許可リストにないツールは呼び出せません。

両方が必要です。ステップ 5 では許可リストに立ち返り、それが何を防ぐのかを示します。

プロンプトは 3 つ目の要素であり、最も弱いものです。それはモデルにツールを呼び出すよう*お願いする*だけです。呼び出しを実際に起こさせるわけでも、呼び出しを止められるわけでもありません。明示的な「まず `approved_fact_lookup` を呼び出す」という指示はそのまま残してください。この段階では、ツール呼び出しが確実に行われて目に見えるようにしたいからです。

## ツールを登録してプロンプトを組み立てる

:::language dotnet
`Program.cs` を開きます。冒頭では何も広げません。すでに `using MuseumExhibitStudio.Helpers;` があります。最初の `Console.WriteLine` からファイル末尾までのすべてを置き換えます。

```csharp
Console.WriteLine("=== Museum Exhibit Studio ===");
Console.WriteLine();
Console.WriteLine("Approved fact sets:");
for (var index = 0; index < CuratorFacts.FactSets.Count; index++)
{
    Console.WriteLine($"{index + 1}. {CuratorFacts.FactSets[index].Label}");
}

Console.WriteLine();

var selectedFactSet = ReadFactSetSelection();
var approvedFacts = CuratorFacts.BoundFacts(selectedFactSet.Facts);
for (var index = 0; index < approvedFacts.Length; index++)
{
    Console.WriteLine($"{index + 1}. {approvedFacts[index]}");
}

Console.WriteLine();

if (!CuratorTerminal.AskYesNo("Use these facts?", defaultYes: true))
{
    approvedFacts = CuratorFacts.BoundFacts(CuratorTerminal.ReadFacts());
}

Console.WriteLine();

await using var client = new CopilotClient();
await client.StartAsync();

await using var session = await client.CreateSessionAsync(new SessionConfig
{
    ClientName = "museum-exhibit-studio",
    OnPermissionRequest = PermissionHandler.ApproveAll,
    Streaming = true,
    Tools = [CuratorFacts.CreateApprovedFactLookup(approvedFacts)],
    AvailableTools = [CuratorFacts.ApprovedFactLookupName],
    SystemMessage = new SystemMessageConfig
    {
        Mode = SystemMessageMode.Replace,
        Content = SystemMessage
    }
});

await CuratorStreamer.StreamExhibitAsync(session, BuildExhibitPrompt());

await client.StopAsync();
CuratorTerminal.CloseTerminal();

CuratorFactSet ReadFactSetSelection()
{
    var input = CuratorTerminal.AskLine("Choose a fact set [1-3, default 1]: ");
    if (int.TryParse(input, out var selection) &&
        selection >= 1 &&
        selection <= CuratorFacts.FactSets.Count)
    {
        return CuratorFacts.FactSets[selection - 1];
    }

    return CuratorFacts.FactSets[0];
}

static string BuildExhibitPrompt()
{
    return $"""
        このアプリケーションで承認された対象について、来館者向けの展示文を作成してください。

        最初に {CuratorFacts.ApprovedFactLookupName} を呼び出してください。 返された事実だけを使い、この展示に関する完全な根拠として扱ってください。

        次の構成を厳密に守ってください:

        # <魅力的な展示タイトル>
        ## Narrative
        <タイトルと質問を除いて 100〜140 語>
        ## Visitor questions
        1. <質問>
        2. <質問>
        3. <質問>

        来館者が考えるための異なる質問を、必ず 3 つ作成してください。 前置き、結論、ソフトウェアに関する説明、ツールが返していない事実を追加しないでください。
        """;
}
```


ローカル関数はトップレベルのステートメントの後に来ます。`BuildExhibitPrompt` はもはやファクトをまったく受け取りません。代わりにツールの名前を指定します。`CreateApprovedFactLookup` は内部で `BoundFacts` を呼び出すため、誰がツールを組み立てても境界は保たれます。

**中を覗いてみましょう:** `Helpers/CuratorFacts.cs` にこれらすべてが入っており、これは配管ではなく本物のツール定義なので読む価値があります。`CreateApprovedFactLookup` は教育者が承認したばかりの境界付きリストをクロージャで取り込み、それを `CopilotTool.DefineTool` を通じて `approved_fact_lookup` という名前で登録します。ハンドラーはパラメーターを取らないため、モデルは返ってくるものを操作できません。求めれば、まさにそのリストを受け取ります。データがアプリケーション所有であるため、`SkipPermission = true` がまさにそこに設定されています。3 つのファクトセットと、`BoundFacts` が強制する `MaximumFactCount`（20）および `MaximumFactLength`（500）の境界は、同じファイルにあります。
:::

:::language nodejs
`src/index.ts` を開き、ヘルパーのインポートを広げます。

```typescript
import {
  approvedFactLookupName,
  askLine,
  askYesNo,
  boundFacts,
  closeTerminal,
  createApprovedFactLookup,
  factSets,
  readFacts,
  streamExhibit,
} from "./curator.js";
```

プロンプトビルダーとファクトセットの選択機能を、システムメッセージの下に追加します。

```typescript
function buildExhibitPrompt(): string {
  return `このアプリケーションで承認された対象について、来館者向けの展示文を作成してください。

最初に ${approvedFactLookupName} を呼び出してください。 返された事実だけを使い、この展示に関する完全な根拠として扱ってください。

次の構成を厳密に守ってください:

# <魅力的な展示タイトル>
## Narrative
<タイトルと質問を除いて 100〜140 語>
## Visitor questions
1. <質問>
2. <質問>
3. <質問>

来館者が考えるための異なる質問を、必ず 3 つ作成してください。 前置き、結論、ソフトウェアに関する説明、ツールが返していない事実を追加しないでください。`;
}

async function chooseFactSet(): Promise<(typeof factSets)[number]> {
  const answer = await askLine("Choose a fact set [1-3, default 1]: ");
  const choice = Number.parseInt(answer, 10);
  if (Number.isInteger(choice) && choice >= 1 && choice <= factSets.length) {
    return factSets[choice - 1] ?? factSets[0];
  }
  return factSets[0];
}
```


`main` を次のように置き換えます。

```typescript
async function main(): Promise<void> {
  console.log("=== Museum Exhibit Studio ===");
  console.log();
  console.log("Approved fact sets:");
  factSets.forEach((factSet, index) => console.log(`${index + 1}. ${factSet.label}`));
  console.log();

  const chosenSet = await chooseFactSet();
  let approvedFacts = boundFacts(chosenSet.facts);
  approvedFacts.forEach((fact, index) => console.log(`${index + 1}. ${fact}`));
  console.log();

  if (!(await askYesNo("Use these facts?", true))) {
    approvedFacts = boundFacts(await readFacts());
  }

  console.log();
  const client = new CopilotClient();
  await client.start();
  const session = await client.createSession({
    clientName: "museum-exhibit-studio",
    onPermissionRequest: approveAll,
    streaming: true,
    tools: [createApprovedFactLookup(approvedFacts)],
    availableTools: [approvedFactLookupName],
    systemMessage: { mode: "replace", content: systemMessage },
  });

  await streamExhibit(session, buildExhibitPrompt());

  await session.disconnect();
  await client.stop();
  closeTerminal();
}
```

`buildExhibitPrompt` はもはやファクトをまったく受け取りません。代わりにツールの名前を指定します。`createApprovedFactLookup` は内部で `boundFacts` を呼び出すため、誰がツールを組み立てても境界は保たれます。

**中を覗いてみましょう:** `src/curator.ts` にこれらすべてが入っており、これは配管ではなく本物の `defineTool` 定義なので読む価値があります。`createApprovedFactLookup` は教育者が承認したばかりの境界付きリストをクロージャで取り込み、`parameters: { type: "object", properties: {}, additionalProperties: false }` として `approved_fact_lookup` を定義するため、モデルは返ってくるものを操作できません。求めれば、まさにそのリストを受け取ります。データがアプリケーション所有であるため、`skipPermission: true` がまさにそこに設定されています。3 つのファクトセットと、`boundFacts` が強制する `maximumFactCount`（20）および `maximumFactLength`（500）の境界は、同じファイルにあります。
:::

:::language python
`main.py` を開き、ヘルパーのインポートを広げます。

```python
from curator import (
    APPROVED_FACT_LOOKUP_NAME,
    FACT_SETS,
    ask_line,
    ask_yes_no,
    bound_facts,
    create_approved_fact_lookup,
    read_facts,
    stream_exhibit,
)
```

プロンプトビルダーを `SYSTEM_MESSAGE` の下に追加します。

```python
def build_exhibit_prompt() -> str:
    return f"""このアプリケーションで承認された対象について、来館者向けの展示文を作成してください。

最初に {APPROVED_FACT_LOOKUP_NAME} を呼び出してください。 返された事実だけを使い、この展示に関する完全な根拠として扱ってください。

次の構成を厳密に守ってください:

# <魅力的な展示タイトル>
## Narrative
<タイトルと質問を除いて 100〜140 語>
## Visitor questions
1. <質問>
2. <質問>
3. <質問>

来館者が考えるための異なる質問を、必ず 3 つ作成してください。 前置き、結論、ソフトウェアに関する説明、ツールが返していない事実を追加しないでください。"""
```


`main` を置き換えます。

```python
async def main() -> None:
    print("=== Museum Exhibit Studio ===")
    print()
    print("Approved fact sets:")
    for index, fact_set in enumerate(FACT_SETS, start=1):
        print(f"{index}. {fact_set.label}")
    print()

    choice = ask_line("Choose a fact set [1-3, default 1]: ")
    selected_index = int(choice) - 1 if choice in {"1", "2", "3"} else 0
    facts = list(FACT_SETS[selected_index].facts)
    for index, fact in enumerate(facts, start=1):
        print(f"{index}. {fact}")
    print()

    if not ask_yes_no("Use these facts?", True):
        facts = read_facts()
    facts = bound_facts(facts)

    print()
    async with CopilotClient() as client:
        async with await client.create_session(
            client_name="museum-exhibit-studio",
            on_permission_request=PermissionHandler.approve_all,
            streaming=True,
            tools=[create_approved_fact_lookup(facts)],
            available_tools=[APPROVED_FACT_LOOKUP_NAME],
            system_message={"mode": "replace", "content": SYSTEM_MESSAGE},
        ) as session:
            await stream_exhibit(session, build_exhibit_prompt())
```

`build_exhibit_prompt` はもはやファクトをまったく受け取りません。代わりにツールの名前を指定します。`create_approved_fact_lookup` は内部で `bound_facts` を呼び出すため、誰がツールを組み立てても境界は保たれます。

**中を覗いてみましょう:** `curator.py` にこれらすべてが入っており、これは配管ではなく本物の `@define_tool` 定義なので読む価値があります。`create_approved_fact_lookup` は教育者が承認したばかりの境界付きリストをクロージャで取り込み、引数を取らないネストされた `approved_fact_lookup()` をデコレートするため、モデルは返ってくるものを操作できません。求めれば、まさにそのリストを受け取ります。データがアプリケーション所有であるため、`skip_permission=True` がまさにそこに設定されています。3 つのファクトセットと、`bound_facts` が強制する `MAXIMUM_FACT_COUNT`（20）および `MAXIMUM_FACT_LENGTH`（500）の境界は、同じファイルにあります。
:::

:::language go
`main.go` を開きます。インポートブロックに `"strconv"` を追加し、システムメッセージの下にプロンプトビルダーを追加します。

```go
func buildExhibitPrompt() string {
	return fmt.Sprintf(`このアプリケーションで承認された対象について、来館者向けの展示文を作成してください。

最初に %s を呼び出してください。 返された事実だけを使い、この展示に関する完全な根拠として扱ってください。

次の構成を厳密に守ってください:

# <魅力的な展示タイトル>
## Narrative
<タイトルと質問を除いて 100〜140 語>
## Visitor questions
1. <質問>
2. <質問>
3. <質問>

来館者が考えるための異なる質問を、必ず 3 つ作成してください。 前置き、結論、ソフトウェアに関する説明、ツールが返していない事実を追加しないでください。`, ApprovedFactLookupName)
}
```


`main` を置き換えます。

```go
func main() {
	fmt.Println("=== Museum Exhibit Studio ===")
	fmt.Println()
	fmt.Println("Approved fact sets:")
	for index, factSet := range FactSets {
		fmt.Printf("%d. %s\n", index+1, factSet.Label)
	}
	fmt.Println()

	choice := AskLine(fmt.Sprintf("Choose a fact set [1-%d, default 1]: ", len(FactSets)))
	selectedIndex := 0
	if parsed, err := strconv.Atoi(choice); err == nil && parsed >= 1 && parsed <= len(FactSets) {
		selectedIndex = parsed - 1
	}

	facts := append([]string(nil), FactSets[selectedIndex].Facts...)
	for index, fact := range facts {
		fmt.Printf("%d. %s\n", index+1, fact)
	}
	fmt.Println()

	if !AskYesNo("Use these facts?", true) {
		facts = ReadFacts()
	}
	facts, err := BoundFacts(facts)
	if err != nil {
		panic(err)
	}

	lookup, err := ApprovedFactLookup(facts)
	if err != nil {
		panic(err)
	}

	fmt.Println()
	ctx := context.Background()
	client := copilot.NewClient(&copilot.ClientOptions{LogLevel: "error"})
	if err := client.Start(ctx); err != nil {
		panic(err)
	}
	defer func() { _ = client.Stop() }()

	session, err := client.CreateSession(ctx, &copilot.SessionConfig{
		ClientName:          "museum-exhibit-studio",
		OnPermissionRequest: copilot.PermissionHandler.ApproveAll,
		Streaming:           copilot.Bool(true),
		Tools:               []copilot.Tool{lookup},
		AvailableTools:      []string{ApprovedFactLookupName},
		SystemMessage: &copilot.SystemMessageConfig{
			Mode:    "replace",
			Content: systemMessage,
		},
	})
	if err != nil {
		panic(err)
	}
	defer func() { _ = session.Disconnect() }()

	if _, err := StreamExhibit(session, buildExhibitPrompt(), GenerationTimeout); err != nil {
		panic(err)
	}
}
```

`buildExhibitPrompt` はもはやファクトをまったく受け取りません。代わりにツールの名前を指定します。`ApprovedFactLookup` は内部で `BoundFacts` を呼び出すため、誰がツールを組み立てても境界は保たれます。

**中を覗いてみましょう:** `curator.go` にこれらすべてが入っており、これは配管ではなく本物の `copilot.DefineTool` 定義なので読む価値があります。`ApprovedFactLookup` は教育者が承認したばかりの境界付きリストをクロージャで取り込み、引数の型が `struct{}` であるハンドラーを定義するため、モデルは返ってくるものを操作できません。求めれば、まさにそのリストを受け取ります。データがアプリケーション所有であるため、`lookup.SkipPermission = true` がまさにそこに設定されています。3 つのファクトセットと、`BoundFacts` が強制する `MaximumFactCount`（20）および `MaximumFactLength`（500）の境界は、同じファイルにあります。
:::

:::language rust
`src/main.rs` を開き、クレートのインポートを広げます。

```rust
use museum_exhibit_studio::{
    APPROVED_FACT_LOOKUP_NAME, GENERATION_TIMEOUT, RuntimeError, approved_fact_lookup, ask_line,
    ask_yes_no, bound_facts, fact_sets, read_facts, stream_exhibit,
};
```

プロンプトビルダーを `SYSTEM_MESSAGE` の下に追加します。

```rust
fn build_exhibit_prompt() -> String {
    format!(
        r#"このアプリケーションで承認された対象について、来館者向けの展示文を作成してください。

最初に {APPROVED_FACT_LOOKUP_NAME} を呼び出してください。 返された事実だけを使い、この展示に関する完全な根拠として扱ってください。

次の構成を厳密に守ってください:

# <魅力的な展示タイトル>
## Narrative
<タイトルと質問を除いて 100〜140 語>
## Visitor questions
1. <質問>
2. <質問>
3. <質問>

来館者が考えるための異なる質問を、必ず 3 つ作成してください。 前置き、結論、ソフトウェアに関する説明、ツールが返していない事実を追加しないでください。"#
    )
}
```


`main` を置き換えます。

```rust
#[tokio::main]
async fn main() -> Result<(), RuntimeError> {
    println!("=== Museum Exhibit Studio ===");
    println!();
    println!("Approved fact sets:");
    for (index, fact_set) in fact_sets().iter().enumerate() {
        println!("{}. {}", index + 1, fact_set.label);
    }
    println!();

    let choice = ask_line("Choose a fact set [1-3, default 1]: ")?;
    let selected_index = choice
        .trim()
        .parse::<usize>()
        .ok()
        .filter(|index| (1..=fact_sets().len()).contains(index))
        .unwrap_or(1)
        - 1;
    let mut facts = fact_sets()[selected_index]
        .facts
        .iter()
        .map(|fact| (*fact).to_owned())
        .collect::<Vec<_>>();
    for (index, fact) in facts.iter().enumerate() {
        println!("{}. {fact}", index + 1);
    }
    println!();

    if !ask_yes_no("Use these facts?", true)? {
        facts = read_facts()?;
    }
    let facts = bound_facts(facts)?;

    println!();
    let client = Client::start(ClientOptions::default()).await?;
    let mut config = SessionConfig::default().with_permission_handler(permission::approve_all());
    config.client_name = Some("museum-exhibit-studio".to_owned());
    config.streaming = Some(true);
    config.tools = Some(vec![approved_fact_lookup(&facts)?]);
    config.available_tools = Some(vec![APPROVED_FACT_LOOKUP_NAME.to_owned()]);
    config.system_message = Some(
        SystemMessageConfig::new()
            .with_mode("replace")
            .with_content(SYSTEM_MESSAGE),
    );
    let session = client.create_session(config).await?;

    stream_exhibit(&session, build_exhibit_prompt(), GENERATION_TIMEOUT).await?;

    session.disconnect().await?;
    client.stop().await?;
    Ok(())
}
```

`build_exhibit_prompt` はもはやファクトをまったく受け取りません。代わりにツールの名前を指定します。`approved_fact_lookup` は内部で `bound_facts` を呼び出すため、誰がツールを組み立てても境界は保たれます。

**中を覗いてみましょう:** `src/lib.rs` にこれらすべてが入っており、これは配管ではなく本物のツール定義なので読む価値があります。`approved_fact_lookup` は教育者が承認したばかりの境界付きリストをクロージャで取り込み、パラメーターのスキーマが `{"type": "object", "properties": {}, "additionalProperties": false}` である `Tool` を組み立てるため、モデルは返ってくるものを操作できません。求めれば、まさにそのリストを受け取ります。データがアプリケーション所有であるため、`.with_skip_permission(true)` がまさにそこに設定されています。3 つのファクトセットと、`bound_facts` が強制する `MAXIMUM_FACT_COUNT`（20）および `MAXIMUM_FACT_LENGTH`（500）の境界は、同じファイルにあります。
:::

:::language java
`src/main/java/workshop/MuseumExhibitStudio.java` を開きます。インポートに `import java.util.List;` を追加し、クラスにプロンプトビルダーを追加します。

```java
    public static String buildExhibitPrompt() {
        return """
                このアプリケーションで承認された対象について、来館者向けの展示文を作成してください。

                最初に %s を呼び出してください。 返された事実だけを使い、この展示に関する完全な根拠として扱ってください。

                次の構成を厳密に守ってください:

                # <魅力的な展示タイトル>
                ## Narrative
                <タイトルと質問を除いて 100〜140 語>
                ## Visitor questions
                1. <質問>
                2. <質問>
                3. <質問>

                来館者が考えるための異なる質問を、必ず 3 つ作成してください。 前置き、結論、ソフトウェアに関する説明、ツールが返していない事実を追加しないでください。
                """.formatted(CuratorFacts.APPROVED_FACT_LOOKUP_NAME);
    }

    private static CuratorFacts.FactSet selectFactSet(String input) {
        if (input != null && !input.isBlank()) {
            try {
                int selected = Integer.parseInt(input.trim());
                if (selected >= 1 && selected <= CuratorFacts.factSets.size()) {
                    return CuratorFacts.factSets.get(selected - 1);
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return CuratorFacts.factSets.get(0);
    }
```


`main` を置き換えます。

```java
    public static void main(String[] args) throws Exception {
        System.out.println("=== Museum Exhibit Studio ===");
        System.out.println();
        System.out.println("Approved fact sets:");
        for (int index = 0; index < CuratorFacts.factSets.size(); index++) {
            System.out.printf("%d. %s%n", index + 1, CuratorFacts.factSets.get(index).label());
        }
        System.out.println();

        CuratorFacts.FactSet selected =
                selectFactSet(CuratorTerminal.askLine("Choose a fact set [1-3, default 1]: "));
        List<String> facts = selected.facts();
        for (int index = 0; index < facts.size(); index++) {
            System.out.printf("%d. %s%n", index + 1, facts.get(index));
        }
        System.out.println();

        if (!CuratorTerminal.askYesNo("Use these facts?", true)) {
            facts = CuratorTerminal.readFacts();
        }
        facts = CuratorFacts.boundFacts(facts);

        System.out.println();
        try (var client = new CopilotClient()) {
            client.start().get();
            var session = client.createSession(new SessionConfig()
                    .setClientName("museum-exhibit-studio")
                    .setOnPermissionRequest(PermissionHandler.APPROVE_ALL)
                    .setStreaming(true)
                    .setTools(List.of(CuratorFacts.approvedFactLookup(facts)))
                    .setAvailableTools(List.of(CuratorFacts.APPROVED_FACT_LOOKUP_NAME))
                    .setSystemMessage(new SystemMessageConfig()
                            .setMode(SystemMessageMode.REPLACE)
                            .setContent(SYSTEM_MESSAGE))).get();
            try {
                CuratorStreamer.streamExhibit(session, buildExhibitPrompt());
            } finally {
                session.close();
                client.stop().get();
            }
        } finally {
            CuratorTerminal.close();
        }
    }
```

`buildExhibitPrompt` はもはやファクトをまったく受け取りません。代わりにツールの名前を指定します。`approvedFactLookup` は内部で `boundFacts` を呼び出すため、誰がツールを組み立てても境界は保たれます。

**中を覗いてみましょう:** `CuratorFacts.java` にこれらすべてが入っており、これは配管ではなく本物の `ToolDefinition` なので読む価値があります。`approvedFactLookup` は教育者が承認したばかりの境界付きリストの上にプライベートな `ApprovedFactReader` を構築し、その引数なしの `read` メソッドをバインドするため、モデルは返ってくるものを操作できません。求めれば、まさにそのリストを受け取ります。データがアプリケーション所有であるため、`.skipPermission(true)` がまさにそこに設定されています。3 つのファクトセットと、`boundFacts` が強制する `MAXIMUM_FACT_COUNT`（20）および `MAXIMUM_FACT_LENGTH`（500）の境界は、同じファイルにあります。
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

アプリケーションは、何かを書く前にあなたにインタビューするようになり、キュレーターは一言書く前に、目に見える形でファクトを取得します。

```text
=== Museum Exhibit Studio ===

Approved fact sets:
1. Apollo 11
2. Great Barrier Reef
3. Terracotta Army

Choose a fact set [1-3, default 1]: 2
1. The Great Barrier Reef lies off the coast of Queensland, Australia.
2. It stretches for about 2,300 kilometres.
3. It is made up of more than 2,900 individual reefs.
4. It was added to the UNESCO World Heritage List in 1981.
5. Rising sea temperatures have caused repeated coral bleaching events.

Use these facts? [Y/n]: y

[tool:start] approved_fact_lookup
[tool:done] success=true

# A Reef the Size of a Country
## Narrative
Off the Queensland coast, more than two thousand nine hundred reefs...
## Visitor questions
1. ...
```

> **日本語補足（出力例）:** この出力例は、承認済みファクトの選択後に `approved_fact_lookup` が呼ばれ、そのファクトに基づくタイトル、Narrative、質問が生成される流れを示しています。`[tool:start]` と `[tool:done]` が見えれば、ツール経由の根拠付けが成功しています。

`[tool:start] approved_fact_lookup` の行が、このステップの肝心な点です。キュレーターはリーフを思い出したのではありません。あなたのアプリケーションにファクトを求め、あなたのアプリケーションが答えたのです。

## ツールが仕事をしていることを証明する

もう一度実行し、セット 1 か 3 を選びます。展示の主題がまったく変わり、ツールイベントも毎回再び現れます。これらの実行の間、プロンプトは何も変わっていません。同じプロンプトテキストが兵馬俑の展示を生み出したのは、ツールが異なるデータを返したからです。これが、データを運ぶプロンプトと、それを所有するアプリケーションとの違いです。

次に、確認で `n` と答え、自分でファクトを 2 つか 3 つ入力し、空行を送信します。キュレーターは代わりにあなたの主題について書きます。あなたが入力したファクトがツールに入り、ツールがそれをモデルに渡し返したのです。

失敗のケースも試してみましょう。`n` と答え、ファクトを何も入力せずにすぐ空行を送信します。実行は `Provide at least one approved fact.` で停止します。ツールファクトリーが空のリストの周りに構築されることを拒否したため、リクエストは一切送信されませんでした。ステップ 5 では、そのクラッシュを丁寧なエラーメッセージに変えます。

## 理解度チェック

- ツールを 2 か所に登録しました。`approved_fact_lookup` をツールリストに入れつつ、許可リストから外したらどうなるでしょうか。
- プロンプトには「まず `approved_fact_lookup` を呼び出す」と書かれています。その一文は呼び出しが行われることを保証するでしょうか。このステップで、そもそもツールを呼び出し*可能*にしたのは何でしょうか。
- ツールは引数を取らず、あるファクトセットに対しては常に同じ境界付きリストを返します。代わりに自由記述のクエリ引数を取るようにしたら、何が失われるでしょうか。
- 出力構造はプロンプトで要求されています。モデルが実際にそれに従ったことを、これまで何が検証しているでしょうか。

## 参考資料

- [Working with hooks](https://github.com/github/copilot-sdk/blob/main/docs/features/hooks.md): ツール呼び出しの前後に処理を実行し、監査ログや独自のポリシーを実装する方法です。
- [Post-tool-use hook](https://github.com/github/copilot-sdk/blob/main/docs/hooks/post-tool-use.md): ツールの実行結果を、モデルに返す前に確認したり書き換えたりできます。
- [Context clearing and terminal tools](https://github.com/github/copilot-sdk/blob/main/docs/features/context-management.md): 会話履歴を変更する機能をツールに持たせる場合の注意点と、通常はそうすべきでない理由を説明しています。

[ガードレールを設定する](museum-05-guardrails.md)に進みます。
