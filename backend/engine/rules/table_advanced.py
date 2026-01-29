from typing import Dict, Any, List
from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from backend.engine.base import BaseRule
from backend.engine.registry import registry


class TableRepeatHeaderRule(BaseRule):
    id = "table_repeat_header"
    name = "表格跨页表头重复规则"
    category = "table"
    description = "设置表格在跨页时重复显示表头行。"
    priority = 95

    def get_default_params(self) -> Dict[str, Any]:
        return {"header_rows": 1}

    def _set_repeat_header_rows(self, table, num_rows: int = 1):
        """
        设置表格的表头行在跨页时重复显示
        """
        if len(table.rows) < num_rows:
            return False

        for i in range(num_rows):
            row = table.rows[i]
            tr = row._tr

            # 设置表头行属性
            trPr = tr.get_or_add_trPr()

            # 添加 tblHeader 元素，表示这是表头行
            tblHeader = OxmlElement("w:tblHeader")
            tblHeader.set(qn("w:val"), "true")

            # 检查是否已存在 tblHeader 元素
            existing = trPr.find(qn("w:tblHeader"))
            if existing is not None:
                trPr.remove(existing)

            trPr.append(tblHeader)

        return True

    def apply(self, doc: Document, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        fixes = []
        defaults = self.get_default_params()
        header_rows = params.get("header_rows", defaults["header_rows"])

        for i, table in enumerate(doc.tables):
            # 检查表格是否有足够的行
            if len(table.rows) <= header_rows:
                continue

            # 检查是否已经设置了表头重复
            first_row = table.rows[0]
            tr = first_row._tr
            trPr = tr.get_or_add_trPr()
            existing_header = trPr.find(qn("w:tblHeader"))

            if existing_header is None:
                # 设置表头重复
                success = self._set_repeat_header_rows(table, header_rows)

                if success:
                    fixes.append(
                        {
                            "id": f"fix_table_repeat_header_{i}",
                            "rule_id": self.id,
                            "description": f"已为第 {i+1} 个表格设置跨页表头重复（前 {header_rows} 行）",
                            "table_indices": [i],
                            "before": "未设置表头重复",
                            "after": f"表头重复（{header_rows}行）",
                            "location": {
                                "table_index": i,
                                "type": "table_header_repeat",
                                "header_rows": header_rows,
                            },
                        }
                    )

        return fixes


# 注册规则
registry.register(TableRepeatHeaderRule())
