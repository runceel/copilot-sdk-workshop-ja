# ステップ 4: 承認済みの事実に基づかせる

> **所要時間:** 15 分

## 作成するもの

これまでキュレーターはモデルの記憶に基づいて文章を書いていました。博物館では、それは許容できません。
展示ラベルは組織としての表明であり、「モデルが知っていた」は出典にはならないからです。

このステップでは、教育担当者が事実を提供し、**アプリケーション**が自身の管理するツールを通じて
キュレーターに渡します。用意済みの `approved_fact_lookup` ツールを登録し、モデルが呼び出せる
唯一のツールに設定して、文章を書く前に必ず呼び出すよう指示するプロンプトを記述します。
また、教育担当者が 3 つの承認済み事実セットから選ぶか、自分で入力できるようにします。

## 事実をプロンプト内ではなくツール経由で提供する理由

事実の一覧をプロンプトに貼り付けることもできます。多くのアプリケーションがそうしています。しかし、その場合、
事実はモデルが曖昧に解釈できる要求文の一部にすぎず、モデルが必要としているかどうかにかかわらず、
毎回カタログ全体を送ることになります。

[**ローカルツール**](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md#how-tools-work)は
異なります。自分のプロセス内で動作し、返す内容を自分のコードで決め、モデルが要求した時点が
会話履歴に記録されます。`approved_fact_lookup` がそのツールです。引数を
取らず、制限を適用した承認済み事実の一覧を返すため、同じ事実セットで 2 回実行すれば、同じ
質問に同じ答えが返ります。根拠となる情報の提供は決定論的なままです。

ヘルパーには、ツールと制限がすでに用意されています。`boundFacts` は各事実の前後の空白を除去し、空の項目を取り除きます。
一覧が空、20 件超、または 500 文字を超える事実を含む場合は、一括して拒否します。
ツールのファクトリは渡された内容すべてにこの制限を適用するため、モデルに無制限の一覧が
渡ることはありません。制限は単なる配慮ではありません。無制限の事実一覧は、コスト、待ち時間、
攻撃対象領域を予測できないものにします。

このツールに `skip permission` が設定されているのは、教育担当者が画面上で承認したばかりの、
アプリケーション管理下のデータを読むだけだからです。一方、ステップ 7 の外部 Wikipedia プロセスには
権限の境界を設けます。

これは、アクセシビリティトラックの `accessibility_rule_lookup` に相当する博物館向けの仕組みです。
引数を取らない、アプリケーション管理下のローカルツールが、ほかの方法では取得できない
精選されたデータをモデルに渡します。

## 2 つのリスト、2 つの異なる役割

ツールの登録には 2 つの設定が必要です。この 2 つの混同は、このワークショップで
最もよくある間違いです。

- **`tools`** は*実装*を渡します。ランタイムはここで、
  `approved_fact_lookup` という関数の存在と実行方法を知ります。
- **`availableTools`** は*許可リスト*です。このセッションでモデルが呼び出せる
  ツールを名前で指定します。登録済みでも許可リストにないツールは呼び出せません。

両方が必要です。ステップ 5 では許可リストを再び取り上げ、何を防ぐのかを確認します。

プロンプトは 3 つ目の要素で、最も弱いものです。モデルにツールの呼び出しを*依頼*するだけで、
呼び出しを強制することも、阻止することもできません。「最初に
`approved_fact_lookup` を呼び出す」という明示的な指示は残してください。この段階では、
ツール呼び出しを安定して発生させ、目で確認することが大切です。

## ツールを登録し、プロンプトを作成する

:::language dotnet
`Program.cs` を開きます。先頭にはすでに
`using MuseumExhibitStudio.Helpers;` があるため、追加は不要です。最初の `Console.WriteLine` から
ファイル末尾までを置き換えます。

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
        Create visitor-facing exhibit text about this application's approved subject.

        Call {CuratorFacts.ApprovedFactLookupName} first. Use only the facts it returns, and
        treat them as the complete source of truth for this exhibit.

        Return exactly this structure:

        # <an engaging exhibit title>
        ## Narrative
        <100-140 words, excluding the title and questions>
        ## Visitor questions
        1. <question>
        2. <question>
        3. <question>

        Write exactly three distinct visitor reflection questions. Do not add a preface,
        conclusion, software discussion, or facts the tool did not return.
        """;
}
```

ローカル関数はトップレベルステートメントの後に置きます。`BuildExhibitPrompt` は事実を受け取らず、
代わりにツール名を指定します。`CreateApprovedFactLookup` が内部で `BoundFacts` を呼び出すため、
誰がツールを作成しても制限が適用されます。

**内部を確認:** これらはすべて `Helpers/CuratorFacts.cs` にあります。単なる補助処理ではなく、
実際のツール定義なので、読む価値があります。`CreateApprovedFactLookup` は教育担当者が承認した、
制限適用済みの一覧をクロージャーで保持し、`CopilotTool.DefineTool` を通じて
`approved_fact_lookup` という名前で登録します。ハンドラーは引数を取らないため、モデルは返る内容を
誘導できず、要求するとその一覧をそのまま受け取ります。データがアプリケーション管理下にあるため、
ここで `SkipPermission = true` を設定しています。3 つの事実セットと、`BoundFacts` が適用する
`MaximumFactCount`（20）、`MaximumFactLength`（500）の制限も同じファイルにあります。
:::

:::language nodejs
`src/index.ts` を開き、ヘルパーのインポートを追加します。

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

システムメッセージの下に、プロンプトビルダーと事実セットの選択関数を追加します。

```typescript
function buildExhibitPrompt(): string {
  return `Create visitor-facing exhibit text about this application's approved subject.

Call ${approvedFactLookupName} first. Use only the facts it returns, and treat them as the
complete source of truth for this exhibit.

Return exactly this structure:

# <an engaging exhibit title>
## Narrative
<100-140 words, excluding the title and questions>
## Visitor questions
1. <question>
2. <question>
3. <question>

Write exactly three distinct visitor reflection questions. Do not add a preface,
conclusion, software discussion, or facts the tool did not return.`;
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

`main` を次の内容に置き換えます。

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

`buildExhibitPrompt` は事実を受け取らず、代わりにツール名を指定します。
`createApprovedFactLookup` が内部で `boundFacts` を呼び出すため、誰がツールを作成しても
制限が適用されます。

**内部を確認:** これらはすべて `src/curator.ts` にあります。単なる補助処理ではなく、実際の
`defineTool` 定義なので、読む価値があります。`createApprovedFactLookup` は教育担当者が承認した、
制限適用済みの一覧をクロージャーで保持し、`approved_fact_lookup` を
`parameters: { type: "object", properties: {}, additionalProperties: false }` で定義します。そのため、モデルは
返る内容を誘導できず、要求するとその一覧をそのまま受け取ります。データがアプリケーション管理下にあるため、
ここで `skipPermission: true` を設定しています。3 つの事実セットと、`boundFacts` が適用する
`maximumFactCount`（20）、`maximumFactLength`（500）の制限も同じファイルにあります。
:::

:::language python
`main.py` を開き、ヘルパーのインポートを追加します。

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

`SYSTEM_MESSAGE` の下にプロンプトビルダーを追加します。

```python
def build_exhibit_prompt() -> str:
    return f"""Create visitor-facing exhibit text about this application's approved subject.

Call {APPROVED_FACT_LOOKUP_NAME} first. Use only the facts it returns, and treat them as
the complete source of truth for this exhibit.

Return exactly this structure:

# <an engaging exhibit title>
## Narrative
<100-140 words, excluding the title and questions>
## Visitor questions
1. <question>
2. <question>
3. <question>

Write exactly three distinct visitor reflection questions. Do not add a preface,
conclusion, software discussion, or facts the tool did not return."""
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

`build_exhibit_prompt` は事実を受け取らず、代わりにツール名を指定します。
`create_approved_fact_lookup` が内部で `bound_facts` を呼び出すため、
誰がツールを作成しても制限が適用されます。

**内部を確認:** これらはすべて `curator.py` にあります。単なる補助処理ではなく、実際の
`@define_tool` 定義なので、読む価値があります。`create_approved_fact_lookup` は教育担当者が承認した、
制限適用済みの一覧をクロージャーで保持し、引数を取らない入れ子の `approved_fact_lookup()` に
デコレーターを適用します。そのため、モデルは返る内容を誘導できず、要求するとその
一覧をそのまま受け取ります。データがアプリケーション管理下にあるため、ここで `skip_permission=True` を設定しています。
3 つの事実セットと、`bound_facts` が適用する `MAXIMUM_FACT_COUNT`（20）、
`MAXIMUM_FACT_LENGTH`（500）の制限も同じファイルにあります。
:::

:::language go
`main.go` を開きます。インポートブロックに `"strconv"` を追加し、
システムメッセージの下にプロンプトビルダーを追加します。

```go
func buildExhibitPrompt() string {
	return fmt.Sprintf(`Create visitor-facing exhibit text about this application's approved subject.

Call %s first. Use only the facts it returns, and treat them as the complete
source of truth for this exhibit.

Return exactly this structure:

# <an engaging exhibit title>
## Narrative
<100-140 words, excluding the title and questions>
## Visitor questions
1. <question>
2. <question>
3. <question>

Write exactly three distinct visitor reflection questions. Do not add a preface,
conclusion, software discussion, or facts the tool did not return.`, ApprovedFactLookupName)
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

`buildExhibitPrompt` は事実を受け取らず、代わりにツール名を指定します。`ApprovedFactLookup` が
内部で `BoundFacts` を呼び出すため、誰がツールを作成しても制限が適用されます。

**内部を確認:** これらはすべて `curator.go` にあります。単なる補助処理ではなく、実際の
`copilot.DefineTool` 定義なので、読む価値があります。`ApprovedFactLookup` は教育担当者が承認した、
制限適用済みの一覧をクロージャーで保持し、引数の型が `struct{}` のハンドラーを定義します。そのため、
モデルは返る内容を誘導できず、要求するとその一覧をそのまま受け取ります。
データがアプリケーション管理下にあるため、ここで `lookup.SkipPermission = true` を設定しています。
3 つの事実セットと、`BoundFacts` が適用する `MaximumFactCount`（20）、
`MaximumFactLength`（500）の制限も同じファイルにあります。
:::

:::language rust
`src/main.rs` を開き、クレートのインポートを追加します。

```rust
use museum_exhibit_studio::{
    APPROVED_FACT_LOOKUP_NAME, GENERATION_TIMEOUT, RuntimeError, approved_fact_lookup, ask_line,
    ask_yes_no, bound_facts, fact_sets, read_facts, stream_exhibit,
};
```

`SYSTEM_MESSAGE` の下にプロンプトビルダーを追加します。

```rust
fn build_exhibit_prompt() -> String {
    format!(
        r#"Create visitor-facing exhibit text about this application's approved subject.

Call {APPROVED_FACT_LOOKUP_NAME} first. Use only the facts it returns, and treat them as
the complete source of truth for this exhibit.

Return exactly this structure:

# <an engaging exhibit title>
## Narrative
<100-140 words, excluding the title and questions>
## Visitor questions
1. <question>
2. <question>
3. <question>

Write exactly three distinct visitor reflection questions. Do not add a preface,
conclusion, software discussion, or facts the tool did not return."#
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

`build_exhibit_prompt` は事実を受け取らず、代わりにツール名を指定します。
`approved_fact_lookup` が内部で `bound_facts` を呼び出すため、誰がツールを作成しても
制限が適用されます。

**内部を確認:** これらはすべて `src/lib.rs` にあります。単なる補助処理ではなく、実際のツール
定義なので、読む価値があります。`approved_fact_lookup` は教育担当者が承認した、
制限適用済みの一覧をクロージャーで保持し、パラメータースキーマが
`{"type": "object", "properties": {}, "additionalProperties": false}` の `Tool` を作成します。そのため、モデルは
返る内容を誘導できず、要求するとその一覧をそのまま受け取ります。データがアプリケーション管理下にあるため、
ここで `.with_skip_permission(true)` を設定しています。3 つの事実セットと、
`bound_facts` が適用する `MAXIMUM_FACT_COUNT`（20）、`MAXIMUM_FACT_LENGTH`（500）の制限も
同じファイルにあります。
:::

:::language java
`src/main/java/workshop/MuseumExhibitStudio.java` を開きます。
インポートに `import java.util.List;` を追加し、クラスにプロンプトビルダーを追加します。

```java
    public static String buildExhibitPrompt() {
        return """
                Create visitor-facing exhibit text about this application's approved subject.

                Call %s first. Use only the facts it returns, and treat them as the
                complete source of truth for this exhibit.

                Return exactly this structure:

                # <an engaging exhibit title>
                ## Narrative
                <100-140 words, excluding the title and questions>
                ## Visitor questions
                1. <question>
                2. <question>
                3. <question>

                Write exactly three distinct visitor reflection questions. Do not add a preface,
                conclusion, software discussion, or facts the tool did not return.
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

`buildExhibitPrompt` は事実を受け取らず、代わりにツール名を指定します。`approvedFactLookup` が
内部で `boundFacts` を呼び出すため、誰がツールを作成しても制限が適用されます。

**内部を確認:** これらはすべて `CuratorFacts.java` にあります。単なる補助処理ではなく、
実際の `ToolDefinition` なので、読む価値があります。`approvedFactLookup` は、教育担当者が承認した
制限適用済みの一覧を使って非公開の `ApprovedFactReader` を作成し、その引数なしの
`read` メソッドをバインドします。そのため、モデルは返る内容を誘導できず、要求するとその
一覧をそのまま受け取ります。データがアプリケーション管理下にあるため、ここで `.skipPermission(true)` を設定しています。
3 つの事実セットと、`boundFacts` が適用する `MAXIMUM_FACT_COUNT`（20）、
`MAXIMUM_FACT_LENGTH`（500）の制限も同じファイルにあります。
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

アプリケーションは文章を書く前に質問するようになりました。また、キュレーターが文章を書く前に
事実を取得する様子を確認できます。

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

`[tool:start] approved_fact_lookup` の行こそ、このステップの要点です。キュレーターはサンゴ礁の知識を
思い出したのではなく、アプリケーションに事実を要求し、アプリケーションが答えました。

## ツールが機能していることを確かめる

再実行してセット 1 または 3 を選びます。展示の主題が完全に変わり、毎回ツールイベントが
表示されます。実行の間でプロンプトは何も変わっていません。同じプロンプトから
兵馬俑の展示文が生成されたのは、ツールが別のデータを返したからです。これが、
データを運ぶプロンプトと、データを管理するアプリケーションの違いです。

次に確認で `n` と答え、自分で事実を 2、3 件入力し、空行を送信します。
キュレーターは自分の主題について書くようになります。入力した事実がツールに渡され、
ツールがそれをモデルに返したからです。

失敗するケースも試してください。`n` と答え、事実を入力せずにすぐ空行を送信します。
`Provide at least one approved fact.` と表示され、実行が停止します。ツールのファクトリが
空の一覧での作成を拒否したため、要求は一度も送信されていません。ステップ 5 では、この異常終了を
わかりやすいエラーメッセージに変えます。

## 理解度を確認する

- ツールを 2 か所に登録しました。`approved_fact_lookup` をツールリストに入れても、
  許可リストから外した場合はどうなるでしょうか?
- プロンプトには「最初に `approved_fact_lookup` を呼び出す」とあります。この文は呼び出しを
  保証しますか? このステップのどの設定によって、そもそもツールを呼び出し*可能*にしたのでしょうか?
- ツールは引数を取らず、同じ事実セットには常に同じ制限適用済みの一覧を返します。
  代わりに自由記述の検索引数を受け取るようにすると、何が失われるでしょうか?
- 出力構成はプロンプトで要求しています。ここまでで、モデルが実際に
  その構成に従ったことを検証しているものは何ですか?

## さらに学ぶ

- [フックの使い方](https://github.com/github/copilot-sdk/blob/main/docs/features/hooks.md):
  各ツール呼び出しの前後にランタイムが呼び出すコールバックで、コード側の監査やポリシーに利用できます。
- [ツール使用後フック](https://github.com/github/copilot-sdk/blob/main/docs/hooks/post-tool-use.md):
  モデルが読む前に、ツールの戻り値を確認または書き換える方法です。
- [コンテキストのクリアと終了ツール](https://github.com/github/copilot-sdk/blob/main/docs/features/context-management.md):
  ツールが会話そのものにできることと、多くのツールがそれを行うべきでない理由を説明しています。

次は[ガードレールを設定する](museum-05-guardrails.md)に進みます。
