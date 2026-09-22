import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

def recommend_kpis(df: pd.DataFrame, profile: Dict[str, Any], quality: Dict[str, Any]) -> List[Dict[str, Any]]:
    kpis = []
    row_count = len(df)
    
    # 1. Total Records
    kpis.append({
        "id": "kpi_total_records",
        "label": "Total Records",
        "value": row_count,
        "formatted_value": f"{row_count:,}",
        "change_percentage": None,
        "subtext": f"{profile.get('column_count', 0)} tracked columns",
        "trend_direction": "neutral",
        "icon_name": "Database"
    })
    
    # 2. Primary Financial / Quantity Metric (e.g., Revenue, Sales, Profit, Amount)
    numeric_cols = [c["name"] for c in profile.get("columns", []) if c.get("inferred_type") == "numerical"]
    
    financial_keywords = ["revenue", "sales", "turnover", "total", "amount", "spend", "cost", "profit"]
    primary_num_col = None
    for kw in financial_keywords:
        for c in numeric_cols:
            if kw in c.lower():
                primary_num_col = c
                break
        if primary_num_col:
            break
            
    if not primary_num_col and numeric_cols:
        primary_num_col = numeric_cols[0]
        
    if primary_num_col:
        col_sum = float(df[primary_num_col].sum())
        col_mean = float(df[primary_num_col].mean())
        
        # Format gracefully
        if col_sum >= 1_000_000:
            formatted_sum = f"${col_sum/1_000_000:.2f}M" if any(k in primary_num_col.lower() for k in ["price", "rev", "cost", "profit", "sales"]) else f"{col_sum/1_000_000:.2f}M"
        elif col_sum >= 1_000:
            formatted_sum = f"${col_sum/1_000:.1f}K" if any(k in primary_num_col.lower() for k in ["price", "rev", "cost", "profit", "sales"]) else f"{col_sum/1_000:.1f}K"
        else:
            formatted_sum = f"${col_sum:,.2f}" if any(k in primary_num_col.lower() for k in ["price", "rev", "cost", "profit", "sales"]) else f"{col_sum:,.2f}"
            
        kpis.append({
            "id": f"kpi_sum_{primary_num_col}",
            "label": f"Total {primary_num_col.replace('_', ' ')}",
            "value": round(col_sum, 2),
            "formatted_value": formatted_sum,
            "change_percentage": None,
            "subtext": f"Avg: {round(col_mean, 2):,}",
            "trend_direction": "up",
            "icon_name": "TrendingUp"
        })
        
    # 3. Secondary Metric (e.g., Profit or another numeric column)
    secondary_keywords = ["profit", "margin", "quantity", "volume", "count"]
    secondary_col = None
    for kw in secondary_keywords:
        for c in numeric_cols:
            if kw in c.lower() and c != primary_num_col:
                secondary_col = c
                break
        if secondary_col:
            break
            
    if secondary_col:
        sec_sum = float(df[secondary_col].sum())
        sec_mean = float(df[secondary_col].mean())
        if sec_sum >= 1_000_000:
            f_val = f"${sec_sum/1_000_000:.2f}M" if "profit" in secondary_col.lower() else f"{sec_sum/1_000_000:.2f}M"
        elif sec_sum >= 1_000:
            f_val = f"${sec_sum/1_000:.1f}K" if "profit" in secondary_col.lower() else f"{sec_sum/1_000:.1f}K"
        else:
            f_val = f"${sec_sum:,.2f}" if "profit" in secondary_col.lower() else f"{sec_sum:,.2f}"
            
        kpis.append({
            "id": f"kpi_sec_{secondary_col}",
            "label": f"Total {secondary_col.replace('_', ' ')}",
            "value": round(sec_sum, 2),
            "formatted_value": f_val,
            "change_percentage": None,
            "subtext": f"Avg: {round(sec_mean, 2):,}",
            "trend_direction": "up" if sec_sum > 0 else "down",
            "icon_name": "DollarSign" if "profit" in secondary_col.lower() else "Layers"
        })
        
    # 4. Data Quality Score KPI
    q_score = quality.get("overall_score", 100.0)
    kpis.append({
        "id": "kpi_quality_score",
        "label": "Data Quality Score",
        "value": q_score,
        "formatted_value": f"{q_score}/100",
        "change_percentage": None,
        "subtext": f"Status: {quality.get('grade', 'Good')}",
        "trend_direction": "up" if q_score >= 80 else "down",
        "icon_name": "ShieldCheck"
    })
    
    return kpis

def generate_recommended_charts(df: pd.DataFrame, profile: Dict[str, Any], eda: Dict[str, Any]) -> List[Dict[str, Any]]:
    charts = []
    
    num_cols = eda.get("numerical_columns", [])
    cat_cols = eda.get("categorical_columns", [])
    dt_cols = eda.get("datetime_columns", [])
    
    # 1. Time Series Chart (if date exists)
    time_trends = eda.get("time_series_trends", [])
    if time_trends:
        trend = time_trends[0]
        pts = trend.get("points", [])
        if pts:
            charts.append({
                "priority": 1,
                "category": "trend",
                "title": f"{trend['numerical_col'].replace('_', ' ')} over Time",
                "rationale": f"Shows chronological trend with {trend['growth_rate_percentage']}% overall movement.",
                "config": {
                    "chart_id": "chart_time_series_main",
                    "chart_type": "line",
                    "title": f"{trend['numerical_col'].replace('_', ' ')} Trend",
                    "subtitle": f"Timeline analyzed by {trend['datetime_col']}",
                    "x_axis_title": "Date",
                    "y_axis_title": trend["numerical_col"],
                    "x_data": [p["date"] for p in pts],
                    "y_data": [p["value"] for p in pts],
                    "series": [{"name": trend["numerical_col"], "data": [p["value"] for p in pts]}],
                    "summary_text": f"Growth rate across the measured timeframe is {trend['growth_rate_percentage']}%."
                }
            })
            
    # 2. Categorical Comparison (Bar Chart)
    bivariate = eda.get("bivariate_aggregations", [])
    if bivariate:
        top_biv = bivariate[0]
        items = top_biv.get("top_performers", [])
        if items:
            cat_name = top_biv["category_col"]
            num_name = top_biv["numerical_col"]
            
            is_horiz = len(items) > 5
            charts.append({
                "priority": 2,
                "category": "comparison",
                "title": f"{num_name.replace('_', ' ')} by {cat_name.replace('_', ' ')}",
                "rationale": f"Compares key performance distribution across top {cat_name} categories.",
                "config": {
                    "chart_id": f"chart_cat_{cat_name}_{num_name}",
                    "chart_type": "horizontal_bar" if is_horiz else "bar",
                    "title": f"{num_name.replace('_', ' ')} by {cat_name.replace('_', ' ')}",
                    "subtitle": f"Top {len(items)} {cat_name} segments",
                    "x_axis_title": cat_name if not is_horiz else num_name,
                    "y_axis_title": num_name if not is_horiz else cat_name,
                    "x_data": [i["category"] for i in items],
                    "y_data": [i["sum"] for i in items],
                    "series": [{"name": num_name, "data": [i["sum"] for i in items]}],
                    "summary_text": f"Top performer '{items[0]['category']}' accounts for {items[0]['percentage']}% of total."
                }
            })
            
    # 3. Categorical Proportions (Donut / Pie Chart)
    if len(bivariate) > 1:
        second_biv = bivariate[1]
        items = second_biv.get("top_performers", [])
        if items and len(items) <= 7:
            charts.append({
                "priority": 3,
                "category": "distribution",
                "title": f"Share of {second_biv['numerical_col'].replace('_', ' ')} by {second_biv['category_col'].replace('_', ' ')}",
                "rationale": "Displays proportional composition and relative share.",
                "config": {
                    "chart_id": f"chart_pie_{second_biv['category_col']}",
                    "chart_type": "donut",
                    "title": f"Share of {second_biv['numerical_col'].replace('_', ' ')} by {second_biv['category_col'].replace('_', ' ')}",
                    "subtitle": "Proportional segment breakdown",
                    "x_data": [i["category"] for i in items],
                    "y_data": [i["sum"] for i in items],
                    "series": [{"name": "Share", "data": [{"name": i["category"], "value": i["sum"]} for i in items]}],
                    "summary_text": f"Top category constitutes {items[0]['percentage']}% of the group."
                }
            })
            
    # 4. Scatter Plot (Two Numerical Columns)
    if len(num_cols) >= 2:
        col1, col2 = num_cols[0], num_cols[1]
        sample_df = df[[col1, col2]].dropna().head(100)
        charts.append({
            "priority": 4,
            "category": "relationship",
            "title": f"{col1.replace('_', ' ')} vs. {col2.replace('_', ' ')} Relationship",
            "rationale": f"Explores correlation and bivariate scatter between {col1} and {col2}.",
            "config": {
                "chart_id": f"chart_scatter_{col1}_{col2}",
                "chart_type": "scatter",
                "title": f"{col1.replace('_', ' ')} vs {col2.replace('_', ' ')}",
                "subtitle": "Sampled relationship analysis",
                "x_axis_title": col1,
                "y_axis_title": col2,
                "x_data": [round(float(v), 2) for v in sample_df[col1].tolist()],
                "y_data": [round(float(v), 2) for v in sample_df[col2].tolist()],
                "series": [{
                    "name": f"{col1} vs {col2}",
                    "data": [[round(float(r[col1]), 2), round(float(r[col2]), 2)] for _, r in sample_df.iterrows()]
                }],
                "summary_text": f"Scatter distribution of {col1} against {col2}."
            }
        })
        
    # 5. Histogram / Distribution
    distributions = eda.get("distributions", [])
    if distributions:
        dist = distributions[0]
        bins = dist.get("bins", [])
        counts = dist.get("counts", [])
        bin_labels = [f"{bins[i]}-{bins[i+1]}" for i in range(len(counts)) if i+1 < len(bins)]
        charts.append({
            "priority": 5,
            "category": "distribution",
            "title": f"Distribution of {dist['column'].replace('_', ' ')}",
            "rationale": f"Illustrates spread, skew, and concentration for {dist['column']}.",
            "config": {
                "chart_id": f"chart_hist_{dist['column']}",
                "chart_type": "bar",
                "title": f"{dist['column'].replace('_', ' ')} Frequency Distribution",
                "subtitle": f"Mean: {dist['mean']}, Median: {dist['median']}",
                "x_axis_title": "Range",
                "y_axis_title": "Frequency",
                "x_data": bin_labels,
                "y_data": counts,
                "series": [{"name": "Count", "data": counts}],
                "summary_text": f"Normal spread with mean {dist['mean']} and median {dist['median']}."
            }
        })

    return charts
