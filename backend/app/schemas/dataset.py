from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DatasetBase(BaseModel):
    name: str

class DatasetCreate(DatasetBase):
    pass

class DatasetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    project_id: Optional[str] = None
    name: str
    original_filename: str
    file_type: str
    row_count: int
    column_count: int
    file_size_bytes: int
    status: str
    current_version: int
    created_at: datetime
    updated_at: datetime

class ColumnSummary(BaseModel):
    name: str
    data_type: str
    inferred_type: str
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any]

class DatasetPreviewResponse(BaseModel):
    id: str
    name: str
    total_rows: int
    total_columns: int
    page: int
    page_size: int
    total_pages: int
    columns: List[ColumnSummary]
    rows: List[Dict[str, Any]]

class CleaningLogEntry(BaseModel):
    id: str
    operation_type: str
    summary: str
    affected_rows: int
    created_at: datetime
    parameters: Optional[Dict[str, Any]] = None
