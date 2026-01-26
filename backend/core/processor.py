import time
import shutil
from pathlib import Path
from fastapi import UploadFile
from backend.core.config import settings
from backend.engine.parser import RuleParser
from backend.core.markdown_converter import convert_markdown_to_docx
from docx import Document
from docx.shared import Pt, Twips, RGBColor
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

class DocumentProcessor:
    def __init__(self):
        self.rule_parser = RuleParser()

    async def save_upload(self, file: UploadFile) -> str:
        # Simple ID generation (timestamp + filename)
        # In prod, use UUID
        doc_id = f"{int(time.time())}_{file.filename}"
        file_path = settings.UPLOAD_DIR / doc_id
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return doc_id

    def process(self, document_id: str, preset_id: str):
        start_time = time.time()
        input_path = settings.UPLOAD_DIR / document_id
        
        if not input_path.exists():
            raise FileNotFoundError("Document not found")

        # Check if Markdown file - convert to Word first
        md_stats = None
        if document_id.lower().endswith('.md'):
            # Convert Markdown to Word
            temp_docx_path = settings.UPLOAD_DIR / f"{document_id}_converted.docx"
            md_stats = convert_markdown_to_docx(input_path, temp_docx_path)
            input_path = temp_docx_path

        # Load Doc
        doc = Document(input_path)
        
        # Load Rules
        preset = self.rule_parser.get_preset(preset_id)
        fixes = []

        # --- Rule Execution ---
        if preset and 'rules' in preset:
            rules = preset['rules']
            
            # Font Standard Rule
            font_rule = rules.get('font_standard', {})
            if font_rule and font_rule.get('enabled'):
                params = font_rule.get('parameters', {})
                fixes.extend(self._apply_font_standard(doc, params))
            
            # Table Border Rule
            table_rule = rules.get('table_border', {})
            if table_rule and table_rule.get('enabled'):
                params = table_rule.get('parameters', {})
                fixes.extend(self._apply_table_border(doc, params))
            
            # Paragraph Spacing Rule
            spacing_rule = rules.get('paragraph_spacing', {})
            if spacing_rule and spacing_rule.get('enabled'):
                params = spacing_rule.get('parameters', {})
                fixes.extend(self._apply_paragraph_spacing(doc, params))
            
            # Title Bold Rule
            title_rule = rules.get('title_bold', {})
            if title_rule and title_rule.get('enabled'):
                fixes.extend(self._apply_title_bold(doc))
            
            # Font Color Rule
            color_rule = rules.get('font_color', {})
            if color_rule and color_rule.get('enabled'):
                params = color_rule.get('parameters', {})
                fixes.extend(self._apply_font_color(doc, params))
            
            # First Line Indent Rule
            indent_rule = rules.get('first_line_indent', {})
            if indent_rule and indent_rule.get('enabled'):
                params = indent_rule.get('parameters', {})
                fixes.extend(self._apply_first_line_indent(doc, params))
            
            # Heading Style Rule
            heading_rule = rules.get('heading_style', {})
            if heading_rule and heading_rule.get('enabled'):
                params = heading_rule.get('parameters', {})
                fixes.extend(self._apply_heading_style(doc, params))
            
            # Image Center Rule
            image_rule = rules.get('image_center', {})
            if image_rule and image_rule.get('enabled'):
                params = image_rule.get('parameters', {})
                fixes.extend(self._apply_image_center(doc, params))

        # Save Output
        output_filename = f"{document_id}_fixed.docx"
        output_path = settings.OUTPUT_DIR / output_filename
        doc.save(output_path)

        duration = int((time.time() - start_time) * 1000)
        
        result = {
            "document_id": document_id,
            "status": "completed",
            "total_fixes": len(fixes),
            "fixes": fixes,
            "duration_ms": duration
        }
        
        # Add Markdown conversion stats if applicable
        if md_stats:
            result["markdown_conversion"] = md_stats
            fixes.insert(0, {
                "id": "fix_md_convert",
                "rule_id": "markdown_conversion",
                "description": f"Converted Markdown: {md_stats.get('headings', 0)} headings, {md_stats.get('paragraphs', 0)} paragraphs, {md_stats.get('tables', 0)} tables"
            })
            result["total_fixes"] = len(fixes)
        
        return result

    def _apply_font_standard(self, doc, params):
        """
        Font Standard Rule: Sets standard font for all paragraphs.
        """
        fixes = []
        western_font = params.get('western_font', 'Arial')
        chinese_font = params.get('chinese_font', 'SimSun')
        font_size = params.get('font_size_body', 12)

        for i, para in enumerate(doc.paragraphs):
            changed = False
            for run in para.runs:
                if run.font.name != western_font:
                    run.font.name = western_font
                    changed = True
                if run._element.rPr is not None:
                    rFonts = run._element.rPr.rFonts
                    if rFonts is not None:
                        rFonts.set(qn('w:eastAsia'), chinese_font)
                run.font.size = Pt(font_size)
            
            if changed:
                fixes.append({
                    "id": f"fix_font_{i}",
                    "rule_id": "font_standard",
                    "description": f"Applied font {western_font}/{chinese_font} size {font_size}pt"
                })
        return fixes

    def _apply_table_border(self, doc, params):
        """
        Table Border Rule: Applies uniform borders to all tables.
        """
        fixes = []
        border_size = params.get('border_size', 4)
        border_color = params.get('border_color', '000000')
        
        for i, table in enumerate(doc.tables):
            self._set_table_borders(table, border_size, border_color)
            fixes.append({
                "id": f"fix_table_{i}",
                "rule_id": "table_border",
                "description": f"Applied {border_size}pt border to table {i+1}"
            })
            
            # Apply header format if enabled
            if params.get('add_table_header_format') and len(table.rows) > 0:
                header_bg = params.get('table_header_bg_color', 'E3E3E3')
                self._set_row_shading(table.rows[0], header_bg)
                fixes.append({
                    "id": f"fix_table_header_{i}",
                    "rule_id": "table_border",
                    "description": f"Applied header shading #{header_bg} to table {i+1}"
                })
        
        return fixes

    def _set_table_borders(self, table, size, color):
        """Set borders for all cells in a table."""
        tbl = table._tbl
        tblPr = tbl.tblPr if tbl.tblPr is not None else OxmlElement('w:tblPr')
        tblBorders = OxmlElement('w:tblBorders')
        
        for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
            border = OxmlElement(f'w:{border_name}')
            border.set(qn('w:val'), 'single')
            border.set(qn('w:sz'), str(size))
            border.set(qn('w:color'), color)
            tblBorders.append(border)
        
        tblPr.append(tblBorders)
        if tbl.tblPr is None:
            tbl.insert(0, tblPr)

    def _set_row_shading(self, row, color):
        """Set background shading for a table row."""
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            shd = OxmlElement('w:shd')
            shd.set(qn('w:fill'), color)
            tcPr.append(shd)

    def _apply_paragraph_spacing(self, doc, params):
        """
        Paragraph Spacing Rule: Sets line spacing and paragraph spacing.
        """
        fixes = []
        line_spacing = params.get('line_spacing', 1.5)
        space_before = params.get('space_before', 0)
        space_after = params.get('space_after', 6)
        
        count = 0
        for para in doc.paragraphs:
            pf = para.paragraph_format
            pf.line_spacing = line_spacing
            pf.space_before = Pt(space_before)
            pf.space_after = Pt(space_after)
            count += 1
        
        if count > 0:
            fixes.append({
                "id": "fix_spacing_all",
                "rule_id": "paragraph_spacing",
                "description": f"Applied line spacing {line_spacing}x to {count} paragraphs"
            })
        
        return fixes

    def _apply_title_bold(self, doc):
        """
        Title Bold Rule: Makes all headings bold.
        """
        fixes = []
        heading_styles = ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Title']
        
        for i, para in enumerate(doc.paragraphs):
            if para.style and para.style.name in heading_styles:
                for run in para.runs:
                    if not run.bold:
                        run.bold = True
                        fixes.append({
                            "id": f"fix_title_bold_{i}",
                            "rule_id": "title_bold",
                            "description": f"Made '{para.style.name}' bold"
                        })
                        break
        
        return fixes

    def _apply_font_color(self, doc, params):
        """
        Font Color Rule: Sets text color to specified value.
        """
        fixes = []
        text_color = params.get('text_color', '000000')
        
        # Convert hex to RGB
        r = int(text_color[0:2], 16)
        g = int(text_color[2:4], 16)
        b = int(text_color[4:6], 16)
        color = RGBColor(r, g, b)
        
        count = 0
        for para in doc.paragraphs:
            for run in para.runs:
                if run.font.color.rgb != color:
                    run.font.color.rgb = color
                    count += 1
        
        if count > 0:
            fixes.append({
                "id": "fix_font_color_all",
                "rule_id": "font_color",
                "description": f"Applied text color #{text_color} to {count} runs"
            })
        
        return fixes

    def _apply_first_line_indent(self, doc, params):
        """
        First Line Indent Rule: Applies first line indentation to paragraphs.
        """
        fixes = []
        indent_size = params.get('indent_size', 2)  # 字符数
        indent_pt = Pt(indent_size * 12)  # 转换为磅值
        
        count = 0
        heading_styles = ['Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Title']
        
        for para in doc.paragraphs:
            # 跳过标题
            if para.style and para.style.name in heading_styles:
                continue
            # 跳过空段落
            if not para.text.strip():
                continue
            
            pf = para.paragraph_format
            if pf.first_line_indent != indent_pt:
                pf.first_line_indent = indent_pt
                count += 1
        
        if count > 0:
            fixes.append({
                "id": "fix_first_line_indent",
                "rule_id": "first_line_indent",
                "description": f"Applied {indent_size} character first line indent to {count} paragraphs"
            })
        
        return fixes

    def _apply_heading_style(self, doc, params):
        """
        Heading Style Rule: Normalizes heading styles.
        """
        fixes = []
        h1_size = params.get('h1_size', 22)
        h2_size = params.get('h2_size', 16)
        h3_size = params.get('h3_size', 14)
        
        size_map = {
            'Heading 1': h1_size,
            'Heading 2': h2_size,
            'Heading 3': h3_size,
            'Title': h1_size + 4,
        }
        
        for i, para in enumerate(doc.paragraphs):
            if para.style and para.style.name in size_map:
                target_size = size_map[para.style.name]
                for run in para.runs:
                    if run.font.size != Pt(target_size):
                        run.font.size = Pt(target_size)
                        run.bold = True
                        fixes.append({
                            "id": f"fix_heading_{i}",
                            "rule_id": "heading_style",
                            "description": f"Applied {target_size}pt to {para.style.name}"
                        })
                        break
        
        return fixes

    def _apply_image_center(self, doc, params):
        """
        Image Center Rule: Centers all images in the document.
        """
        from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
        fixes = []
        
        for i, para in enumerate(doc.paragraphs):
            # 检查段落是否包含图片 (通过检查是否有 drawing 元素)
            has_image = False
            for run in para.runs:
                if run._element.xpath('.//a:blip'):
                    has_image = True
                    break
            
            if has_image:
                para.paragraph_format.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
                fixes.append({
                    "id": f"fix_image_center_{i}",
                    "rule_id": "image_center",
                    "description": f"Centered image in paragraph {i+1}"
                })
        
        return fixes
