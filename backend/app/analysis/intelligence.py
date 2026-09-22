from typing import Dict, Any, List, Optional
import pandas as pd
from app.analysis.domain import detect_domain

GEO_KEYWORDS = ["country", "state", "city", "region", "zip", "postal", "latitude", "lat", "longitude", "lon", "address", "territory", "province", "county"]
ENTITY_KEYWORDS = ["customer", "user", "client", "employee", "product", "item", "sku", "patient", "student", "account", "store", "vendor", "supplier", "vehicle", "device", "order"]
TARGET_KEYWORDS = ["target", "label", "churn", "status", "fraud", "converted", "conversion", "outcome", "revenue", "sales", "profit", "default", "attrition"]

def synthesize_dataset_intelligence(df: pd.DataFrame, profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Synthesizes a high-level Dataset Intelligence Object that encapsulates semantic roles,
    domain classification, primary dimensions, metrics, and key entities.
    """
    columns_info = profile.get("columns", []) if profile else []
    col_names = list(df.columns)
    
    # 1. Identify Domain
    domain_info = detect_domain(df, col_names)
    
    # 2. Date columns
    date_candidates = []
    for col in col_names:
        series = df[col]
        is_dt = False
        if pd.api.types.is_datetime64_any_dtype(series):
            is_dt = True
        elif series.dropna().count() > 0:
            sample_str = str(series.dropna().iloc[0])
            if any(c in sample_str for c in ["-", "/", ":"]) and len(sample_str) >= 8:
                try:
                    pd.to_datetime(series.dropna().head(10))
                    is_dt = True
                except Exception:
                    pass
        if is_dt:
            # Score candidate by non-null count and span
            non_nulls = int(series.dropna().count())
            date_candidates.append((col, non_nulls))
            
    date_candidates.sort(key=lambda x: x[1], reverse=True)
    primary_date_col = date_candidates[0][0] if date_candidates else None
    
    # 3. Geo columns
    geo_columns = []
    for col in col_names:
        col_lower = col.lower()
        if any(g in col_lower for g in GEO_KEYWORDS):
            geo_columns.append(col)
            
    # 4. ID columns
    id_columns = []
    for col in col_names:
        col_lower = col.lower()
        series = df[col]
        non_null_cnt = series.dropna().count()
        if non_null_cnt > 0:
            uniq_ratio = series.nunique() / non_null_cnt
            if (uniq_ratio > 0.9 and ("id" in col_lower or "key" in col_lower or "code" in col_lower or "num" in col_lower)) or \
               ("uuid" in col_lower or "guid" in col_lower):
                id_columns.append(col)
                
    # 5. Key Metrics
    key_metrics = []
    for col in col_names:
        if col in id_columns or col in geo_columns or col == primary_date_col:
            continue
        series = df[col]
        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            # Check not binary 0/1
            if series.nunique() > 2:
                key_metrics.append(col)
                
    # 6. Key Dimensions & Category columns
    category_columns = []
    key_dimensions = []
    for col in col_names:
        if col in id_columns or col == primary_date_col:
            continue
        series = df[col]
        uniq_cnt = series.nunique()
        if not (pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)):
            category_columns.append(col)
            if 1 < uniq_cnt <= 50:
                key_dimensions.append(col)
        elif pd.api.types.is_bool_dtype(series) or uniq_cnt <= 10:
            category_columns.append(col)
            if 1 < uniq_cnt <= 10:
                key_dimensions.append(col)
                
    # 7. Entity Column
    entity_column = None
    for kw in ENTITY_KEYWORDS:
        for col in col_names:
            if kw in col.lower():
                entity_column = col
                break
        if entity_column:
            break
            
    # 8. Target Variable
    target_variable = None
    # Check target keywords first
    for kw in TARGET_KEYWORDS:
        for col in col_names:
            if kw == col.lower() or f"_{kw}" in col.lower() or f"{kw}_" in col.lower():
                target_variable = col
                break
        if target_variable:
            break
    if not target_variable and key_metrics:
        # Default target to highest variance / typical sales or revenue metric
        preferred_metrics = ["revenue", "sales", "profit", "amount", "total", "score", "price"]
        for pm in preferred_metrics:
            for km in key_metrics:
                if pm in km.lower():
                    target_variable = km
                    break
            if target_variable:
                break
        if not target_variable:
            target_variable = key_metrics[0]

    return {
        "business_domain": domain_info,
        "primary_date_col": primary_date_col,
        "all_date_cols": [c[0] for c in date_candidates],
        "target_variable": target_variable,
        "key_dimensions": key_dimensions[:6],
        "key_metrics": key_metrics[:8],
        "id_columns": id_columns,
        "geo_columns": geo_columns,
        "category_columns": category_columns,
        "entity_column": entity_column
    }
