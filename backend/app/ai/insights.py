import json
import re
from typing import Dict, Any, List, Optional
from app.ai.provider import llm_provider

def generate_ai_insights(
    profile: Dict[str, Any],
    quality: Dict[str, Any],
    eda: Dict[str, Any],
    correlations: Dict[str, Any],
    outliers: List[Dict[str, Any]],
    focus_prompt: Optional[str] = None,
    detail_level: str = "brief"
) -> Dict[str, Any]:
    # 1. First build deterministic, fact-grounded structured insights
    fallback_insights = build_rule_based_insights(profile, quality, eda, correlations, outliers, focus_prompt, detail_level)
    
    # 2. Attempt LLM generation if credentials exist
    system_prompt = (
        "You are an elite Senior Partner and Lead Data Analyst at McKinsey/BCG. "
        "Your task is to analyze computed statistical metrics and provide sharp, executive-ready insights. "
        "CRITICAL RULES:\n"
        "1. NEVER invent or hallucinate any numbers. Every number, percentage, or entity you mention MUST exist in the provided COMPUTED METRICS JSON.\n"
        "2. Frame takeaways around business impact, risk mitigation, and growth opportunities.\n"
        "3. Respond ONLY with valid JSON matching the exact schema below, with NO extra markdown or conversational fluff."
    )
    
    schema_template = {
        "executive_summary": "Crisp executive summary synthesized from the metrics.",
        "key_insights": ["Insight 1 with exact numbers", "Insight 2", "Insight 3", "Insight 4"],
        "trends": ["Chronological or category trend 1", "Trend 2"],
        "anomalies": ["Outlier or quality anomaly 1", "Anomaly 2"],
        "business_recommendations": ["Actionable recommendation 1", "Recommendation 2"],
        "potential_questions": ["Question 1 you can ask next", "Question 2", "Question 3"]
    }
    
    user_payload = {
        "dataset_summary": {
            "rows": profile.get("row_count"),
            "columns": profile.get("column_count"),
            "quality_score": quality.get("overall_score"),
            "missing_count": profile.get("total_missing_values"),
            "duplicate_count": profile.get("duplicate_rows_count"),
            "domain": profile.get("domain_info", {}).get("domain")
        },
        "focus_prompt": focus_prompt or "General holistic performance",
        "detail_level": detail_level,
        "bivariate_aggregations": eda.get("bivariate_aggregations", [])[:2],
        "pareto_analyses": eda.get("pareto_analyses", [])[:2],
        "time_series_trends": eda.get("time_series_trends", [])[:2],
        "top_correlations": correlations.get("top_correlations", [])[:4],
        "outlier_summaries": outliers[:3],
        "entity_concentration": eda.get("entity_concentration")
    }
    
    user_prompt = (
        f"Analyze these computed analytics results and output JSON matching this template:\n"
        f"{json.dumps(schema_template, indent=2)}\n\n"
        f"COMPUTED METRICS:\n{json.dumps(user_payload, indent=2)}"
    )
    
    llm_output = llm_provider.generate_completion(system_prompt, user_prompt)
    if llm_output:
        try:
            clean_str = re.sub(r"^```json\s*", "", llm_output.strip(), flags=re.MULTILINE)
            clean_str = re.sub(r"^```\s*$", "", clean_str.strip(), flags=re.MULTILINE)
            parsed = json.loads(clean_str)
            
            if all(k in parsed for k in ["executive_summary", "key_insights", "trends", "anomalies", "business_recommendations", "potential_questions"]):
                parsed["structured_insights"] = fallback_insights.get("structured_insights", [])
                parsed["detail_level"] = detail_level
                parsed["focus_prompt"] = focus_prompt
                return parsed
        except Exception:
            pass
            
    return fallback_insights

def build_rule_based_insights(
    profile: Dict[str, Any],
    quality: Dict[str, Any],
    eda: Dict[str, Any],
    correlations: Dict[str, Any],
    outliers: List[Dict[str, Any]],
    focus_prompt: Optional[str] = None,
    detail_level: str = "brief"
) -> Dict[str, Any]:
    rows = profile.get("row_count", 0)
    cols = profile.get("column_count", 0)
    q_score = quality.get("overall_score", 100)
    domain = profile.get("domain_info", {}).get("domain", "General Tabular")
    
    structured_insights = []
    insights = []
    trends = []
    anomalies = []
    recs = []
    questions = []
    
    # 1. Bivariate & Pareto Findings
    biv = eda.get("bivariate_aggregations", [])
    pareto_list = eda.get("pareto_analyses", [])
    if biv:
        top_group = biv[0]
        c_col = top_group["category_col"]
        n_col = top_group["numerical_col"]
        performers = top_group.get("top_performers", [])
        if performers:
            top_p = performers[0]
            val_fmt = f"${top_p['sum']:,.2f}" if any(m in n_col.lower() for m in ["sales", "revenue", "price", "profit", "cost"]) else f"{top_p['sum']:,.2f}"
            share_pct = top_p['percentage']
            
            card = {
                "title": f"Leading Segment: '{top_p['category']}' Captures {share_pct}% of {n_col.replace('_', ' ').title()}",
                "type": "opportunity" if share_pct > 30 else "finding",
                "description": f"The top performing category '{top_p['category']}' generated {val_fmt} in aggregate {n_col.replace('_', ' ')}, accounting for {share_pct}% of total volume across all {c_col} groups.",
                "metric": n_col.replace('_', ' ').title(),
                "value": val_fmt,
                "comparison": f"{share_pct}% of total volume",
                "severity": "positive" if share_pct > 30 else "neutral",
                "source_columns": [c_col, n_col],
                "calculation_reference": f"SUM({n_col}) GROUP BY {c_col} ORDER BY SUM({n_col}) DESC"
            }
            structured_insights.append(card)
            insights.append(card["title"])
            recs.append(f"Double down on high-performing segment '{top_p['category']}' to capitalize on proven unit economics and customer demand.")
            questions.append(f"What are the top 5 {c_col} by {n_col}?")

    # Pareto concentration card
    if pareto_list:
        p_item = pareto_list[0]
        p_dim = p_item["dimension"]
        p_met = p_item["metric"]
        top_3_pct = p_item["top_3_share_pct"]
        pareto_card = {
            "title": f"High Concentration: Top 3 {p_dim} Account for {top_3_pct}% of {p_met.replace('_', ' ').title()}",
            "type": "risk" if top_3_pct > 70 else "finding",
            "description": f"Significant revenue concentration observed where the top 3 {p_dim} groups represent {top_3_pct}% of total {p_met.replace('_', ' ')}. {p_item['pareto_summary']}",
            "metric": f"{p_met.replace('_', ' ').title()} Concentration",
            "value": f"{top_3_pct}%",
            "comparison": f"Top 3 vs Remaining {p_item['total_categories_count'] - 3} categories",
            "severity": "warning" if top_3_pct > 70 else "neutral",
            "source_columns": [p_dim, p_met],
            "calculation_reference": f"SUM({p_met}) top 3 categories / SUM({p_met}) total"
        }
        structured_insights.append(pareto_card)

    # 2. Time-Series Trends
    time_trends = eda.get("time_series_trends", [])
    if time_trends:
        t = time_trends[0]
        n_name = t["numerical_col"].replace('_', ' ').title()
        dt_name = t["datetime_col"]
        g_rate = t.get("growth_rate_percentage", 0.0)
        direction = t.get("trend_direction", "stable")
        direction_sign = "+" if g_rate > 0 else ""
        
        trend_card = {
            "title": f"Chronological Trajectory: {n_name} Trending {direction.title()} ({direction_sign}{g_rate}%)",
            "type": "trend",
            "description": f"Analysis over {t.get('frequency_label', 'periodic')} intervals indicates {n_name} grew by {direction_sign}{g_rate}% from start to finish, with an average periodic growth rate of {t.get('average_periodic_growth', 0.0)}%.",
            "metric": f"{n_name} Net Growth",
            "value": f"{direction_sign}{g_rate}%",
            "comparison": f"Periodic trajectory ({direction})",
            "severity": "positive" if g_rate > 5 else "warning" if g_rate < -5 else "neutral",
            "source_columns": [dt_name, t["numerical_col"]],
            "calculation_reference": f"(Final_{n_name} - Initial_{n_name}) / Initial_{n_name} * 100"
        }
        structured_insights.append(trend_card)
        trends.append(f"{n_name} registered an overall net change of {direction_sign}{g_rate}% across the recorded timeline.")
        questions.append(f"Forecast next month's {t['numerical_col']}.")
    else:
        trends.append("Dataset metrics are distributed across non-temporal dimensional coordinates.")

    # 3. Correlation & Multicollinearity
    top_corrs = correlations.get("top_correlations", [])
    if top_corrs:
        tc = top_corrs[0]
        c1, c2, p_val = tc["column_x"], tc["column_y"], tc["pearson"]
        c_type = "opportunity" if p_val > 0.6 else "risk" if p_val < -0.6 else "finding"
        
        corr_card = {
            "title": f"Correlation Driver: {c1.replace('_', ' ').title()} and {c2.replace('_', ' ').title()} (r = {p_val})",
            "type": c_type,
            "description": f"Statistical correlation testing reveals a {tc.get('strength', 'significant')} linear co-movement between '{c1}' and '{c2}'. Changes in '{c1}' strongly mirror movements in '{c2}'.",
            "metric": "Pearson Correlation (r)",
            "value": str(p_val),
            "comparison": "Statistically significant linear association",
            "severity": "positive" if p_val > 0.6 else "warning" if p_val < -0.6 else "neutral",
            "source_columns": [c1, c2],
            "calculation_reference": f"Pearson Correlation Coefficient cov({c1}, {c2}) / (std({c1}) * std({c2}))"
        }
        structured_insights.append(corr_card)
        insights.append(f"Strong co-movement (r = {p_val}) between {c1.replace('_', ' ')} and {c2.replace('_', ' ')}.")
        questions.append(f"Compare correlation between {c1} and {c2}.")

    # 4. Outliers & Anomalies
    if outliers:
        out = outliers[0]
        c_name = out["column"]
        out_cnt = out["iqr_outliers_count"]
        out_card = {
            "title": f"Statistical Anomaly: {out_cnt} Outlier Records in '{c_name}'",
            "type": "anomaly",
            "description": f"Identified {out_cnt} records exceeding the 1.5x IQR statistical threshold (normal expected range: [{out['lower_bound']}, {out['upper_bound']}]).",
            "metric": "IQR Outlier Count",
            "value": str(out_cnt),
            "comparison": f"Outside normal band [{out['lower_bound']}, {out['upper_bound']}]",
            "severity": "warning" if out_cnt > 10 else "neutral",
            "source_columns": [c_name],
            "calculation_reference": f"Values < Q25 - 1.5*IQR or > Q75 + 1.5*IQR (IQR = {round(out['upper_bound'] - out['lower_bound'], 1)})"
        }
        structured_insights.append(out_card)
        anomalies.append(f"{out_cnt} outliers identified in '{c_name}' outside [{out['lower_bound']}, {out['upper_bound']}].")
        recs.append(f"Audit outlier values in '{c_name}' using Data Cleaning Studio to prevent skewed predictive modeling.")

    # 5. Entity Concentration Risk
    ent_conc = eda.get("entity_concentration")
    if ent_conc:
        ent_col = ent_conc["entity_column"]
        ent_met = ent_conc["metric_column"]
        share = ent_conc["top_10_pct_share"]
        risk = ent_conc["risk_level"]
        
        ent_card = {
            "title": f"Account Concentration: Top 10% of {ent_col} Drive {share}% of {ent_met.replace('_', ' ').title()}",
            "type": "risk" if risk == "High" else "finding",
            "description": ent_conc["summary"],
            "metric": "Top Decile Share",
            "value": f"{share}%",
            "comparison": f"Risk rating: {risk}",
            "severity": "critical" if risk == "High" else "warning" if risk == "Moderate" else "positive",
            "source_columns": [ent_col, ent_met],
            "calculation_reference": f"SUM({ent_met} for top 10% {ent_col}) / Total SUM({ent_met})"
        }
        structured_insights.append(ent_card)
        if risk == "High":
            recs.append(f"Implement key-account mitigation strategies: heavy reliance on top {ent_col} leaves operations vulnerable to churn.")

    # 6. Quality Card
    if q_score < 90:
        q_card = {
            "title": f"Data Integrity Notice: Dataset Quality Rated {q_score}/100",
            "type": "anomaly",
            "description": f"Quality evaluation flagged {len(quality.get('issues', []))} issues affecting structural completeness and uniqueness.",
            "metric": "Quality Score",
            "value": f"{q_score}/100",
            "comparison": f"Grade: {quality.get('grade', 'Fair')}",
            "severity": "critical" if q_score < 75 else "warning",
            "source_columns": [i.get("column") for i in quality.get("issues", []) if i.get("column")],
            "calculation_reference": "Weighted sum of Completeness, Uniqueness, Consistency, and Structural Health"
        }
        structured_insights.append(q_card)

    if not recs:
        recs.append("Establish ongoing monitoring dashboards to track volumetric fluctuations across primary dimensions.")
        recs.append("Incorporate automated data validation pipelines to prevent future nulls and duplicate entries.")

    if not questions:
        questions.append("What are the top 5 categories by sales?")
        questions.append("What is the average transaction value?")
        questions.append("Show monthly growth trends.")

    # Tailor Executive Summary narrative
    exec_sum = (
        f"The {domain} dataset comprises {rows:,} verified records across {cols} columns with an overall "
        f"Data Quality Score of {q_score}/100. "
    )
    if structured_insights:
        top_lead = structured_insights[0]
        exec_sum += f"Core operational performance is driven primarily by {top_lead['title']}. "
    if time_trends and time_trends[0].get("growth_rate_percentage") is not None:
        g = time_trends[0]["growth_rate_percentage"]
        sign = "+" if g > 0 else ""
        exec_sum += f"Chronological metrics reflect an overall {time_trends[0]['trend_direction']} trend ({sign}{g}% net change). "
    if outliers:
        exec_sum += f"Statistical evaluation identified {outliers[0]['iqr_outliers_count']} outlier instances requiring governance."

    # Filter by detail level
    if detail_level == "brief":
        displayed_cards = structured_insights[:5]
    else:
        displayed_cards = structured_insights

    return {
        "executive_summary": exec_sum,
        "structured_insights": displayed_cards,
        "key_insights": insights,
        "trends": trends,
        "anomalies": anomalies,
        "business_recommendations": recs,
        "potential_questions": questions,
        "detail_level": detail_level,
        "focus_prompt": focus_prompt
    }
