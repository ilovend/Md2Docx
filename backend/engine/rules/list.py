import re
from typing import Dict, Any, List
from docx import Document
from backend.engine.base import BaseRule
from backend.engine.registry import registry


class ListNumberingRule(BaseRule):
    id = "list_numbering"
    name = "列表编号规则"
    category = "list"
    description = "将形如 '1.' 或 '-' 开头的段落规范为 Word 列表样式。"
    priority = 55

    def get_default_params(self) -> Dict[str, Any]:
        return {}

    def apply(self, doc: Document, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        fixes: List[Dict[str, Any]] = []
        affected: List[int] = []

        for i, para in enumerate(doc.paragraphs):
            before_text = para.text
            text = before_text.strip()
            if not text:
                continue

            ordered_match = re.match(r"^(\d+)\.\s+(.+)$", text)
            unordered_match = re.match(r"^[-*+]\s+(.+)$", text)

            if ordered_match:
                content = ordered_match.group(2)
                try:
                    para.style = "List Number"
                except Exception:
                    pass
                para.text = content
                affected.append(i)
            elif unordered_match:
                content = unordered_match.group(1)
                try:
                    para.style = "List Bullet"
                except Exception:
                    pass
                para.text = content
                affected.append(i)
            else:
                continue

            after_text = para.text
            fixes.append(
                {
                    "id": f"fix_list_numbering_{i}",
                    "rule_id": self.id,
                    "description": "已规范列表项",
                    "paragraph_indices": [i],
                    "before": before_text,
                    "after": after_text,
                    "location": {"type": "list_item", "paragraph_index": i},
                }
            )

        if affected:
            fixes.insert(
                0,
                {
                    "id": "fix_list_numbering_summary",
                    "rule_id": self.id,
                    "description": f"已规范 {len(affected)} 个列表项",
                    "paragraph_indices": affected,
                    "before": None,
                    "after": None,
                    "location": {
                        "type": "list_numbering",
                        "affected_count": len(affected),
                    },
                },
            )

        return fixes


registry.register(ListNumberingRule())
