from typing import Dict, Any, List
from docx import Document
from docx.shared import Cm
from backend.engine.base import BaseRule
from backend.engine.registry import registry


class PageLayoutRule(BaseRule):
    id = "page_layout"
    name = "页面布局规则"
    category = "page"
    description = "设置页面尺寸与页边距。"
    priority = 5

    def get_default_params(self) -> Dict[str, Any]:
        return {
            "page_width_cm": 21.0,
            "page_height_cm": 29.7,
            "page_margin_top_cm": 2.54,
            "page_margin_bottom_cm": 2.54,
            "page_margin_left_cm": 2.54,
            "page_margin_right_cm": 2.54,
        }

    def apply(self, doc: Document, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        defaults = self.get_default_params()
        page_width_cm = float(params.get("page_width_cm", defaults["page_width_cm"]))
        page_height_cm = float(params.get("page_height_cm", defaults["page_height_cm"]))
        margin_top_cm = float(
            params.get("page_margin_top_cm", defaults["page_margin_top_cm"])
        )
        margin_bottom_cm = float(
            params.get("page_margin_bottom_cm", defaults["page_margin_bottom_cm"])
        )
        margin_left_cm = float(
            params.get("page_margin_left_cm", defaults["page_margin_left_cm"])
        )
        margin_right_cm = float(
            params.get("page_margin_right_cm", defaults["page_margin_right_cm"])
        )

        fixes: List[Dict[str, Any]] = []
        if not doc.sections:
            return fixes

        section = doc.sections[0]
        before = {
            "page_width_cm": getattr(section.page_width, "cm", None),
            "page_height_cm": getattr(section.page_height, "cm", None),
            "margin_top_cm": getattr(section.top_margin, "cm", None),
            "margin_bottom_cm": getattr(section.bottom_margin, "cm", None),
            "margin_left_cm": getattr(section.left_margin, "cm", None),
            "margin_right_cm": getattr(section.right_margin, "cm", None),
        }

        section.page_width = Cm(page_width_cm)
        section.page_height = Cm(page_height_cm)
        section.top_margin = Cm(margin_top_cm)
        section.bottom_margin = Cm(margin_bottom_cm)
        section.left_margin = Cm(margin_left_cm)
        section.right_margin = Cm(margin_right_cm)

        after = {
            "page_width_cm": page_width_cm,
            "page_height_cm": page_height_cm,
            "margin_top_cm": margin_top_cm,
            "margin_bottom_cm": margin_bottom_cm,
            "margin_left_cm": margin_left_cm,
            "margin_right_cm": margin_right_cm,
        }

        fixes.append(
            {
                "id": "fix_page_layout",
                "rule_id": self.id,
                "description": "已应用页面尺寸与页边距",
                "before": str(before),
                "after": str(after),
                "location": {"type": "page_layout", "section_index": 0},
            }
        )

        return fixes


registry.register(PageLayoutRule())
