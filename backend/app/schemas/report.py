from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ReportSection(BaseModel):
    section_id: str
    title: str
    content: str
    data_table: Optional[List[Dict[str, Any]]] = None
    chart_id: Optional[str] = None

class ReportGenerateRequest(BaseModel):
    dataset_id: str
    title: Optional[str] = None
    include_sections: Optional[List[str]] = None
    custom_notes: Optional[str] = None
    options: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    user_id: str
    title: str
    summary: Optional[str] = None
    content: Dict[str, Any]
    html_content: Optional[str] = None
    format: str
    created_at: datetime
