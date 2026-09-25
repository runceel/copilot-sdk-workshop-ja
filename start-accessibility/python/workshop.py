from __future__ import annotations

from pathlib import Path
from urllib.parse import urlsplit

from copilot import define_tool
from copilot.rpc import PermissionDecisionApproveOnce, PermissionDecisionReject
from pydantic import BaseModel, Field

from accessibility_rule_catalog import ACCESSIBILITY_RULES

MAX_SNAPSHOT_BYTES = 1_000_000


class LookupParams(BaseModel):
    query: str = Field(description="The accessibility issue or WCAG criterion to look up.")


@define_tool(name="accessibility_rule_lookup", description="Looks up read-only WCAG guidance maintained by this application.", skip_permission=True)
def accessibility_rule_lookup(params: LookupParams) -> dict[str, object]:
    query = params.query.strip().lower()
    rule = next((item for item in ACCESSIBILITY_RULES if item.criterion.lower() in query or item.title.lower() in query or any(keyword in query for keyword in item.keywords)), None)
    if rule is None:
        return {"criterion": "No exact match", "title": "Criterion not found", "when_it_applies": "The issue is not represented in the workshop catalog.", "recommendation": "Verify the evidence and consult the complete WCAG reference."}
    return rule.__dict__


def create_snapshot_reader(working_directory: str):
    output_directory = Path(working_directory, ".playwright-mcp").resolve()
    existing = {path.resolve() for path in output_directory.glob("page-*.yml")} if output_directory.is_dir() else set()

    @define_tool(name="read_latest_accessibility_snapshot", description="Reads the newest Playwright accessibility snapshot created during this run.", skip_permission=True)
    def read_latest_accessibility_snapshot() -> str:
        candidates = [path for path in output_directory.glob("page-*.yml") if path.resolve() not in existing and not path.is_symlink() and path.is_file() and 0 < path.stat().st_size <= MAX_SNAPSHOT_BYTES]
        if not candidates:
            raise FileNotFoundError("No current-run Playwright snapshot is available. Call browser_navigate first.")
        return max(candidates, key=lambda path: path.stat().st_mtime).read_text(encoding="utf-8")

    return read_latest_accessibility_snapshot


def permission_for_target(target: str):
    def handler(request, _invocation):
        if getattr(request, "kind", None) == "mcp" and request.server_name == "playwright" and request.tool_name in {"browser_navigate", "playwright-browser_navigate"} and isinstance(request.args, dict) and isinstance(request.args.get("url"), str) and _same_url(request.args["url"], target):
            return PermissionDecisionApproveOnce()
        return PermissionDecisionReject(feedback="This workshop allows Playwright to navigate only to the exact requested target.")
    return handler


def _same_url(requested: str, allowed: str) -> bool:
    try:
        left, right = urlsplit(requested), urlsplit(allowed)
        return (left.scheme.lower(), left.hostname.lower() if left.hostname else "", left.port, left.username, left.password, left.path, left.query, left.fragment) == (right.scheme.lower(), right.hostname.lower() if right.hostname else "", right.port, right.username, right.password, right.path, right.query, right.fragment)
    except ValueError:
        return False


def report_prompt(target: str) -> str:
    return f"""次の URL を対象に、根拠に基づくアクセシビリティレビューを作成してください:  {target}.
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
根拠を捏造したり、裏付けのない統計を報告したり、このページが WCAG に適合していると断定したりしないでください。"""
