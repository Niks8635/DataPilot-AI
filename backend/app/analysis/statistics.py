import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from scipy import stats

def compute_correlations(df: pd.DataFrame) -> Dict[str, Any]:
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return {
            "columns": list(numeric_df.columns),
            "matrix": [],
            "top_correlations": []
        }
        
    cols = list(numeric_df.columns)
    corr_matrix = numeric_df.corr(method="pearson").round(3)
    
    matrix_list = []
    for row in corr_matrix.values:
        matrix_list.append([None if np.isnan(v) else float(v) for v in row])
        
    top_corrs = []
    for i in range(len(cols)):
        for j in range(i + 1, len(cols)):
            c1, c2 = cols[i], cols[j]
            val = corr_matrix.loc[c1, c2]
            if not np.isnan(val):
                val_f = float(val)
                abs_val = abs(val_f)
                if abs_val >= 0.7:
                    strength = "strong_positive" if val_f > 0 else "strong_negative"
                elif abs_val >= 0.4:
                    strength = "moderate_positive" if val_f > 0 else "moderate_negative"
                else:
                    strength = "weak"
                    
                top_corrs.append({
                    "column_x": c1,
                    "column_y": c2,
                    "pearson": val_f,
                    "strength": strength
                })
                
    # Sort by absolute correlation magnitude descending
    top_corrs.sort(key=lambda x: abs(x["pearson"]), reverse=True)
    
    return {
        "columns": cols,
        "matrix": matrix_list,
        "top_correlations": top_corrs[:15]
    }

def detect_outliers_detailed(df: pd.DataFrame) -> List[Dict[str, Any]]:
    numeric_df = df.select_dtypes(include=[np.number])
    outliers_list = []
    
    for col in numeric_df.columns:
        series = numeric_df[col].dropna()
        if len(series) < 10:
            continue
            
        q25 = float(series.quantile(0.25))
        q75 = float(series.quantile(0.75))
        iqr = q75 - q25
        lower_bound = q25 - 1.5 * iqr
        upper_bound = q75 + 1.5 * iqr
        
        iqr_mask = (series < lower_bound) | (series > upper_bound)
        iqr_count = int(iqr_mask.sum())
        
        std_val = float(series.std())
        if std_val > 0:
            z_scores = np.abs(stats.zscore(series))
            zscore_count = int((z_scores > 3).sum())
        else:
            zscore_count = 0
            
        if iqr_count > 0 or zscore_count > 0:
            sample_extremes = [round(float(v), 2) for v in series[iqr_mask].head(5).tolist()]
            outliers_list.append({
                "column": col,
                "iqr_outliers_count": iqr_count,
                "zscore_outliers_count": zscore_count,
                "lower_bound": round(lower_bound, 2),
                "upper_bound": round(upper_bound, 2),
                "sample_outlier_values": sample_extremes
            })
            
    return outliers_list
