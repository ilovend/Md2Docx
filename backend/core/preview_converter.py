from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
import html

class DocxPreviewConverter:
    """
    Converts a DOCX file to a simplified HTML representation for preview purposes.
    """
    
    def convert_to_html(self, docx_path, fixes=None):
        try:
            doc = Document(docx_path)
            html_parts = ['<div class="docx-preview">']
            
            # Simple styles
            html_parts.append("""
            <style>
                .docx-preview { font-family: 'Calibri', 'Arial', sans-serif; padding: 20px; line-height: 1.5; color: #000; background: #fff; }
                .docx-preview p { margin-bottom: 10pt; }
                .docx-preview table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
                .docx-preview td, .docx-preview th { border: 1px solid #ddd; padding: 8px; }
                .docx-preview h1 { font-size: 24pt; font-weight: bold; }
                .docx-preview h2 { font-size: 18pt; font-weight: bold; }
                .docx-preview h3 { font-size: 14pt; font-weight: bold; }
                .highlight-fix { background-color: rgba(34, 197, 94, 0.2); border-left: 3px solid #22c55e; padding-left: 5px; }
            </style>
            """)
            
            # Process paragraphs and tables in order
            # Note: docx.Document.paragraphs only gets paragraphs, same for tables.
            # To preserve order, we need to iterate over element.body.iter_children
            # However, simplified approach: doc.paragraphs + doc.tables logic is complex for ordering.
            # We will use doc.iter_inner_content (generic xml iteration) or just handle paragraphs for MVP if order matters strictly.
            # For simplicity in this MVP, we'll iterate paragraphs as primary content. 
            # (Note: real docx structure is body -> (p | tbl | ...)*)
            
            # Better approach for order:
            from docx.document import Document as _Document
            from docx.oxml.text.paragraph import CT_P
            from docx.text.paragraph import Paragraph
            from docx.oxml.table import CT_Tbl
            from docx.table import Table
            
            parent = doc._body
            
            para_index = 0
            table_index = 0
            
            for child in parent._element:
                if isinstance(child, CT_P):
                    para = Paragraph(child, parent)
                    html_parts.append(self._convert_paragraph(para, para_index, fixes))
                    para_index += 1
                elif isinstance(child, CT_Tbl):
                    table = Table(child, parent)
                    html_parts.append(self._convert_table(table, table_index, fixes))
                    table_index += 1
            
            html_parts.append('</div>')
            return "\n".join(html_parts)
            
        except Exception as e:
            import traceback
            print(f"Preview generation error: {e}")
            return f"<div class='error'>Error generating preview: {str(e)}</div>"

    def _convert_paragraph(self, para, index, fixes):
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
        
        # Check for highlighting logic if we can map fixes to indices (TODO)
        # For now, simplistic rendering
        
        content = html.escape(text)
        
        return f"<{tag}{style_str}>{content}</{tag}>"

    def _convert_table(self, table, index, fixes):
        rows = []
        for row in table.rows:
            cells = []
            for cell in row.cells:
                cells.append(f"<td>{html.escape(cell.text)}</td>")
            rows.append(f"<tr>{''.join(cells)}</tr>")
            
        return f"<table>{''.join(rows)}</table>"
