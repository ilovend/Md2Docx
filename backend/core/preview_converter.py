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
                    fix_id = fix.get("id")

                    # Map paragraph indices
                    if "paragraph_indices" in fix:
                        for idx in fix["paragraph_indices"]:
                            if idx not in para_map:
                                para_map[idx] = []
                            para_map[idx].append(
                                {"id": fix_id, "rule": rule_id, "desc": desc}
                            )

                    # Map table indices
                    if "table_indices" in fix:
                        for idx in fix["table_indices"]:
                            if idx not in table_map:
                                table_map[idx] = []
                            table_map[idx].append(
                                {"id": fix_id, "rule": rule_id, "desc": desc}
                            )

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
                    background: linear-gradient(90deg, rgba(34, 197, 94, 0.25) 0%, rgba(34, 197, 94, 0.08) 100%);
                    border-left: 4px solid #22c55e;
                    padding-left: 12px;
                    margin-left: -12px;
                    position: relative;
                    border-radius: 0 4px 4px 0;
                    transition: all 0.2s ease;
                }
                .highlight-fix::before {
                    content: '✓';
                    position: absolute;
                    left: -24px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 18px;
                    height: 18px;
                    background: #22c55e;
                    color: white;
                    border-radius: 50%;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
                }
                .highlight-fix:hover {
                    background: linear-gradient(90deg, rgba(34, 197, 94, 0.35) 0%, rgba(34, 197, 94, 0.15) 100%);
                    box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
                }
                .highlight-fix:hover::after {
                    content: attr(title);
                    position: absolute;
                    left: 0;
                    top: -32px;
                    background: #1a1d2e;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    white-space: nowrap;
                    z-index: 10;
                    pointer-events: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    border: 1px solid #22c55e;
                }
                .highlight-fix-table {
                    outline: 3px solid #22c55e;
                    outline-offset: 2px;
                    box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
                }
                .fix-change-badge {
                    display: inline-block;
                    margin-left: 8px;
                    padding: 2px 8px;
                    background: linear-gradient(135deg, #1a1d2e 0%, #2a2d3e 100%);
                    border: 1px solid #22c55e;
                    border-radius: 12px;
                    font-size: 10px;
                    color: #22c55e;
                    font-family: 'Consolas', monospace;
                    vertical-align: middle;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                }
                .fix-change-badge .before {
                    color: #ef4444;
                    text-decoration: line-through;
                }
                .fix-change-badge .arrow {
                    color: #94a3b8;
                    margin: 0 4px;
                }
                .fix-change-badge .after {
                    color: #22c55e;
                    font-weight: bold;
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

        # Build change badge HTML
        change_badge = ""
        if fix_info:
            class_str = ' class="highlight-fix"'
            # Combine descriptions
            desc_list = [f"[{f['rule']}] {f['desc']}" for f in fix_info]
            full_desc = "; ".join(desc_list)
            title_str = f' title="{html.escape(full_desc)}"'
            fix_ids = [f.get("id") for f in fix_info if f.get("id")]
            data_attr = (
                f' data-rules="{html.escape(str([f["rule"] for f in fix_info]))}"'
                f' data-fix-ids="{html.escape(str(fix_ids))}"'
            )
            # Build change badge showing before→after
            change_badge = self._build_change_badge(fix_info)

        # Convert runs with their styles
        content = self._convert_runs(para.runs)

        return f"<{tag}{class_str}{style_str}{title_str}{data_attr}>{content}{change_badge}</{tag}>"

    def _build_change_badge(self, fix_info):
        """Build HTML badge showing before→after changes."""
        badges = []
        for fix in fix_info:
            before = fix.get("before")
            after = fix.get("after")
            if before or after:
                before_str = str(before) if before else "无"
                after_str = str(after) if after else "无"
                # Truncate if too long
                if len(before_str) > 20:
                    before_str = before_str[:17] + "..."
                if len(after_str) > 20:
                    after_str = after_str[:17] + "..."
                badge = (
                    f'<span class="fix-change-badge">'
                    f'<span class="before">{html.escape(before_str)}</span>'
                    f'<span class="arrow">→</span>'
                    f'<span class="after">{html.escape(after_str)}</span>'
                    f"</span>"
                )
                badges.append(badge)
        return " ".join(badges) if badges else ""

    def _convert_runs(self, runs):
        """Convert paragraph runs preserving text formatting (bold, italic, underline, font, color)."""
        html_parts = []
        for run in runs:
            text = run.text
            if not text:
                continue

            # Build inline styles for this run
            styles = []
            tags_open = []
            tags_close = []

            # Bold
            if run.bold:
                tags_open.append("<strong>")
                tags_close.insert(0, "</strong>")

            # Italic
            if run.italic:
                tags_open.append("<em>")
                tags_close.insert(0, "</em>")

            # Underline
            if run.underline:
                tags_open.append("<u>")
                tags_close.insert(0, "</u>")

            # Strike-through
            if run.font.strike:
                tags_open.append("<s>")
                tags_close.insert(0, "</s>")

            # Font name
            if run.font.name:
                styles.append(f"font-family: '{run.font.name}'")

            # Font size
            if run.font.size:
                # Convert EMUs to points (1 pt = 12700 EMUs)
                pt_size = run.font.size.pt
                styles.append(f"font-size: {pt_size}pt")

            # Font color
            if run.font.color and run.font.color.rgb:
                color_hex = str(run.font.color.rgb)
                styles.append(f"color: #{color_hex}")

            # Highlight/background color
            if run.font.highlight_color:
                highlight_map = {
                    1: "#FFFF00",  # Yellow
                    2: "#00FF00",  # Green
                    3: "#00FFFF",  # Cyan
                    4: "#FF00FF",  # Magenta
                    5: "#0000FF",  # Blue
                    6: "#FF0000",  # Red
                    7: "#000080",  # Dark Blue
                    8: "#008080",  # Dark Cyan
                    9: "#008000",  # Dark Green
                    10: "#800080",  # Dark Magenta
                    11: "#800000",  # Dark Red
                    12: "#808000",  # Dark Yellow
                    13: "#808080",  # Gray
                    14: "#C0C0C0",  # Light Gray
                    15: "#000000",  # Black
                }
                hl_color = highlight_map.get(run.font.highlight_color, None)
                if hl_color:
                    styles.append(f"background-color: {hl_color}")

            # Build the span
            escaped_text = html.escape(text)
            if styles:
                style_str = "; ".join(styles)
                escaped_text = f'<span style="{style_str}">{escaped_text}</span>'

            # Wrap with formatting tags
            result = "".join(tags_open) + escaped_text + "".join(tags_close)
            html_parts.append(result)

        return "".join(html_parts) if html_parts else "&nbsp;"

    def _convert_table(self, table, index, fix_info=None):
        # Highlight Logic
        class_str = ""
        title_str = ""

        change_badge = ""
        if fix_info:
            class_str = ' class="dict-preview-table highlight-fix highlight-fix-table"'
            desc_list = [f"[{f['rule']}] {f['desc']}" for f in fix_info]
            full_desc = "; ".join(desc_list)
            title_str = f' title="{html.escape(full_desc)}"'
            fix_ids = [f.get("id") for f in fix_info if f.get("id")]
            title_str += f' data-fix-ids="{html.escape(str(fix_ids))}"'
            change_badge = self._build_change_badge(fix_info)
        else:
            class_str = ' class="dict-preview-table"'

        rows = []
        for row in table.rows:
            cells = []
            for cell in row.cells:
                # Convert cell paragraphs with styles
                cell_content = []
                for para in cell.paragraphs:
                    if para.runs:
                        cell_content.append(self._convert_runs(para.runs))
                    elif para.text.strip():
                        cell_content.append(html.escape(para.text))
                cells.append(
                    f"<td>{'<br>'.join(cell_content) if cell_content else '&nbsp;'}</td>"
                )
            rows.append(f"<tr>{''.join(cells)}</tr>")

        # Add change badge after table if there are fixes
        badge_html = (
            f'<div style="margin-top:4px;">{change_badge}</div>' if change_badge else ""
        )
        return f"<table{class_str}{title_str}>{''.join(rows)}</table>{badge_html}"
