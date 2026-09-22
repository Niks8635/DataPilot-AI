from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.chart import ChartConfig

class KPICardData(BaseModel):
    id: str
    label: str
    value: Union[str, int, float]
    formatted_value: str
    change_percentage: Optional[float] = None
    subtext: Optional[str] = None
    trend_direction: Optional[str] = None  # up, down, neutral
    icon_name: Optional[str] = None

class TableWidgetConfig(BaseModel):
    columns: List[str] = []
    page_size: int = 5
    sort_by: Optional[str] = None
    sort_desc: bool = False
    show_totals: bool = True

class SlicerWidgetConfig(BaseModel):
    column: str
    multi_select: bool = True
    selected_values: List[str] = []
    available_values: Optional[List[str]] = None

class DateFilterWidgetConfig(BaseModel):
    date_col: str
    preset: str = "all"  # all, 7d, 30d, 90d, ytd, custom
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class DashboardWidgetSchema(BaseModel):
    id: str
    widget_type: str  # kpi, chart, table, slicer, date_filter, summary
    title: str
    subtitle: Optional[str] = None
    page_id: Optional[str] = "page_1"
    kpi_data: Optional[KPICardData] = None
    chart_config: Optional[ChartConfig] = None
    table_config: Optional[TableWidgetConfig] = None
    slicer_config: Optional[SlicerWidgetConfig] = None
    date_filter_config: Optional[DateFilterWidgetConfig] = None
    color_palette: Optional[str] = "blue"  # blue, emerald, violet, amber, rose, monochrome
    grid_w: int = 6  # 1 to 12 column grid
    grid_h: int = 4

class DashboardPage(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    widget_ids: List[str] = []
    local_filters: Optional[Dict[str, Any]] = None

class DashboardLayoutConfig(BaseModel):
    theme: str = "dark"  # dark, light
    active_page_id: str = "page_1"
    pages: List[DashboardPage] = []
    global_filters: Optional[Dict[str, Any]] = None

class DashboardCreate(BaseModel):
    dataset_id: str
    title: str
    description: Optional[str] = None
    is_default: bool = False
    layout_config: Optional[Dict[str, Any]] = None
    widgets: List[DashboardWidgetSchema] = []

class DashboardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_default: Optional[bool] = None
    layout_config: Optional[Dict[str, Any]] = None
    widgets: Optional[List[DashboardWidgetSchema]] = None

class DashboardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    dataset_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    is_default: bool
    layout_config: Optional[Dict[str, Any]] = None
    widgets: List[DashboardWidgetSchema]
    created_at: datetime
    updated_at: datetime
