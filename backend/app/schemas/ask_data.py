from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.chart import ChartConfig

class AskDataRequest(BaseModel):
    dataset_id: str
    conversation_id: Optional[str] = None
    question: str

class QueryStep(BaseModel):
    step_number: int
    description: str
    operation: str

class AskDataResponse(BaseModel):
    conversation_id: str
    message_id: str
    question: str
    answer_text: str
    confidence_score: float
    analysis_steps: List[QueryStep]
    executed_code: Optional[str] = None
    tabular_result: Optional[List[Dict[str, Any]]] = None
    result_columns: Optional[List[str]] = None
    chart_config: Optional[ChartConfig] = None
    suggestions: List[str] = []
    queried_columns: Optional[List[str]] = None
    filter_explanation: Optional[str] = None
    calculation_details: Optional[Dict[str, Any]] = None

class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    query_code: Optional[str] = None
    result_data: Optional[Any] = None
    chart_config: Optional[Any] = None
    created_at: datetime

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    title: str
    messages: List[MessageResponse] = []
    created_at: datetime
