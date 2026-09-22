import pandas as pd
from typing import Dict, Any, List

def detect_relationships(datasets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    datasets: list of dicts with keys 'id', 'name', 'df' (pandas DataFrame)
    """
    relationships = []
    
    for i in range(len(datasets)):
        for j in range(i + 1, len(datasets)):
            ds1 = datasets[i]
            ds2 = datasets[j]
            df1: pd.DataFrame = ds1["df"]
            df2: pd.DataFrame = ds2["df"]
            
            # Look for common column names (case-insensitive)
            cols1_map = {str(c).lower(): c for c in df1.columns}
            cols2_map = {str(c).lower(): c for c in df2.columns}
            
            common_keys = set(cols1_map.keys()).intersection(set(cols2_map.keys()))
            
            for k in common_keys:
                c1 = cols1_map[k]
                c2 = cols2_map[k]
                
                # Check distinct values overlap
                vals1 = set(df1[c1].dropna().astype(str).unique())
                vals2 = set(df2[c2].dropna().astype(str).unique())
                
                if not vals1 or not vals2:
                    continue
                    
                intersection = vals1.intersection(vals2)
                overlap_ratio = len(intersection) / min(len(vals1), len(vals2))
                
                if overlap_ratio >= 0.2:  # at least 20% overlap
                    is_id = any(term in k for term in ["id", "code", "key", "num", "no"])
                    confidence = round(overlap_ratio * (1.2 if is_id else 0.9), 2)
                    confidence = min(1.0, confidence)
                    
                    relationships.append({
                        "source_dataset_id": ds1["id"],
                        "source_dataset_name": ds1["name"],
                        "source_column": c1,
                        "target_dataset_id": ds2["id"],
                        "target_dataset_name": ds2["name"],
                        "target_column": c2,
                        "overlap_count": len(intersection),
                        "overlap_percentage": round(overlap_ratio * 100, 1),
                        "confidence": confidence,
                        "suggested_join": "left" if len(df1) >= len(df2) else "inner",
                        "recommendation": f"These datasets appear to share '{c1}'. Would you like to merge them?"
                    })
                    
    return relationships
