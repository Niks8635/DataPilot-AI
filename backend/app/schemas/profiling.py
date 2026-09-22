from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel

class NumericalStats(BaseModel):
    count: int
    null_count: int
    null_percentage: float
    mean: Optional[float] = None
    median: Optional[float] = None
    mode: Optional[Union[float, int]] = None
    std: Optional[float] = None
    variance: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    q25: Optional[float] = None
    q75: Optional[float] = None
    iqr: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    outliers_iqr_count: int = 0
    outliers_zscore_count: int = 0
    histogram_bins: List[float] = []
    histogram_counts: List[int] = []

class CategoricalFrequency(BaseModel):
    value: str
    count: int
    percentage: float

class CategoricalStats(BaseModel):
    count: int
    null_count: int
    null_percentage: float
    unique_count: int
    is_cardinal: bool
    mode: Optional[str] = None
    top_values: List[CategoricalFrequency] = []

class DatetimeStats(BaseModel):
    count: int
    null_count: int
    null_percentage: float
    min_date: Optional[str] = None
    max_date: Optional[str] = None
    timespan_days: Optional[float] = None
    inferred_frequency: Optional[str] = None
    has_gaps: bool = False

class ColumnProfile(BaseModel):
    name: str
    index: int
    raw_type: str
    inferred_type: str  # numerical, categorical, datetime, boolean, id, text
    semantic_role: Optional[str] = "dimension"  # percentage, currency, geographic, boolean, target, identifier, dimension, metric
    is_id: bool = False
    is_constant: bool = False
    is_empty: bool = False
    null_count: int
    null_percentage: float
    unique_count: int
    unique_ratio: float
    numerical_stats: Optional[NumericalStats] = None
    categorical_stats: Optional[CategoricalStats] = None
    datetime_stats: Optional[DatetimeStats] = None

class DatasetProfileResponse(BaseModel):
    dataset_id: str
    row_count: int
    column_count: int
    file_size_bytes: int
    memory_usage_bytes: int
    duplicate_rows_count: int
    duplicate_rows_percentage: float
    total_missing_values: int
    overall_missing_percentage: float
    columns: List[ColumnProfile]
    column_types_breakdown: Dict[str, int]
    semantic_roles_breakdown: Optional[Dict[str, int]] = None
    intelligence: Optional[Dict[str, Any]] = None
    domain_info: Optional[Dict[str, Any]] = None
