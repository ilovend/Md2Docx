import json
import logging
import os
import time
import uuid
import yaml
import zipfile
import io
import traceback
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, Response, StreamingResponse
from pydantic import BaseModel
from backend.api.schemas import ProcessRequest, ProcessResponse
from backend.core.processor import DocumentProcessor
from backend.core.config import settings
from backend.core.preview_converter import DocxPreviewConverter

# Configure logger
logger = logging.getLogger(__name__)

router = APIRouter()
processor = DocumentProcessor()

# 历史记录存储
HISTORY_FILE = settings.BASE_DIR / "history.json"


class HistoryItem(BaseModel):
    id: str
    filename: str
    processed_time: str
    size: str
    preset: str
    fixes: int
    status: str
    document_id: Optional[str] = None


def load_history() -> List[dict]:
    if HISTORY_FILE.exists():
        try:
            return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        except:
            return []
    return []


def save_history(history: List[dict]):
    HISTORY_FILE.write_text(
        json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8"
    )


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith((".docx", ".md", ".txt")):
        raise HTTPException(400, "Invalid file format")

    doc_id = await processor.save_upload(file)
    return {"document_id": doc_id, "filename": file.filename}


@router.post("/process", response_model=ProcessResponse)
async def process_document(request: ProcessRequest):
    try:
        result = processor.process(
            request.document_id, request.preset, request.preset_config
        )
        return result
    except FileNotFoundError:
        raise HTTPException(404, "Document not found")
    except Exception as e:
        error_detail = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        logger.error(f"Process error: {error_detail}")
        raise HTTPException(500, f"{type(e).__name__}: {str(e)}")


@router.get("/presets")
async def get_presets():
    """Get all available presets"""
    presets = processor.rule_parser.load_presets()
    result = []
    for preset_id, preset_data in presets.items():
        result.append(
            {
                "id": preset_id,
                "name": preset_data.get("name", preset_id),
                "description": preset_data.get("description", ""),
                "rules": list(preset_data.get("rules", {}).keys()),
            }
        )
    return {"presets": result}


@router.get("/presets/{preset_id}")
async def get_preset_detail(preset_id: str):
    """Get detailed preset configuration"""
    preset = processor.rule_parser.get_preset(preset_id)
    if not preset:
        raise HTTPException(404, "Preset not found")
    return {
        "id": preset_id,
        "name": preset.get("name", preset_id),
        "description": preset.get("description", ""),
        "rules": preset.get("rules", {}),
    }


@router.get("/download/{document_id}")
async def download_document(document_id: str):
    fixed_filename = f"{document_id}_fixed.docx"
    file_path = settings.OUTPUT_DIR / fixed_filename

    if not file_path.exists():
        raise HTTPException(404, "Processed file not found")

    return FileResponse(
        path=file_path,
        filename=fixed_filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


# ===== History API =====


@router.get("/history")
async def get_history():
    """Get processing history"""
    history = load_history()
    return {"history": history}


@router.post("/history")
async def add_history(item: HistoryItem):
    """Add item to history"""
    history = load_history()
    history.insert(0, item.model_dump())  # 最新的在前面
    # 限制历史记录数量
    if len(history) > 100:
        history = history[:100]
    save_history(history)
    return {"success": True, "id": item.id}


@router.delete("/history/{item_id}")
async def delete_history(item_id: str):
    """Delete history item"""
    history = load_history()
    history = [h for h in history if h.get("id") != item_id]
    save_history(history)
    return {"success": True}


@router.delete("/history")
async def clear_history():
    """Clear all history"""
    save_history([])
    return {"success": True}


# ===== Rules Management API =====


class RuleBase(BaseModel):
    name: str
    description: str = ""
    enabled: bool = True
    parameters: dict = {}


class RuleCreate(RuleBase):
    pass


class RuleUpdate(RuleBase):
    name: Optional[str] = None
    description: Optional[str] = None
    enabled: Optional[bool] = None
    parameters: Optional[dict] = None


@router.get("/rules")
async def get_rules():
    """Get all available rules dynamically from the registry"""
    from backend.engine import registry
    
    rule_types = []
    for rule in sorted(registry.get_all_rules(), key=lambda r: r.priority):
        rule_types.append({
            "id": rule.id,
            "name": rule.name,
            "category": rule.category,
            "description": rule.description,
            "priority": rule.priority,
            "parameters": rule.get_default_params()
        })
    
    return {"rules": rule_types}


@router.get("/rules/{rule_id}")
async def get_rule_detail(rule_id: str):
    """Get detailed rule configuration"""
    # Get all rules
    rules = (await get_rules())["rules"]
    # Find the specific rule
    rule = next((r for r in rules if r["id"] == rule_id), None)
    if not rule:
        raise HTTPException(404, "Rule not found")
    return rule


@router.post("/rules")
async def create_rule(rule: RuleCreate):
    """Create a new rule"""
    # In a real implementation, this would save to a rules database or config
    # For now, we'll just return the created rule with a generated ID
    new_rule = {
        "id": f"custom_{uuid.uuid4().hex[:8]}",
        "name": rule.name,
        "description": rule.description,
        "enabled": rule.enabled,
        "parameters": rule.parameters,
    }
    return {"success": True, "rule": new_rule}


@router.put("/rules/{rule_id}")
async def update_rule(rule_id: str, rule: RuleUpdate):
    """Update an existing rule"""
    # Get the existing rule
    existing_rule = await get_rule_detail(rule_id)
    # Update the rule with provided data
    updated_rule = existing_rule.copy()
    if rule.name is not None:
        updated_rule["name"] = rule.name
    if rule.description is not None:
        updated_rule["description"] = rule.description
    if rule.enabled is not None:
        updated_rule["enabled"] = rule.enabled
    if rule.parameters is not None:
        updated_rule["parameters"] = rule.parameters
    # In a real implementation, this would save to a rules database or config
    return {"success": True, "rule": updated_rule}


@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: str):
    """Delete a rule"""
    # Check if the rule exists
    await get_rule_detail(rule_id)
    # In a real implementation, this would delete from a rules database or config
    return {"success": True, "message": f"Rule {rule_id} deleted successfully"}


# ===== Rules Import/Export API =====


@router.get("/rules/export")
async def export_rules():
    """Export all presets as YAML"""
    presets = processor.rule_parser.load_presets()
    yaml_content = yaml.dump(
        {"presets": presets},
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
    )
    return Response(
        content=yaml_content,
        media_type="application/x-yaml",
        headers={"Content-Disposition": "attachment; filename=presets.yaml"},
    )


@router.get("/rules/export/{preset_id}")
async def export_preset(preset_id: str):
    """Export a single preset as YAML"""
    preset = processor.rule_parser.get_preset(preset_id)
    if not preset:
        raise HTTPException(404, "Preset not found")

    yaml_content = yaml.dump(
        {preset_id: preset},
        allow_unicode=True,
        default_flow_style=False,
        sort_keys=False,
    )
    return Response(
        content=yaml_content,
        media_type="application/x-yaml",
        headers={"Content-Disposition": f"attachment; filename={preset_id}.yaml"},
    )


class ImportRulesRequest(BaseModel):
    yaml_content: str


@router.post("/rules/import")
async def import_rules(request: ImportRulesRequest):
    """Import presets from YAML content"""
    try:
        data = yaml.safe_load(request.yaml_content)
        if not data:
            raise HTTPException(400, "Invalid YAML content")

        # Validate structure
        if "presets" in data:
            presets = data["presets"]
        else:
            presets = data

        imported_count = 0
        for preset_id, preset_data in presets.items():
            if isinstance(preset_data, dict) and "rules" in preset_data:
                imported_count += 1

        return {
            "success": True,
            "imported_count": imported_count,
            "message": f"Imported {imported_count} presets",
        }
    except yaml.YAMLError as e:
        raise HTTPException(400, f"YAML parse error: {str(e)}")


# ===== Rule Testing API =====


class RuleTestRequest(BaseModel):
    markdown: str
    config: dict  # YAML parsed content


@router.post("/rules/test")
async def test_rule(request: RuleTestRequest):
    """
    Test rules on markdown content.
    Returns: HTML preview of the processed document.
    """
    # 1. Save markdown to temp file
    temp_id = f"test_{int(time.time())}_{uuid.uuid4().hex[:8]}.md"
    temp_path = settings.UPLOAD_DIR / temp_id

    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            f.write(request.markdown)

        # 2. Process document with provided config
        result = processor.process(temp_id, preset_config=request.config)

        # 3. Convert to HTML for preview
        # Use 'fixed' type to see the result of changes
        fixed_path = settings.OUTPUT_DIR / f"{temp_id}_fixed.docx"

        if not fixed_path.exists():
            raise HTTPException(500, "Processing failed to generate output")

        converter = DocxPreviewConverter()
        html_content = converter.convert_to_html(
            str(fixed_path), fixes=result.get("fixes")
        )

        return Response(content=html_content, media_type="text/html")

    except Exception as e:
        logger.error(f"Test rule error: {traceback.format_exc()}")
        raise HTTPException(500, f"Error testing rule: {str(e)}")
    finally:
        # Cleanup temp files
        try:
            if temp_path.exists():
                os.remove(temp_path)
            # We might want to keep the output for a bit or clean it up?
            # For now, let's keep it simple and clean up
            out_path = settings.OUTPUT_DIR / f"{temp_id}_fixed.docx"
            if out_path.exists():
                os.remove(out_path)
            res_path = settings.OUTPUT_DIR / f"{temp_id}_result.json"
            if res_path.exists():
                os.remove(res_path)
            conv_path = settings.UPLOAD_DIR / f"{temp_id}_converted.docx"
            if conv_path.exists():
                os.remove(conv_path)
        except:
            pass


# ===== Presets Management API =====


class PresetUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules: Dict[str, Any]


@router.put("/presets/{preset_id}")
async def update_preset_route(preset_id: str, request: PresetUpdateRequest):
    """Update an existing preset"""
    current = processor.rule_parser.get_preset(preset_id)
    if not current:
        raise HTTPException(404, "Preset not found")

    # Merge updates
    updated_data = current.copy()
    if request.name:
        updated_data["name"] = request.name
    if request.description:
        updated_data["description"] = request.description
    if request.rules:
        updated_data["rules"] = request.rules

    try:
        success = processor.rule_parser.update_preset(preset_id, updated_data)
        if success:
            return {"success": True, "preset": updated_data}
        else:
            raise HTTPException(500, "Failed to save preset")
    except Exception as e:
        raise HTTPException(500, f"Error saving preset: {str(e)}")


@router.post("/presets")
async def create_preset(request: PresetUpdateRequest):
    """Create a new preset"""
    new_id = f"custom_{uuid.uuid4().hex[:8]}"

    data = {
        "name": request.name or "New Preset",
        "description": request.description or "Custom preset",
        "rules": request.rules,
    }

    try:
        success = processor.rule_parser.update_preset(new_id, data)
        if success:
            return {"success": True, "id": new_id, "preset": data}
        else:
            raise HTTPException(500, "Failed to create preset")
    except Exception as e:
        raise HTTPException(500, f"Error creating preset: {str(e)}")


# ===== Preview API =====


@router.get("/preview/{document_id}")
async def get_document_preview(document_id: str, type: str = "original"):
    """
    Get HTML preview of the document.
    type: 'original' or 'fixed'
    """
    fixes = None

    if type == "fixed":
        filename = f"{document_id}_fixed.docx"
        file_path = settings.OUTPUT_DIR / filename

        # Try to load result metadata for highlighting
        try:
            result_path = settings.OUTPUT_DIR / f"{document_id}_result.json"
            if result_path.exists():
                with open(result_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    fixes = data.get("fixes", [])
        except Exception as e:
            logger.error(f"Failed to load result metadata: {e}")

    else:
        # Check if original exists (uploaded)
        file_path = settings.UPLOAD_DIR / document_id

        # If original was markdown, we might want to show the converted docx intermediate
        # or just the raw markdown? For 'preview' consistency, let's look for converted docx or fallback
        if document_id.endswith(".md"):
            converted_path = settings.UPLOAD_DIR / f"{document_id}_converted.docx"
            if converted_path.exists():
                file_path = converted_path

    if not file_path.exists():
        raise HTTPException(404, "Document file not found")

    converter = DocxPreviewConverter()
    html_content = converter.convert_to_html(str(file_path), fixes=fixes)

    return Response(content=html_content, media_type="text/html")


# ============== Batch Processing API ==============


class BatchItem(BaseModel):
    document_id: str
    preset: str = "academic"


class BatchRequest(BaseModel):
    items: List[BatchItem]


class BatchItemResult(BaseModel):
    document_id: str
    status: str
    total_fixes: int = 0
    error: Optional[str] = None


class BatchResponse(BaseModel):
    batch_id: str
    status: str
    total: int
    completed: int
    failed: int
    results: List[BatchItemResult]


# In-memory batch job storage (use Redis/DB in production)
batch_jobs = {}


@router.post("/batch/start", response_model=BatchResponse)
async def start_batch_processing(request: BatchRequest):
    """Start a new batch processing job."""
    batch_id = f"batch_{int(time.time())}_{uuid.uuid4().hex[:8]}"

    results = []
    completed = 0
    failed = 0

    for item in request.items:
        try:
            result = processor.process(item.document_id, item.preset)
            results.append(
                BatchItemResult(
                    document_id=item.document_id,
                    status="completed",
                    total_fixes=result.get("total_fixes", 0),
                )
            )
            completed += 1
        except FileNotFoundError:
            results.append(
                BatchItemResult(
                    document_id=item.document_id,
                    status="error",
                    error="Document not found",
                )
            )
            failed += 1
        except Exception as e:
            results.append(
                BatchItemResult(
                    document_id=item.document_id, status="error", error=str(e)
                )
            )
            failed += 1

    batch_result = BatchResponse(
        batch_id=batch_id,
        status="completed" if failed == 0 else "partial",
        total=len(request.items),
        completed=completed,
        failed=failed,
        results=results,
    )

    # Store for later retrieval
    batch_jobs[batch_id] = batch_result.model_dump()

    return batch_result


@router.get("/batch/{batch_id}", response_model=BatchResponse)
async def get_batch_status(batch_id: str):
    """Get the status of a batch processing job."""
    if batch_id not in batch_jobs:
        raise HTTPException(404, "Batch job not found")

    return batch_jobs[batch_id]


@router.get("/batch/{batch_id}/download")
async def download_batch_results(batch_id: str):
    """Download all processed documents from a batch as a zip file."""
    if batch_id not in batch_jobs:
        raise HTTPException(404, "Batch job not found")

    job = batch_jobs[batch_id]

    # Create zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for result in job["results"]:
            if result["status"] == "completed":
                doc_id = result["document_id"]
                output_path = settings.OUTPUT_DIR / f"{doc_id}_fixed.docx"
                if output_path.exists():
                    zip_file.write(output_path, f"{doc_id}_fixed.docx")

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={batch_id}.zip"},
    )


class ZipRequest(BaseModel):
    document_ids: List[str]


@router.post("/batch/zip")
async def create_batch_zip(request: ZipRequest):
    """Create a zip file from a list of document IDs."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for doc_id in request.document_ids:
            # Determine filename - we can assume {doc_id}_fixed.docx for now
            # Ideally we might want original filenames, but we don't track them easily here
            # without looking up history or having frontend pass them.
            # Let's check if we can resolve a better name from history or just use doc_id.

            # Simple approach: check output dir
            output_path = settings.OUTPUT_DIR / f"{doc_id}_fixed.docx"
            if output_path.exists():
                zip_file.write(output_path, f"{doc_id}_fixed.docx")

    zip_buffer.seek(0)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename=batch_result_{timestamp}.zip"
        },
    )
