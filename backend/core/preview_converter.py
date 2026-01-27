import html
import logging
import traceback
from docx import Document
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.oxml.text.paragraph import CT_P
from docx.text.paragraph import Paragraph
from docx.oxml.table import CT_Tbl
from docx.table import Table

# Configure logger
logger = logging.getLogger(__name__)


class DocxPreviewConverter:
    """
    Converts a DOCX file to a simplified HTML representation for preview purposes.
    """

    def convert_to_html(self, docx_path, fixes=None):
        try:
            doc = Document(docx_path)
            html_parts = ['<div class="docx-preview">']

            # Map fixes to indices for O(1) lookup
            para_map = {}
            table_map = {}

            if fixes:
                for fix in fixes:
                    rule_id = fix.get("rule_id", "unknown")
                    desc = fix.get("description", "")

                    # Map paragraph indices
                    if "paragraph_indices" in fix:
                        for idx in fix["paragraph_indices"]:
                            if idx not in para_map:
                                para_map[idx] = []
                            para_map[idx].append({"rule": rule_id, "desc": desc})

                    # Map table indices
                    if "table_indices" in fix:
                        for idx in fix["table_indices"]:
                            if idx not in table_map:
                                table_map[idx] = []
                            table_map[idx].append({"rule": rule_id, "desc": desc})

            # Simple styles
            html_parts.append(
                """
            <style>
                .docx-preview { font-family: 'Calibri', 'Arial', sans-serif; padding: 20px; line-height: 1.5; color: #000; background: #fff; }
                .docx-preview p { margin-bottom: 10pt; }
                .docx-preview table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
                .docx-preview td, .docx-preview th { border: 1px solid #ddd; padding: 8px; }
                .docx-preview h1 { font-size: 24pt; font-weight: bold; }
                .docx-preview h2 { font-size: 18pt; font-weight: bold; }
                .docx-preview h3 { font-size: 14pt; font-weight: bold; }
                .highlight-fix {
                    background-color: rgba(34, 197, 94, 0.1);
                    border-left: 3px solid #22c55e;
                    padding-left: 8px;
                    position: relative;
                }
                .highlight-fix:hover::after {
                    content: attr(title);
                    position: absolute;
                    left: 0;
                    top: -24px;
                    background: #333;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10;
                    pointer-events: none;
                }
            </style>
            """
            )

            # Process paragraphs and tables in order
            parent = doc._body

            para_index = 0
            table_index = 0

            for child in parent._element:
                if isinstance(child, CT_P):
                    para = Paragraph(child, parent)
                    # Check for fixes
                    fix_info = para_map.get(para_index)
                    html_parts.append(
                        self._convert_paragraph(para, para_index, fix_info)
                    )
                    para_index += 1
                elif isinstance(child, CT_Tbl):
                    table = Table(child, parent)
                    fix_info = table_map.get(table_index)
                    html_parts.append(self._convert_table(table, table_index, fix_info))
                    table_index += 1

            html_parts.append("</div>")
            return "\n".join(html_parts)

        except Exception as e:
            logger.error(f"Preview generation error: {traceback.format_exc()}")
            return f"<div class='error'>Error generating preview: {str(e)}</div>"

    def _convert_paragraph(self, para, index, fix_info=None):
        text = para.text.strip()
        if not text:
            return "<p>&nbsp;</p>"

        style_name = para.style.name if para.style else "Normal"

        # Determine tag
        tag = "p"
        if style_name.startswith("Heading 1") or style_name == "Title":
            tag = "h1"
        elif style_name.startswith("Heading 2"):
            tag = "h2"
        elif style_name.startswith("Heading 3"):
            tag = "h3"
        elif style_name.startswith("Heading 4"):
            tag = "h4"

        # inline styles
        style_attrs = []
        if para.paragraph_format.alignment == WD_PARAGRAPH_ALIGNMENT.CENTER:
            style_attrs.append("text-align: center")
        elif para.paragraph_format.alignment == WD_PARAGRAPH_ALIGNMENT.RIGHT:
            style_attrs.append("text-align: right")
        elif para.paragraph_format.alignment == WD_PARAGRAPH_ALIGNMENT.JUSTIFY:
            style_attrs.append("text-align: justify")

        style_str = f' style="{";".join(style_attrs)}"' if style_attrs else ""

        # Highlight Logic
        class_str = ""
        title_str = ""
        data_attr = ""

        if fix_info:
            class_str = ' class="highlight-fix"'
            # Combine descriptions
            desc_list = [f"[{f['rule']}] {f['desc']}" for f in fix_info]
            full_desc = "; ".join(desc_list)
            title_str = f' title="{html.escape(full_desc)}"'
            data_attr = (
                f' data-rules="{html.escape(str([f["rule"] for f in fix_info]))}"'
            )

        content = html.escape(text)

        return f"<{tag}{class_str}{style_str}{title_str}{data_attr}>{content}</{tag}>"

    def _convert_table(self, table, index, fix_info=None):
        # Highlight Logic
        class_str = ""
        title_str = ""

        if fix_info:
            class_str = ' class="dict-preview-table highlight-fix"'
            desc_list = [f"[{f['rule']}] {f['desc']}" for f in fix_info]
            full_desc = "; ".join(desc_list)
            title_str = f' title="{html.escape(full_desc)}"'
        else:
            class_str = ' class="dict-preview-table"'

        rows = []
        for row in table.rows:
            cells = []
            for cell in row.cells:
                cells.append(f"<td>{html.escape(cell.text)}</td>")
            rows.append(f"<tr>{''.join(cells)}</tr>")

        return f"<table{class_str}{title_str}>{''.join(rows)}</table>"
