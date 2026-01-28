import time
import shutil
import uuid
import json
import os
from fastapi import UploadFile
from docx import Document
from backend.core.config import settings
from backend.engine.parser import RuleParser
from backend.core.markdown_converter import (
    convert_markdown_to_docx,
    convert_text_to_docx,
)


class DocumentProcessor:
    def __init__(self):
        self.rule_parser = RuleParser()

    async def save_upload(self, file: UploadFile) -> str:
        # Generate unique ID for the document
        ext = os.path.splitext(file.filename)[1]
        doc_id = f"{uuid.uuid4().hex}{ext}"
        file_path = settings.UPLOAD_DIR / doc_id

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return doc_id

    def process(
        self,
        document_id: str,
        preset_id: str = None,
        preset_config: dict = None,
        strict: bool = False,
        verbose: bool = False,
    ):
        """
        Process document with specified preset and options.

        Args:
            document_id: Document identifier
            preset_id: Preset configuration ID
            preset_config: Custom preset configuration (overrides preset_id)
            strict: Enable strict mode for more aggressive fixes
            verbose: Enable verbose logging
        """
        start_time = time.time()
        input_path = settings.UPLOAD_DIR / document_id
        logs = [] if verbose else None

        if not input_path.exists():
            raise FileNotFoundError("Document not found")

        if verbose:
            logs.append(f"[INFO] Processing document: {document_id}")
            logs.append(f"[INFO] Strict mode: {strict}")

        # Check if Markdown file - convert to Word first
        md_stats = None
        txt_stats = None
        if document_id.lower().endswith(".md"):
            # Convert Markdown to Word
            temp_docx_path = settings.UPLOAD_DIR / f"{document_id}_converted.docx"
            md_stats = convert_markdown_to_docx(input_path, temp_docx_path)
            input_path = temp_docx_path
        elif document_id.lower().endswith(".txt"):
            # Convert plain text to Word
            temp_docx_path = settings.UPLOAD_DIR / f"{document_id}_converted.docx"
            txt_stats = convert_text_to_docx(input_path, temp_docx_path)
            input_path = temp_docx_path

        # Load Doc
        doc = Document(input_path)

        # Load Rules
        # Priority: explicit config > preset_id > None
        rules = {}
        if preset_config:
            rules = preset_config.get(
                "rules", preset_config
            )  # Handle if passed as full preset or just rules
        elif preset_id:
            preset = self.rule_parser.get_preset(preset_id)
            if preset and "rules" in preset:
                rules = preset["rules"]

        fixes = []

        # --- Rule Execution ---
        if rules:
            from backend.engine import registry

            # Get all registered rules and sort by priority
            registered_rules = sorted(
                registry.get_all_rules(), key=lambda r: r.priority
            )

            for rule in registered_rules:
                rule_config = rules.get(rule.id)
                if rule_config and rule_config.get("enabled"):
                    params = rule_config.get("parameters", {})
                    # 严格模式下可以调整参数
                    if strict:
                        params = self._apply_strict_params(rule.id, params)
                    try:
                        if verbose:
                            logs.append(f"[RULE] Applying: {rule.id} ({rule.name})")
                        rule_fixes = rule.apply(doc, params)
                        if rule_fixes:
                            fixes.extend(rule_fixes)
                            if verbose:
                                logs.append(
                                    f"[RULE] {rule.id}: {len(rule_fixes)} fixes applied"
                                )
                    except Exception as e:
                        if verbose:
                            logs.append(f"[ERROR] Rule {rule.id} failed: {e}")
                        print(f"Error applying rule {rule.id}: {e}")

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
            "duration_ms": duration,
        }

        # 添加 verbose 日志到结果
        if verbose and logs:
            result["logs"] = logs

        # Add Markdown conversion stats if applicable
        if md_stats:
            result["markdown_conversion"] = md_stats
            # Insert at beginning
            fixes.insert(
                0,
                {
                    "id": "fix_md_convert",
                    "rule_id": "markdown_conversion",
                    "description": f"Converted Markdown: {md_stats.get('headings', 0)} headings, {md_stats.get('paragraphs', 0)} paragraphs, {md_stats.get('tables', 0)} tables",
                    "paragraph_indices": [],  # Global content
                },
            )
            result["total_fixes"] = len(fixes)
        # Add text conversion stats if applicable
        elif txt_stats:
            result["text_conversion"] = txt_stats
            # Insert at beginning
            fixes.insert(
                0,
                {
                    "id": "fix_txt_convert",
                    "rule_id": "text_conversion",
                    "description": f"Converted plain text: {txt_stats.get('paragraphs', 0)} paragraphs, {txt_stats.get('lines', 0)} lines",
                    "paragraph_indices": [],  # Global content
                },
            )
            result["total_fixes"] = len(fixes)

        # Save Result Metadata
        result_path = settings.OUTPUT_DIR / f"{document_id}_result.json"
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        return result

    def _apply_strict_params(self, rule_id: str, params: dict) -> dict:
        """
        Apply strict mode adjustments to rule parameters.
        Strict mode enables more aggressive/conservative fixes.
        """
        strict_params = params.copy()

        # 严格模式下的参数调整
        strict_overrides = {
            "font_standard": {
                "enforce_all": True,  # 强制所有字体替换
            },
            "paragraph_spacing": {
                "strict_spacing": True,  # 严格段落间距
            },
            "table_border": {
                "border_size": 6,  # 更粗的边框
            },
            "image_resize": {
                "max_width": 5.5,  # 更小的最大宽度
                "max_height": 7.0,
            },
            "first_line_indent": {
                "indent_size": 2,  # 强制 2 字符缩进
            },
        }

        if rule_id in strict_overrides:
            strict_params.update(strict_overrides[rule_id])

        return strict_params
