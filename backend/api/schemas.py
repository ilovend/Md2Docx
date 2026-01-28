from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ProcessRequest(BaseModel):
    document_id: str
    preset: str = "default"
    options: Dict[str, Any] = {}
    preset_config: Optional[Dict[str, Any]] = None
    strict: bool = False
    verbose: bool = False


class FixItem(BaseModel):
    id: str
    rule_id: str
    description: str
    paragraph_indices: Optional[List[int]] = None
    table_indices: Optional[List[int]] = None
    before: Optional[str] = None
    after: Optional[str] = None
    location: Optional[Dict[str, Any]] = None


class ProcessResponse(BaseModel):
    document_id: str
    status: str
    total_fixes: int
    fixes: List[FixItem]
    duration_ms: int
