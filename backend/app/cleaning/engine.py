import re
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from scipy import stats

def generate_cleaning_suggestions(df: pd.DataFrame, profile: Dict[str, Any], quality: Dict[str, Any]) -> List[Dict[str, Any]]:
    suggestions = []
    
    # 1. Duplicate rows
    if profile.get("duplicate_rows_count", 0) > 0:
        dup_count = profile["duplicate_rows_count"]
        suggestions.append({
            "id": "drop_duplicates",
            "column": None,
            "action_type": "drop_duplicates",
            "title": "Remove Duplicate Rows",
            "description": f"Remove {dup_count} exact duplicate rows to preserve data integrity and prevent double-counting.",
            "impact_estimate": f"Reduces rows by {dup_count}",
            "suggested_params": {},
            "severity": "critical" if dup_count > 10 else "warning"
        })
        
    # 2. Empty columns
    for col_info in profile.get("columns", []):
        col_name = col_info["name"]
        if col_info["is_empty"]:
            suggestions.append({
                "id": f"drop_empty_{col_name}",
                "column": col_name,
                "action_type": "drop_column",
                "title": f"Drop 100% Empty Column '{col_name}'",
                "description": f"Column '{col_name}' contains no data across any rows.",
                "impact_estimate": "Removes 1 column",
                "suggested_params": {"column": col_name},
                "severity": "critical"
            })
            
    # 3. Missing values in numerical columns
    for col_info in profile.get("columns", []):
        col_name = col_info["name"]
        null_count = col_info["null_count"]
        if null_count > 0 and not col_info["is_empty"]:
            if col_info["inferred_type"] == "numerical":
                suggestions.append({
                    "id": f"impute_median_{col_name}",
                    "column": col_name,
                    "action_type": "impute_median",
                    "title": f"Impute Missing Values in '{col_name}'",
                    "description": f"Fill {null_count} missing numerical values using column median (robust to outliers).",
                    "impact_estimate": f"Fills {null_count} nulls",
                    "suggested_params": {"column": col_name, "strategy": "median"},
                    "severity": "warning"
                })
            elif col_info["inferred_type"] in ["categorical", "text"]:
                suggestions.append({
                    "id": f"impute_mode_{col_name}",
                    "column": col_name,
                    "action_type": "impute_mode",
                    "title": f"Impute Missing Values in '{col_name}'",
                    "description": f"Fill {null_count} missing values using the most frequent category or 'Unknown'.",
                    "impact_estimate": f"Fills {null_count} nulls",
                    "suggested_params": {"column": col_name, "fill_value": "Unknown"},
                    "severity": "info"
                })
                
    # 4. Text whitespace trimming & casing
    for col_info in profile.get("columns", []):
        col_name = col_info["name"]
        if col_info["inferred_type"] in ["categorical", "text"] and col_name in df.columns:
            series = df[col_name].dropna().astype(str)
            has_whitespace = any(s != s.strip() for s in series.head(50))
            if has_whitespace:
                suggestions.append({
                    "id": f"trim_{col_name}",
                    "column": col_name,
                    "action_type": "trim_whitespace",
                    "title": f"Trim Whitespace in '{col_name}'",
                    "description": f"Remove leading and trailing whitespace from '{col_name}' to standardize groupings.",
                    "impact_estimate": "Standardizes text entries",
                    "suggested_params": {"column": col_name},
                    "severity": "info"
                })
                
    # 5. Outliers in numerical columns
    for col_info in profile.get("columns", []):
        col_name = col_info["name"]
        num_stats = col_info.get("numerical_stats")
        if num_stats and num_stats.get("outliers_iqr_count", 0) > 0:
            outlier_count = num_stats["outliers_iqr_count"]
            suggestions.append({
                "id": f"clip_outliers_{col_name}",
                "column": col_name,
                "action_type": "clip_outliers",
                "title": f"Cap Outliers in '{col_name}'",
                "description": f"Cap {outlier_count} extreme statistical outliers at the 1.5x IQR boundaries.",
                "impact_estimate": f"Caps {outlier_count} values",
                "suggested_params": {"column": col_name, "method": "iqr"},
                "severity": "info"
            })
            
    return suggestions

def apply_cleaning_operations(df: pd.DataFrame, actions: List[Dict[str, Any]]) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
    cleaned_df = df.copy()
    logs = []
    
    for act in actions:
        action_type = act.get("action_type")
        col = act.get("column")
        params = act.get("params", {})
        
        try:
            # 1. Duplicates
            if action_type == "drop_duplicates":
                before_len = len(cleaned_df)
                subset = params.get("subset")
                if subset and isinstance(subset, list):
                    subset_cols = [c for c in subset if c in cleaned_df.columns]
                    cleaned_df = cleaned_df.drop_duplicates(subset=subset_cols if subset_cols else None)
                else:
                    cleaned_df = cleaned_df.drop_duplicates()
                affected = before_len - len(cleaned_df)
                logs.append({
                    "operation_type": "drop_duplicates",
                    "summary": f"Removed {affected} duplicate rows",
                    "affected_rows": affected,
                    "parameters": params
                })
                
            # 2. Drop Column
            elif action_type == "drop_column" and col in cleaned_df.columns:
                cleaned_df.drop(columns=[col], inplace=True)
                logs.append({
                    "operation_type": "drop_column",
                    "summary": f"Dropped column '{col}'",
                    "affected_rows": len(cleaned_df),
                    "parameters": {"column": col}
                })
                
            # 3. Rename Column
            elif action_type == "rename_column" and col in cleaned_df.columns:
                new_name = str(params.get("new_name", "")).strip()
                if new_name and new_name != col:
                    cleaned_df.rename(columns={col: new_name}, inplace=True)
                    logs.append({
                        "operation_type": "rename_column",
                        "summary": f"Renamed column '{col}' to '{new_name}'",
                        "affected_rows": len(cleaned_df),
                        "parameters": {"old_name": col, "new_name": new_name}
                    })
                    
            # 4. Cast Type
            elif action_type == "cast_column_type" and col in cleaned_df.columns:
                target_type = params.get("target_type", "numeric")
                if target_type == "numeric":
                    cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
                elif target_type == "integer":
                    cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce").fillna(0).astype(int)
                elif target_type == "datetime":
                    cleaned_df[col] = pd.to_datetime(cleaned_df[col], errors="coerce")
                elif target_type == "string":
                    cleaned_df[col] = cleaned_df[col].astype(str)
                logs.append({
                    "operation_type": "cast_column_type",
                    "summary": f"Cast column '{col}' to {target_type}",
                    "affected_rows": len(cleaned_df),
                    "parameters": {"column": col, "target_type": target_type}
                })

            # 5. Missing Imputations
            elif action_type == "impute_median" and col in cleaned_df.columns:
                null_cnt = int(cleaned_df[col].isnull().sum())
                if null_cnt > 0:
                    med_val = cleaned_df[col].median()
                    cleaned_df[col] = cleaned_df[col].fillna(med_val)
                    logs.append({
                        "operation_type": "impute_median",
                        "summary": f"Filled {null_cnt} missing values in '{col}' with median ({round(float(med_val), 2)})",
                        "affected_rows": null_cnt,
                        "parameters": {"column": col, "value": float(med_val)}
                    })
                    
            elif action_type == "impute_mean" and col in cleaned_df.columns:
                null_cnt = int(cleaned_df[col].isnull().sum())
                if null_cnt > 0:
                    mean_val = cleaned_df[col].mean()
                    cleaned_df[col] = cleaned_df[col].fillna(mean_val)
                    logs.append({
                        "operation_type": "impute_mean",
                        "summary": f"Filled {null_cnt} missing values in '{col}' with mean ({round(float(mean_val), 2)})",
                        "affected_rows": null_cnt,
                        "parameters": {"column": col, "value": float(mean_val)}
                    })
                    
            elif action_type == "impute_mode" and col in cleaned_df.columns:
                null_cnt = int(cleaned_df[col].isnull().sum())
                if null_cnt > 0:
                    modes = cleaned_df[col].mode()
                    fill_val = str(modes.iloc[0]) if not modes.empty else params.get("fill_value", "Unknown")
                    cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                    logs.append({
                        "operation_type": "impute_mode",
                        "summary": f"Filled {null_cnt} missing values in '{col}' with mode ('{fill_val}')",
                        "affected_rows": null_cnt,
                        "parameters": {"column": col, "value": fill_val}
                    })
                    
            elif action_type == "impute_constant" and col in cleaned_df.columns:
                null_cnt = int(cleaned_df[col].isnull().sum())
                fill_val = params.get("value", "Unknown")
                cleaned_df[col] = cleaned_df[col].fillna(fill_val)
                logs.append({
                    "operation_type": "impute_constant",
                    "summary": f"Filled {null_cnt} missing values in '{col}' with '{fill_val}'",
                    "affected_rows": null_cnt,
                    "parameters": {"column": col, "value": fill_val}
                })

            elif action_type == "ffill" and col in cleaned_df.columns:
                null_cnt = int(cleaned_df[col].isnull().sum())
                cleaned_df[col] = cleaned_df[col].ffill()
                logs.append({
                    "operation_type": "ffill",
                    "summary": f"Forward-filled missing values in '{col}'",
                    "affected_rows": null_cnt,
                    "parameters": {"column": col}
                })

            elif action_type == "bfill" and col in cleaned_df.columns:
                null_cnt = int(cleaned_df[col].isnull().sum())
                cleaned_df[col] = cleaned_df[col].bfill()
                logs.append({
                    "operation_type": "bfill",
                    "summary": f"Backward-filled missing values in '{col}'",
                    "affected_rows": null_cnt,
                    "parameters": {"column": col}
                })

            elif action_type == "drop_missing_rows":
                before_len = len(cleaned_df)
                if col and col in cleaned_df.columns:
                    cleaned_df = cleaned_df.dropna(subset=[col])
                else:
                    thresh_pct = float(params.get("threshold_pct", 50.0))
                    # Drop rows missing more than thresh_pct of columns
                    min_valid = int(len(cleaned_df.columns) * (1 - thresh_pct / 100))
                    cleaned_df = cleaned_df.dropna(thresh=min_valid)
                affected = before_len - len(cleaned_df)
                logs.append({
                    "operation_type": "drop_missing_rows",
                    "summary": f"Dropped {affected} rows with excessive missing values",
                    "affected_rows": affected,
                    "parameters": params
                })
                
            # 6. Text Standardization
            elif action_type == "trim_whitespace" and col in cleaned_df.columns:
                cleaned_df[col] = cleaned_df[col].astype(str).str.strip()
                logs.append({
                    "operation_type": "trim_whitespace",
                    "summary": f"Trimmed whitespace from text in column '{col}'",
                    "affected_rows": len(cleaned_df),
                    "parameters": {"column": col}
                })

            elif action_type == "collapse_whitespace" and col in cleaned_df.columns:
                cleaned_df[col] = cleaned_df[col].astype(str).replace(r"\s+", " ", regex=True).str.strip()
                logs.append({
                    "operation_type": "collapse_whitespace",
                    "summary": f"Collapsed multiple spaces in '{col}'",
                    "affected_rows": len(cleaned_df),
                    "parameters": {"column": col}
                })
                
            elif action_type == "standardize_text" and col in cleaned_df.columns:
                casing = params.get("casing", "title")
                if casing == "lower":
                    cleaned_df[col] = cleaned_df[col].astype(str).str.lower()
                elif casing == "upper":
                    cleaned_df[col] = cleaned_df[col].astype(str).str.upper()
                else:
                    cleaned_df[col] = cleaned_df[col].astype(str).str.title()
                logs.append({
                    "operation_type": "standardize_text",
                    "summary": f"Standardized text in '{col}' to {casing}case",
                    "affected_rows": len(cleaned_df),
                    "parameters": {"column": col, "casing": casing}
                })

            elif action_type == "remove_special_chars" and col in cleaned_df.columns:
                pattern = params.get("pattern", r"[^a-zA-Z0-9\s.,-]")
                cleaned_df[col] = cleaned_df[col].astype(str).replace(pattern, "", regex=True)
                logs.append({
                    "operation_type": "remove_special_chars",
                    "summary": f"Removed special characters from '{col}'",
                    "affected_rows": len(cleaned_df),
                    "parameters": {"column": col, "pattern": pattern}
                })

            elif action_type == "normalize_dates" and col in cleaned_df.columns:
                dt_series = pd.to_datetime(cleaned_df[col], errors="coerce")
                cleaned_df[col] = dt_series.dt.strftime("%Y-%m-%d")
                logs.append({
                    "operation_type": "normalize_dates",
                    "summary": f"Normalized date formats in '{col}' to ISO YYYY-MM-DD",
                    "affected_rows": len(cleaned_df),
                    "parameters": {"column": col}
                })
                
            # 7. Outlier Handling
            elif action_type == "clip_outliers" and col in cleaned_df.columns:
                series = pd.to_numeric(cleaned_df[col], errors="coerce")
                q25 = float(series.quantile(0.25))
                q75 = float(series.quantile(0.75))
                iqr = q75 - q25
                lower_b = q25 - 1.5 * iqr
                upper_b = q75 + 1.5 * iqr
                clipped = series.clip(lower=lower_b, upper=upper_b)
                changed_cnt = int((series != clipped).sum())
                cleaned_df[col] = clipped
                logs.append({
                    "operation_type": "clip_outliers",
                    "summary": f"Capped {changed_cnt} outlier values in '{col}' to bounds [{round(lower_b, 1)}, {round(upper_b, 1)}]",
                    "affected_rows": changed_cnt,
                    "parameters": {"column": col, "lower_bound": lower_b, "upper_bound": upper_b}
                })

            elif action_type == "nullify_outliers" and col in cleaned_df.columns:
                series = pd.to_numeric(cleaned_df[col], errors="coerce")
                q25 = float(series.quantile(0.25))
                q75 = float(series.quantile(0.75))
                iqr = q75 - q25
                lower_b = q25 - 1.5 * iqr
                upper_b = q75 + 1.5 * iqr
                mask = (series < lower_b) | (series > upper_b)
                changed_cnt = int(mask.sum())
                series[mask] = np.nan
                cleaned_df[col] = series
                logs.append({
                    "operation_type": "nullify_outliers",
                    "summary": f"Set {changed_cnt} outlier values in '{col}' to NULL",
                    "affected_rows": changed_cnt,
                    "parameters": {"column": col, "lower_bound": lower_b, "upper_bound": upper_b}
                })

            elif action_type == "drop_outlier_rows" and col in cleaned_df.columns:
                before_len = len(cleaned_df)
                series = pd.to_numeric(cleaned_df[col], errors="coerce")
                q25 = float(series.quantile(0.25))
                q75 = float(series.quantile(0.75))
                iqr = q75 - q25
                lower_b = q25 - 1.5 * iqr
                upper_b = q75 + 1.5 * iqr
                cleaned_df = cleaned_df[~((series < lower_b) | (series > upper_b))]
                affected = before_len - len(cleaned_df)
                logs.append({
                    "operation_type": "drop_outlier_rows",
                    "summary": f"Dropped {affected} rows containing outlier values in '{col}'",
                    "affected_rows": affected,
                    "parameters": {"column": col}
                })
        except Exception as e:
            logs.append({
                "operation_type": action_type or "unknown",
                "summary": f"Failed operation on '{col}': {str(e)}",
                "affected_rows": 0,
                "parameters": params
            })
            
    return cleaned_df, logs

def preview_cleaning_operation(df: pd.DataFrame, action: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes a preview diff without modifying the stored dataset.
    Returns affected rows, highlighted cells, and metrics deltas.
    """
    rows_before = len(df)
    cols_before = len(df.columns)
    nulls_before = int(df.isnull().sum().sum())
    mem_before = int(df.memory_usage(deep=True).sum())
    
    cleaned_df, logs = apply_cleaning_operations(df, [action])
    
    rows_after = len(cleaned_df)
    cols_after = len(cleaned_df.columns)
    nulls_after = int(cleaned_df.isnull().sum().sum())
    mem_after = int(cleaned_df.memory_usage(deep=True).sum())
    
    summary = logs[0]["summary"] if logs else "No operation performed"
    affected_rows_count = logs[0].get("affected_rows", 0) if logs else 0
    
    # Identify changed cells
    changed_cells = []
    affected_indices = []
    
    col = action.get("column")
    action_type = action.get("action_type")
    
    if action_type in ["drop_duplicates", "drop_missing_rows", "drop_outlier_rows"]:
        # Rows were removed
        removed_indices = set(df.index) - set(cleaned_df.index)
        sample_before = df.loc[list(removed_indices)[:10]].fillna("").to_dict(orient="records")
        sample_after = []
    elif action_type == "drop_column":
        sample_before = df.head(10).fillna("").to_dict(orient="records")
        sample_after = cleaned_df.head(10).fillna("").to_dict(orient="records")
    elif col and col in df.columns and col in cleaned_df.columns:
        # Check value differences
        orig_col = df[col]
        new_col = cleaned_df[col]
        
        diff_mask = (orig_col != new_col) | (orig_col.isna() != new_col.isna())
        changed_idx_list = df[diff_mask].index.tolist()
        
        for idx in changed_idx_list[:25]:
            old_val = orig_col.loc[idx]
            new_val = new_col.loc[idx]
            changed_cells.append({
                "row_idx": int(idx),
                "column": col,
                "old_value": None if pd.isna(old_val) else str(old_val),
                "new_value": None if pd.isna(new_val) else str(new_val)
            })
            
        sample_indices = changed_idx_list[:10] if changed_idx_list else df.head(10).index.tolist()
        sample_before = df.loc[sample_indices].fillna("").to_dict(orient="records")
        sample_after = cleaned_df.loc[sample_indices].fillna("").to_dict(orient="records")
    else:
        sample_before = df.head(10).fillna("").to_dict(orient="records")
        sample_after = cleaned_df.head(10).fillna("").to_dict(orient="records")
        
    return {
        "success": True,
        "operation_type": action_type or "unknown",
        "column": col,
        "summary": summary,
        "affected_rows_count": affected_rows_count,
        "sample_before": sample_before,
        "sample_after": sample_after,
        "changed_cells": changed_cells,
        "metrics_diff": {
            "rows_before": rows_before,
            "rows_after": rows_after,
            "columns_before": cols_before,
            "columns_after": cols_after,
            "nulls_before": nulls_before,
            "nulls_after": nulls_after,
            "memory_before": mem_before,
            "memory_after": mem_after
        }
    }
