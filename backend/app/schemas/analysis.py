from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel

class QualityIssue(BaseModel):
    type: str  # missing_values, duplicate_rows, empty_column, constant_column, high_cardinality, outliers, type_mismatch
    column: Optional[str] = None
    severity: str  # critical, high, medium, low
    message: str
    impact_count: int
    score_deduction: float

class QualityScoreResponse(BaseModel):
    overall_score: float  # 0 to 100
    grade: str  # Excellent, Good, Fair, Needs Attention, Poor
    summary_badges: List[str]
    structural_health: float
    completeness_score: float
    uniqueness_score: float
    consistency_score: float
    issues: List[QualityIssue]

class CorrelationPair(BaseModel):
    column_x: str
    column_y: str
    pearson: float
    spearman: Optional[float] = None
    strength: str  # strong_positive, moderate_positive, weak, moderate_negative, strong_negative

class CorrelationMatrixResponse(BaseModel):
    columns: List[str]
    matrix: List[List[Optional[float]]]
    top_correlations: List[CorrelationPair]

class OutlierDetail(BaseModel):
    column: str
    iqr_outliers_count: int
    zscore_outliers_count: int
    lower_bound: float
    upper_bound: float
    sample_outlier_values: List[float]

class GroupByMetric(BaseModel):
    group_value: str
    metric_value: float
    count: int

class EDAResponse(BaseModel):
    dataset_overview: Dict[str, Any]
    numerical_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    bivariate_aggregations: List[Dict[str, Any]]
    time_series_trends: List[Dict[str, Any]]
    distributions: List[Dict[str, Any]]
    intelligence: Optional[Dict[str, Any]] = None
    analysis_plan: Optional[List[Dict[str, Any]]] = None
    pareto_analyses: Optional[List[Dict[str, Any]]] = None
    segmented_trends: Optional[List[Dict[str, Any]]] = None
    geographic_results: Optional[List[Dict[str, Any]]] = None
    entity_concentration: Optional[Dict[str, Any]] = None
    multicollinearity_flags: Optional[List[Dict[str, Any]]] = None

class StructuredInsightItem(BaseModel):
    title: str
    type: str  # finding, trend, anomaly, opportunity, risk, recommendation
    description: str
    metric: str
    value: Union[str, float, int]
    comparison: str
    severity: str  # critical, warning, positive, neutral
    source_columns: List[str]
    calculation_reference: str

class AIInsightsResponse(BaseModel):
    executive_summary: str
    key_insights: List[str]
    trends: List[str]
    anomalies: List[str]
    business_recommendations: List[str]
    potential_questions: List[str]
    structured_insights: Optional[List[StructuredInsightItem]] = None
    detail_level: Optional[str] = "brief"
    focus_prompt: Optional[str] = None

class ComprehensiveAnalysisResponse(BaseModel):
    dataset_id: str
    quality: QualityScoreResponse
    correlations: CorrelationMatrixResponse
    outliers: List[OutlierDetail]
    eda: EDAResponse
    insights: AIInsightsResponse
    intelligence: Optional[Dict[str, Any]] = None
    analysis_plan: Optional[List[Dict[str, Any]]] = None

class InsightsRegenerateRequest(BaseModel):
    focus_prompt: Optional[str] = None
    detail_level: str = "brief"

class ForecastRequest(BaseModel):
    date_column: Optional[str] = None
    metric_column: Optional[str] = None
    horizon: str = "30d"
    model_type: str = "auto"

class ForecastResponse(BaseModel):
    dataset_id: Optional[str] = None
    date_column: str
    metric_column: str
    horizon: str
    periods_forecasted: int
    frequency: str
    frequency_label: str
    model_name: str
    metrics: Dict[str, Any]
    narrative: str
    disclaimer: str
    chart_points: List[Dict[str, Any]]

