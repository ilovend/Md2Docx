from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from backend.api.schemas import ProcessRequest, ProcessResponse
from backend.core.processor import DocumentProcessor
from backend.core.config import settings

router = APIRouter()
processor = DocumentProcessor()

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
    # Try finding the fixed version first
    # In processor we saved as {doc_id}_fixed.docx
    # But route param might be just doc_id or filename
    
    # We expect document_id to be the one returned by upload/process, which is the filename on disk
    fixed_filename = f"{document_id}_fixed.docx"
    file_path = settings.OUTPUT_DIR / fixed_filename
    
    if not file_path.exists():
        raise HTTPException(404, "Processed file not found")
    
    return FileResponse(
        path=file_path,
        filename=fixed_filename,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
