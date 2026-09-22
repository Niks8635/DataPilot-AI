from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel

class ChartSeries(BaseModel):
    name: str
    data: List[Any]
    type: Optional[str] = None

class ChartConfig(BaseModel):
    chart_id: str
    chart_type: str  # bar, horizontal_bar, line, area, pie, donut, scatter, histogram, heatmap, boxplot
    title: str
    subtitle: Optional[str] = None
    x_axis_title: Optional[str] = None
    y_axis_title: Optional[str] = None
    x_data: Optional[List[Any]] = None
    y_data: Optional[List[Any]] = None
    series: Optional[List[Dict[str, Any]]] = None
    options: Optional[Dict[str, Any]] = None
    summary_text: Optional[str] = None

class ChartRecommendation(BaseModel):
    priority: int
    category: str  # kpi, trend, distribution, comparison, relationship
    title: str
    rationale: str
    config: ChartConfig
