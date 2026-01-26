import time
import shutil
from pathlib import Path
from fastapi import UploadFile
from backend.core.config import settings
from backend.engine.parser import RuleParser
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

        # Save Output
        output_filename = f"{document_id}_fixed.docx"
        output_path = settings.OUTPUT_DIR / output_filename
        doc.save(output_path)

        duration = int((time.time() - start_time) * 1000)
        
        return {
            "document_id": document_id,
            "status": "completed",
            "total_fixes": len(fixes),
            "fixes": fixes,
            "duration_ms": duration
        }

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
