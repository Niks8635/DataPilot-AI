import numpy as np
import pandas as pd
from typing import Dict, Any, List
from scipy import stats

def compute_data_quality(df: pd.DataFrame, profile: Dict[str, Any]) -> Dict[str, Any]:
    row_count = profile["row_count"]
    col_count = profile["column_count"]
    duplicate_rows = profile["duplicate_rows_count"]
    total_missing = profile["total_missing_values"]
    total_cells = row_count * col_count if (row_count * col_count) > 0 else 1
    
    issues: List[Dict[str, Any]] = []
    badges: List[str] = []
    
    # 1. Structural Health
    structural_deductions = 0.0
    empty_cols = [c["name"] for c in profile["columns"] if c["is_empty"]]
    if empty_cols:
        deduction = min(20.0, len(empty_cols) * 10.0)
        structural_deductions += deduction
        issues.append({
            "type": "empty_column",
            "column": ", ".join(empty_cols[:3]),
            "severity": "critical",
            "message": f"Found {len(empty_cols)} completely empty column(s) with zero data.",
            "impact_count": len(empty_cols),
            "score_deduction": deduction
        })
        badges.append(f"⚠ {len(empty_cols)} empty columns")
        
    constant_cols = [c["name"] for c in profile["columns"] if c["is_constant"] and not c["is_empty"]]
    if constant_cols:
        deduction = min(15.0, len(constant_cols) * 5.0)
        structural_deductions += deduction
        issues.append({
            "type": "constant_column",
            "column": ", ".join(constant_cols[:3]),
            "severity": "medium",
            "message": f"{len(constant_cols)} column(s) have only 1 unique constant value across all rows.",
            "impact_count": len(constant_cols),
            "score_deduction": deduction
        })
        badges.append(f"ℹ {len(constant_cols)} constant columns")
        
    structural_score = max(0.0, 100.0 - structural_deductions)
    if not empty_cols and not constant_cols:
        badges.append("✓ Excellent structure")
        
    # 2. Completeness
    missing_ratio = total_missing / total_cells
    completeness_deduction = min(40.0, round(missing_ratio * 150.0, 1))
    completeness_score = max(0.0, 100.0 - completeness_deduction)
    
    if total_missing > 0:
        high_null_cols = [c["name"] for c in profile["columns"] if c["null_percentage"] > 20.0]
        issues.append({
            "type": "missing_values",
            "column": ", ".join(high_null_cols[:3]) if high_null_cols else None,
            "severity": "high" if missing_ratio > 0.1 else "medium",
            "message": f"{total_missing:,} missing values detected across dataset ({round(missing_ratio*100, 1)}% of all cells).",
            "impact_count": total_missing,
            "score_deduction": completeness_deduction
        })
        badges.append(f"⚠ {total_missing} missing values")
    else:
        badges.append("✓ Zero missing values")
        
    # 3. Uniqueness
    duplicate_ratio = duplicate_rows / row_count if row_count > 0 else 0.0
    uniqueness_deduction = min(30.0, round(duplicate_ratio * 200.0, 1))
    uniqueness_score = max(0.0, 100.0 - uniqueness_deduction)
    
    if duplicate_rows > 0:
        issues.append({
            "type": "duplicate_rows",
            "column": None,
            "severity": "high" if duplicate_rows > 10 else "medium",
            "message": f"{duplicate_rows:,} duplicate rows detected ({round(duplicate_ratio*100, 1)}% of total rows).",
            "impact_count": duplicate_rows,
            "score_deduction": uniqueness_deduction
        })
        badges.append(f"⚠ {duplicate_rows} duplicate rows")
    else:
        badges.append("✓ Zero duplicate rows")
        
    # 4. Consistency & Outliers
    consistency_deductions = 0.0
    total_outliers = 0
    for col in profile["columns"]:
        if col.get("numerical_stats"):
            num_s = col["numerical_stats"]
            outliers_cnt = num_s.get("outliers_iqr_count", 0)
            if outliers_cnt > 0:
                total_outliers += outliers_cnt
                
    if total_outliers > 0:
        outlier_deduction = min(15.0, round((total_outliers / row_count) * 50.0, 1))
        consistency_deductions += outlier_deduction
        issues.append({
            "type": "outliers",
            "column": None,
            "severity": "low" if outlier_deduction < 5 else "medium",
            "message": f"{total_outliers} potential statistical outlier values identified.",
            "impact_count": total_outliers,
            "score_deduction": outlier_deduction
        })
        badges.append(f"ℹ {total_outliers} statistical outliers")
        
    consistency_score = max(0.0, 100.0 - consistency_deductions)
    
    # Overall weighted score
    overall_score = round(
        (0.25 * structural_score) +
        (0.35 * completeness_score) +
        (0.25 * uniqueness_score) +
        (0.15 * consistency_score),
        1
    )
    
    if overall_score >= 90:
        grade = "Excellent"
    elif overall_score >= 75:
        grade = "Good"
    elif overall_score >= 60:
        grade = "Fair"
    elif overall_score >= 40:
        grade = "Needs Attention"
    else:
        grade = "Poor"
        
    return {
        "overall_score": overall_score,
        "grade": grade,
        "summary_badges": badges,
        "structural_health": round(structural_score, 1),
        "completeness_score": round(completeness_score, 1),
        "uniqueness_score": round(uniqueness_score, 1),
        "consistency_score": round(consistency_score, 1),
        "issues": issues
    }
