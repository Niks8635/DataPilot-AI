from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel

class CleaningSuggestion(BaseModel):
    id: str
    column: Optional[str] = None
    action_type: str
    title: str
    description: str
    impact_estimate: str
    suggested_params: Dict[str, Any] = {}
    severity: str = "info"  # critical, warning, info

class CleaningActionItem(BaseModel):
    action_type: str
    column: Optional[str] = None
    params: Dict[str, Any] = {}

class CleaningApplyRequest(BaseModel):
    actions: List[CleaningActionItem]
    save_as_new_version: bool = True
    version_description: Optional[str] = None

class CleaningResponse(BaseModel):
    success: bool
    dataset_id: str
    new_version_number: int
    rows_before: int
    rows_after: int
    columns_before: int
    columns_after: int
    operations_performed: List[str]
    message: str

class ChangedCell(BaseModel):
    row_idx: int
    column: str
    old_value: Any
    new_value: Any

class MetricsDiff(BaseModel):
    rows_before: int
    rows_after: int
    columns_before: int
    columns_after: int
    nulls_before: int
    nulls_after: int
    memory_before: int
    memory_after: int

class CleaningPreviewRequest(BaseModel):
    action: CleaningActionItem

class CleaningPreviewResponse(BaseModel):
    success: bool
    operation_type: str
    column: Optional[str] = None
    summary: str
    affected_rows_count: int
    sample_before: List[Dict[str, Any]]
    sample_after: List[Dict[str, Any]]
    changed_cells: List[ChangedCell]
    metrics_diff: MetricsDiff

class RevertVersionRequest(BaseModel):
    target_version_number: int
