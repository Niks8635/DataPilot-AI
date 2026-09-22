import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from scipy import stats
from app.analysis.intelligence import synthesize_dataset_intelligence

def classify_semantic_role(col: str, series: pd.Series, inferred_type: str, is_id: bool, unique_ratio: float, row_count: int) -> str:
    """
    Classify fine-grained semantic column roles:
    percentage, currency, geographic, boolean, target, identifier, dimension, metric
    """
    col_lower = col.lower().strip()
    
    # Identifier
    if is_id or ("id" in col_lower or "code" in col_lower or "key" in col_lower or "num" in col_lower) and unique_ratio > 0.85:
        return "identifier"
        
    # Geographic
    if any(g in col_lower for g in ["country", "state", "city", "region", "zip", "postal", "latitude", "lat", "longitude", "lon", "address", "territory", "province"]):
        return "geographic"
        
    # Target
    if any(t in col_lower for t in ["target", "churn", "fraud", "converted", "label", "outcome"]):
        return "target"
        
    # Boolean
    if inferred_type == "boolean":
        return "boolean"
    if unique_ratio <= 2 / max(row_count, 1):
        vals = set(series.dropna().astype(str).str.lower().unique())
        if vals.issubset({"0", "1", "0.0", "1.0", "true", "false", "yes", "no", "y", "n"}):
            return "boolean"
            
    # Numerical roles: percentage, currency, or metric
    if inferred_type == "numerical":
        # Percentage
        if any(p in col_lower for p in ["pct", "percent", "rate", "ratio", "margin"]):
            return "percentage"
            
        # Currency
        if any(c in col_lower for c in ["price", "cost", "sales", "revenue", "amount", "profit", "fee", "spend", "salary", "wage", "balance", "total", "budget", "tax", "discount"]):
            return "currency"
            
        # General metric
        return "metric"
        
    # Categorical, datetime, text default to dimension
    return "dimension"

def profile_dataset(df: pd.DataFrame, dataset_id: str) -> Dict[str, Any]:
    row_count = len(df)
    col_count = len(df.columns)
    memory_usage = int(df.memory_usage(deep=True).sum())
    
    duplicate_rows_count = int(df.duplicated().sum())
    duplicate_percentage = round((duplicate_rows_count / row_count) * 100, 2) if row_count > 0 else 0.0
    
    total_missing_values = int(df.isnull().sum().sum())
    total_cells = row_count * col_count
    overall_missing_percentage = round((total_missing_values / total_cells) * 100, 2) if total_cells > 0 else 0.0
    
    columns_profile = []
    type_counts = {
        "numerical": 0,
        "categorical": 0,
        "datetime": 0,
        "boolean": 0,
        "id": 0,
        "text": 0
    }
    semantic_counts = {
        "percentage": 0,
        "currency": 0,
        "geographic": 0,
        "boolean": 0,
        "target": 0,
        "identifier": 0,
        "dimension": 0,
        "metric": 0
    }
    
    for idx, col in enumerate(df.columns):
        series = df[col]
        null_count = int(series.isnull().sum())
        null_pct = round((null_count / row_count) * 100, 2) if row_count > 0 else 0.0
        unique_count = int(series.nunique(dropna=True))
        unique_ratio = round(unique_count / row_count, 4) if row_count > 0 else 0.0
        
        is_empty = (null_count == row_count)
        is_constant = (unique_count == 1)
        
        # Determine column type
        raw_type = str(series.dtype)
        is_num = pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)
        is_bool = pd.api.types.is_bool_dtype(series)
        is_dt = pd.api.types.is_datetime64_any_dtype(series)
        
        # Try datetime conversion test if object
        if not is_num and not is_bool and not is_dt and series.dropna().count() > 0:
            sample_val = str(series.dropna().iloc[0])
            if any(char in sample_val for char in ["-", "/", ":"]) and len(sample_val) >= 8:
                try:
                    pd.to_datetime(series.dropna().head(10))
                    is_dt = True
                except Exception:
                    pass

        num_stats = None
        cat_stats = None
        dt_stats = None
        is_id = False
        
        if is_dt:
            inferred_type = "datetime"
            type_counts["datetime"] += 1
            dt_series = pd.to_datetime(series, errors="coerce")
            valid_dt = dt_series.dropna()
            if not valid_dt.empty:
                min_d = str(valid_dt.min().isoformat())
                max_d = str(valid_dt.max().isoformat())
                span = (valid_dt.max() - valid_dt.min()).total_seconds() / (3600 * 24)
                dt_stats = {
                    "count": int(valid_dt.count()),
                    "null_count": null_count,
                    "null_percentage": null_pct,
                    "min_date": min_d,
                    "max_date": max_d,
                    "timespan_days": round(span, 2),
                    "inferred_frequency": None,
                    "has_gaps": False
                }
                
        elif is_num:
            if unique_ratio > 0.95 and row_count > 20 and ("id" in col.lower() or "code" in col.lower() or "key" in col.lower()):
                inferred_type = "id"
                is_id = True
                type_counts["id"] += 1
            else:
                inferred_type = "numerical"
                type_counts["numerical"] += 1
                
            clean_series = series.dropna().astype(float)
            if not clean_series.empty:
                cnt = int(clean_series.count())
                mean_val = float(clean_series.mean())
                median_val = float(clean_series.median())
                std_val = float(clean_series.std()) if cnt > 1 else 0.0
                var_val = float(clean_series.var()) if cnt > 1 else 0.0
                min_val = float(clean_series.min())
                max_val = float(clean_series.max())
                q25 = float(clean_series.quantile(0.25))
                q75 = float(clean_series.quantile(0.75))
                iqr = q75 - q25
                
                # Outliers IQR
                lower_bound = q25 - 1.5 * iqr
                upper_bound = q75 + 1.5 * iqr
                iqr_outliers = int(((clean_series < lower_bound) | (clean_series > upper_bound)).sum())
                
                # Outliers Z-Score
                if std_val > 0:
                    z_scores = np.abs(stats.zscore(clean_series))
                    zscore_outliers = int((z_scores > 3).sum())
                else:
                    zscore_outliers = 0
                    
                skew_val = float(stats.skew(clean_series)) if cnt > 2 else 0.0
                kurt_val = float(stats.kurtosis(clean_series)) if cnt > 3 else 0.0
                
                m = clean_series.mode()
                mode_val = float(m.iloc[0]) if not m.empty else None
                
                hist_counts, bin_edges = np.histogram(clean_series, bins=10)
                
                num_stats = {
                    "count": cnt,
                    "null_count": null_count,
                    "null_percentage": null_pct,
                    "mean": round(mean_val, 2),
                    "median": round(median_val, 2),
                    "mode": round(mode_val, 2) if mode_val is not None else None,
                    "std": round(std_val, 2),
                    "variance": round(var_val, 2),
                    "min": round(min_val, 2),
                    "max": round(max_val, 2),
                    "q25": round(q25, 2),
                    "q75": round(q75, 2),
                    "iqr": round(iqr, 2),
                    "skewness": round(skew_val, 2) if not np.isnan(skew_val) else 0.0,
                    "kurtosis": round(kurt_val, 2) if not np.isnan(kurt_val) else 0.0,
                    "outliers_iqr_count": iqr_outliers,
                    "outliers_zscore_count": zscore_outliers,
                    "histogram_bins": [round(float(b), 2) for b in bin_edges],
                    "histogram_counts": [int(c) for c in hist_counts]
                }
                
        elif is_bool:
            inferred_type = "boolean"
            type_counts["boolean"] += 1
            vc = series.value_counts(dropna=True)
            top_vals = [
                {"value": str(val), "count": int(cnt), "percentage": round((cnt / row_count) * 100, 2)}
                for val, cnt in vc.items()
            ]
            cat_stats = {
                "count": int(series.count()),
                "null_count": null_count,
                "null_percentage": null_pct,
                "unique_count": unique_count,
                "is_cardinal": False,
                "mode": str(vc.index[0]) if not vc.empty else None,
                "top_values": top_vals
            }
        else:
            if unique_ratio > 0.9 and row_count > 20 and ("id" in col.lower() or "key" in col.lower() or "code" in col.lower()):
                inferred_type = "id"
                is_id = True
                type_counts["id"] += 1
            elif unique_count > 50 and unique_ratio > 0.6:
                inferred_type = "text"
                type_counts["text"] += 1
            else:
                inferred_type = "categorical"
                type_counts["categorical"] += 1
                
            vc = series.value_counts(dropna=True)
            top_vals = [
                {"value": str(val), "count": int(cnt), "percentage": round((cnt / row_count) * 100, 2)}
                for val, cnt in vc.head(10).items()
            ]
            cat_stats = {
                "count": int(series.count()),
                "null_count": null_count,
                "null_percentage": null_pct,
                "unique_count": unique_count,
                "is_cardinal": unique_count > 30,
                "mode": str(vc.index[0]) if not vc.empty else None,
                "top_values": top_vals
            }
            
        semantic_role = classify_semantic_role(col, series, inferred_type, is_id, unique_ratio, row_count)
        if semantic_role in semantic_counts:
            semantic_counts[semantic_role] += 1
            
        columns_profile.append({
            "name": col,
            "index": idx,
            "raw_type": raw_type,
            "inferred_type": inferred_type,
            "semantic_role": semantic_role,
            "is_id": is_id,
            "is_constant": is_constant,
            "is_empty": is_empty,
            "null_count": null_count,
            "null_percentage": null_pct,
            "unique_count": unique_count,
            "unique_ratio": unique_ratio,
            "numerical_stats": num_stats,
            "categorical_stats": cat_stats,
            "datetime_stats": dt_stats
        })
        
    initial_profile = {
        "dataset_id": dataset_id,
        "row_count": row_count,
        "column_count": col_count,
        "file_size_bytes": memory_usage,
        "memory_usage_bytes": memory_usage,
        "duplicate_rows_count": duplicate_rows_count,
        "duplicate_rows_percentage": duplicate_percentage,
        "total_missing_values": total_missing_values,
        "overall_missing_percentage": overall_missing_percentage,
        "columns": columns_profile,
        "column_types_breakdown": type_counts,
        "semantic_roles_breakdown": semantic_counts
    }
    
    intelligence = synthesize_dataset_intelligence(df, initial_profile)
    initial_profile["intelligence"] = intelligence
    initial_profile["domain_info"] = intelligence.get("business_domain")
    
    return initial_profile
