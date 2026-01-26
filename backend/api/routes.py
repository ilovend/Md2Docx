from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
from backend.api.schemas import ProcessRequest, ProcessResponse
from backend.core.processor import DocumentProcessor
from backend.core.config import settings

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
            return json.loads(HISTORY_FILE.read_text(encoding='utf-8'))
        except:
            return []
    return []

def save_history(history: List[dict]):
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding='utf-8')

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(('.docx', '.md', '.txt')):
        raise HTTPException(400, "Invalid file format")
    
    doc_id = await processor.save_upload(file)
    return {"document_id": doc_id, "filename": file.filename}

@router.post("/process", response_model=ProcessResponse)
async def process_document(request: ProcessRequest):
    import traceback
    try:
        result = processor.process(request.document_id, request.preset)
        return result
    except FileNotFoundError:
        raise HTTPException(404, "Document not found")
    except Exception as e:
        error_detail = f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        print(f"Process error: {error_detail}")
        raise HTTPException(500, f"{type(e).__name__}: {str(e)}")

@router.get("/presets")
async def get_presets():
    """Get all available presets"""
    presets = processor.rule_parser.load_presets()
    result = []
    for preset_id, preset_data in presets.items():
        result.append({
            "id": preset_id,
            "name": preset_data.get("name", preset_id),
            "description": preset_data.get("description", ""),
            "rules": list(preset_data.get("rules", {}).keys())
        })
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
        "rules": preset.get("rules", {})
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
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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

# ===== Rules Import/Export API =====

import yaml
from fastapi.responses import Response

@router.get("/rules/export")
async def export_rules():
    """Export all presets as YAML"""
    presets = processor.rule_parser.load_presets()
    yaml_content = yaml.dump({'presets': presets}, allow_unicode=True, default_flow_style=False, sort_keys=False)
    return Response(
        content=yaml_content,
        media_type="application/x-yaml",
        headers={"Content-Disposition": "attachment; filename=presets.yaml"}
    )

@router.get("/rules/export/{preset_id}")
async def export_preset(preset_id: str):
    """Export a single preset as YAML"""
    preset = processor.rule_parser.get_preset(preset_id)
    if not preset:
        raise HTTPException(404, "Preset not found")
    
    yaml_content = yaml.dump({preset_id: preset}, allow_unicode=True, default_flow_style=False, sort_keys=False)
    return Response(
        content=yaml_content,
        media_type="application/x-yaml",
        headers={"Content-Disposition": f"attachment; filename={preset_id}.yaml"}
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
        if 'presets' in data:
            presets = data['presets']
        else:
            presets = data
        
        imported_count = 0
        for preset_id, preset_data in presets.items():
            if isinstance(preset_data, dict) and 'rules' in preset_data:
                imported_count += 1
        
        return {
            "success": True,
            "imported_count": imported_count,
            "message": f"Imported {imported_count} presets"
        }
    except yaml.YAMLError as e:
        raise HTTPException(400, f"YAML parse error: {str(e)}")


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
    import uuid
    import time
    
    batch_id = f"batch_{int(time.time())}_{uuid.uuid4().hex[:8]}"
    
    results = []
    completed = 0
    failed = 0
    
    for item in request.items:
        try:
            result = processor.process(item.document_id, item.preset)
            results.append(BatchItemResult(
                document_id=item.document_id,
                status="completed",
                total_fixes=result.get("total_fixes", 0)
            ))
            completed += 1
        except FileNotFoundError:
            results.append(BatchItemResult(
                document_id=item.document_id,
                status="error",
                error="Document not found"
            ))
            failed += 1
        except Exception as e:
            results.append(BatchItemResult(
                document_id=item.document_id,
                status="error",
                error=str(e)
            ))
            failed += 1
    
    batch_result = BatchResponse(
        batch_id=batch_id,
        status="completed" if failed == 0 else "partial",
        total=len(request.items),
        completed=completed,
        failed=failed,
        results=results
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
    import zipfile
    import io
    from fastapi.responses import StreamingResponse
    
    if batch_id not in batch_jobs:
        raise HTTPException(404, "Batch job not found")
    
    job = batch_jobs[batch_id]
    
    # Create zip file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
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
        headers={"Content-Disposition": f"attachment; filename={batch_id}.zip"}
    )
