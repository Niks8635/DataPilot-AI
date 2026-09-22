import datetime
from typing import Dict, Any, List, Optional
import pandas as pd

def build_comprehensive_report_data(
    dataset_name: str,
    profile: Dict[str, Any],
    quality: Dict[str, Any],
    eda: Dict[str, Any],
    correlations: Dict[str, Any],
    outliers: List[Dict[str, Any]],
    insights: Dict[str, Any],
    cleaning_logs: List[Dict[str, Any]],
    kpis: List[Dict[str, Any]],
    include_sections: Optional[List[str]] = None,
    custom_notes: Optional[str] = None,
    forecast_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    default_sections = [
        "executive_summary", "kpis", "quality", "segments", 
        "trends", "correlations", "anomalies", "methodology", 
        "limitations", "dictionary"
    ]
    if forecast_data:
        default_sections.append("forecast")
    if custom_notes:
        default_sections.append("custom_notes")
        
    active_sections = include_sections if include_sections else default_sections
    
    # Columns dictionary
    columns_dict = []
    for col in profile.get("columns", []):
        columns_dict.append({
            "name": col["name"],
            "type": col["inferred_type"],
            "semantic_role": col.get("semantic_role", "dimension"),
            "null_count": col["null_count"],
            "null_pct": col["null_percentage"],
            "unique_count": col["unique_count"]
        })
        
    return {
        "title": f"Executive Intelligence & Analytics Report — {dataset_name}",
        "dataset_name": dataset_name,
        "author": "DataPilot AI Lead Analyst",
        "generated_at": datetime.datetime.now().strftime("%B %d, %Y • %I:%M %p"),
        "active_sections": active_sections,
        "custom_notes": custom_notes,
        "metadata": {
            "row_count": profile.get("row_count", 0),
            "column_count": profile.get("column_count", 0),
            "domain": profile.get("domain_info", {}).get("domain", "General Tabular"),
            "duplicate_count": profile.get("duplicate_rows_count", 0),
            "missing_pct": profile.get("overall_missing_percentage", 0.0)
        },
        "executive_summary": insights.get("executive_summary", ""),
        "structured_insights": insights.get("structured_insights", []),
        "kpis": kpis,
        "data_quality": {
            "score": quality.get("overall_score", 100),
            "grade": quality.get("grade", "Good"),
            "badges": quality.get("summary_badges", []),
            "issues": quality.get("issues", [])
        },
        "cleaning_history": cleaning_logs,
        "key_insights": insights.get("key_insights", []),
        "trends": insights.get("trends", []),
        "time_series_trends": eda.get("time_series_trends", []),
        "anomalies": insights.get("anomalies", []),
        "recommendations": insights.get("business_recommendations", []),
        "correlations": correlations.get("top_correlations", [])[:8],
        "multicollinearity_flags": eda.get("multicollinearity_flags", []),
        "outliers": outliers[:5],
        "top_performers": eda.get("bivariate_aggregations", [])[:3],
        "pareto_analyses": eda.get("pareto_analyses", [])[:2],
        "forecast_data": forecast_data,
        "columns_dictionary": columns_dict
    }

def generate_html_report(report_data: Dict[str, Any]) -> str:
    sections = report_data.get("active_sections", [])
    meta = report_data.get("metadata", {})
    
    # 1. Custom Notes Section
    notes_html = ""
    if "custom_notes" in sections and report_data.get("custom_notes"):
        notes_html = f"""
        <div class="section">
            <h2>Executive Commentary & Strategic Notes</h2>
            <div class="callout-box">
                <p>{report_data['custom_notes']}</p>
            </div>
        </div>
        """

    # 2. Executive Summary
    exec_html = ""
    if "executive_summary" in sections:
        structured_cards_html = "".join([
            f"""
            <div class="insight-card severity-{c.get('severity', 'neutral')}">
                <div class="insight-header">
                    <span class="insight-tag type-{c.get('type', 'finding')}">{c.get('type', 'finding').upper()}</span>
                    <span class="insight-metric">{c.get('metric', '')}: <strong>{c.get('value', '')}</strong></span>
                </div>
                <div class="insight-title">{c.get('title', '')}</div>
                <p class="insight-desc">{c.get('description', '')}</p>
                <div class="insight-calc">Formula: <code>{c.get('calculation_reference', '')}</code></div>
            </div>
            """
            for c in report_data.get("structured_insights", [])[:6]
        ])
        
        recs_list = "".join([f"<li>{r}</li>" for r in report_data.get("recommendations", [])])
        
        exec_html = f"""
        <div class="section">
            <h2>Executive Summary & Strategic Findings</h2>
            <div class="summary-box">
                <p class="lead-text">{report_data.get('executive_summary', '')}</p>
            </div>
            {f'<div class="insights-grid">{structured_cards_html}</div>' if structured_cards_html else ''}
            {f'<div class="recs-box"><h3>Strategic Recommendations</h3><ul>{recs_list}</ul></div>' if recs_list else ''}
        </div>
        """

    # 3. KPIs
    kpi_html = ""
    if "kpis" in sections and report_data.get("kpis"):
        kpis_cards = "".join([
            f"""
            <div class="kpi-card">
                <div class="kpi-label">{k.get('label', '')}</div>
                <div class="kpi-value">{k.get('formatted_value', k.get('value', ''))}</div>
                <div class="kpi-subtext">{k.get('subtext', '')}</div>
            </div>
            """
            for k in report_data.get("kpis", [])
        ])
        kpi_html = f"""
        <div class="section">
            <h2>Key Performance Indicators</h2>
            <div class="kpi-grid">{kpis_cards}</div>
        </div>
        """

    # 4. Data Quality
    qual_html = ""
    if "quality" in sections:
        q = report_data.get("data_quality", {})
        badges_html = "".join([f"<span class='badge'>{b}</span>" for b in q.get("badges", [])])
        issues_rows = "".join([
            f"<tr><td>{i.get('type', '')}</td><td>{i.get('column', 'Dataset')}</td><td><span class='severity-tag {i.get('severity', 'low')}'>{i.get('severity', 'low')}</span></td><td>{i.get('message', '')}</td><td>-{i.get('score_deduction', 0)} pts</td></tr>"
            for i in q.get("issues", [])
        ]) or "<tr><td colspan='5' style='text-align: center;'>No critical data quality issues identified.</td></tr>"
        
        qual_html = f"""
        <div class="section">
            <h2>Data Quality & Health Scorecard</h2>
            <div class="quality-score-header">
                <div class="score-circle">
                    <span class="score-num">{q.get('score', 100)}</span>
                    <span class="score-denom">/ 100</span>
                </div>
                <div>
                    <h3 style="margin:0 0 6px 0;">Overall Quality Rating: {q.get('grade', 'Good')}</h3>
                    <div class="badges-row">{badges_html}</div>
                </div>
            </div>
            <table>
                <thead>
                    <tr><th>Issue Type</th><th>Affected Column</th><th>Severity</th><th>Finding</th><th>Impact</th></tr>
                </thead>
                <tbody>{issues_rows}</tbody>
            </table>
        </div>
        """

    # 5. Segment & Pareto
    segments_html = ""
    if "segments" in sections and report_data.get("top_performers"):
        biv_tables = ""
        for biv in report_data.get("top_performers", []):
            rows_html = "".join([
                f"<tr><td>{idx+1}</td><td><strong>{r.get('category')}</strong></td><td>${r.get('sum', 0):,.2f}</td><td>${r.get('mean', 0):,.2f}</td><td>{r.get('percentage')}%</td></tr>"
                for idx, r in enumerate(biv.get("top_performers", [])[:8])
            ])
            biv_tables += f"""
            <div style="margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; color: #334155;">{biv.get('numerical_col', '').replace('_', ' ').title()} by {biv.get('category_col', '').replace('_', ' ').title()}</h4>
                <p style="font-size: 13px; color: #64748b; margin-top: 0;">{biv.get('pareto_summary', '')}</p>
                <table>
                    <thead><tr><th>#</th><th>Category</th><th>Total Sum</th><th>Mean Average</th><th>Volume Share</th></tr></thead>
                    <tbody>{rows_html}</tbody>
                </table>
            </div>
            """
        segments_html = f"""
        <div class="section">
            <h2>Segment Breakdown & Pareto Concentration</h2>
            {biv_tables}
        </div>
        """

    # 6. Forecasting Analysis (if present)
    forecast_html = ""
    if "forecast" in sections and report_data.get("forecast_data"):
        f_data = report_data["forecast_data"]
        f_metrics = f_data.get("metrics", {})
        sign = "+" if f_metrics.get("forecast_growth_percentage", 0) > 0 else ""
        
        forecast_pts = [p for p in f_data.get("chart_points", []) if p.get("forecast") is not None]
        f_rows = "".join([
            f"<tr><td>{p['date']}</td><td><strong>${p['forecast']:,.2f}</strong></td><td>${p.get('lower_bound', 0):,.2f}</td><td>${p.get('upper_bound', 0):,.2f}</td></tr>"
            for p in forecast_pts[:10]
        ])
        
        forecast_html = f"""
        <div class="section">
            <h2>Predictive Time-Series Forecast</h2>
            <div class="callout-box" style="border-left-color: #0284c7;">
                <p><strong>Model:</strong> {f_data.get('model_name', 'Holt-Winters')} • <strong>Horizon:</strong> {f_data.get('horizon', '30d')} ({f_data.get('periods_forecasted', 0)} periods)</p>
                <p>{f_data.get('narrative', '')}</p>
            </div>
            <div class="kpi-grid" style="margin: 16px 0;">
                <div class="kpi-card"><div class="kpi-label">Projected Target</div><div class="kpi-value">${f_metrics.get('projected_value', 0):,.2f}</div><div class="kpi-subtext">Baseline: ${f_metrics.get('current_value', 0):,.2f}</div></div>
                <div class="kpi-card"><div class="kpi-label">Projected Growth</div><div class="kpi-value">{sign}{f_metrics.get('forecast_growth_percentage', 0)}%</div><div class="kpi-subtext">Direction: {f_metrics.get('trend_direction', 'Stable').title()}</div></div>
                <div class="kpi-card"><div class="kpi-label">Model Accuracy (MAPE)</div><div class="kpi-value">{f_metrics.get('mape', 0)}%</div><div class="kpi-subtext">RMSE: {f_metrics.get('rmse', 0)}</div></div>
            </div>
            <table>
                <thead><tr><th>Future Period</th><th>Forecasted Point</th><th>95% CI Lower</th><th>95% CI Upper</th></tr></thead>
                <tbody>{f_rows}</tbody>
            </table>
            <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;"><em>{f_data.get('disclaimer', '')}</em></p>
        </div>
        """

    # 7. Data Dictionary
    dict_html = ""
    if "dictionary" in sections and report_data.get("columns_dictionary"):
        cols_rows = "".join([
            f"<tr><td><code>{c['name']}</code></td><td>{c['type']}</td><td><span class='badge'>{c['semantic_role']}</span></td><td>{c['null_count']} ({c['null_pct']}%)</td><td>{c['unique_count']}</td></tr>"
            for c in report_data.get("columns_dictionary", [])
        ])
        dict_html = f"""
        <div class="section">
            <h2>Dataset Schema & Data Dictionary</h2>
            <table>
                <thead><tr><th>Column Name</th><th>Inferred Type</th><th>Semantic Role</th><th>Missing Values</th><th>Distinct Count</th></tr></thead>
                <tbody>{cols_rows}</tbody>
            </table>
        </div>
        """

    # 8. Methodology
    methodology_html = ""
    if "methodology" in sections:
        methodology_html = """
        <div class="section">
            <h2>Analytical Methodology & Calculation Standards</h2>
            <div class="text-block">
                <p><strong>1. Data Profiling & Type Inference:</strong> Each column was profiled for non-null cardinality, semantic type, and data completeness. Outliers were detected using John Tukey's 1.5x Interquartile Range (IQR) threshold ($Q1 - 1.5 \times IQR$ and $Q3 + 1.5 \times IQR$).</p>
                <p><strong>2. Quality Scoring Framework:</strong> Quality ratings evaluate four dimensions: Completeness (40%), Consistency (20%), Uniqueness (20%), and Structural Hygiene (20%). Penalties apply to empty columns, duplicate rows, and excessive missing ratios.</p>
                <p><strong>3. Time-Series Forecasting:</strong> Forecasting employs Holt-Winters Exponential Smoothing with additive trend and seasonal components, combined with 95% confidence intervals ($z = 1.96$) derived from historical residual variance.</p>
            </div>
        </div>
        """

    # 9. Limitations
    limitations_html = ""
    if "limitations" in sections:
        limitations_html = f"""
        <div class="section">
            <h2>Data Limitations & Analytical Assumptions</h2>
            <div class="text-block">
                <ul>
                    <li>All insights and correlations reflect historical observations within the ingested dataset ({meta.get('row_count', 0):,} rows) and should not be assumed to extrapolate indefinitely.</li>
                    <li>Statistical correlation does not imply direct business causality. External market variables not captured in this file may influence metrics.</li>
                    <li>Predictive models assume stationarity in underlying trends; significant external shocks or operational strategy shifts may alter trajectories.</li>
                </ul>
            </div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{report_data['title']}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
        }}
        .report-container {{
            max-width: 900px;
            margin: 0 auto;
        }}
        .no-print-toolbar {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }}
        .print-btn {{
            background: #2563eb;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
        }}
        .print-btn:hover {{ background: #1d4ed8; }}
        .header {{
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }}
        .brand {{
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #2563eb;
            margin-bottom: 6px;
        }}
        h1 {{
            font-size: 26px;
            margin: 0 0 8px 0;
            font-weight: 800;
            color: #0f172a;
        }}
        .meta-row {{
            color: #64748b;
            font-size: 13px;
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }}
        .section {{
            margin-bottom: 36px;
            page-break-inside: avoid;
        }}
        h2 {{
            font-size: 18px;
            border-left: 4px solid #2563eb;
            padding-left: 12px;
            margin: 0 0 16px 0;
            color: #1e293b;
        }}
        .summary-box {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 18px;
            margin-bottom: 20px;
        }}
        .lead-text {{
            font-size: 15px;
            color: #334155;
            margin: 0;
            line-height: 1.6;
        }}
        .insights-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
        }}
        .insight-card {{
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            background: #ffffff;
        }}
        .insight-card.severity-critical {{ border-left: 4px solid #ef4444; }}
        .insight-card.severity-warning {{ border-left: 4px solid #f59e0b; }}
        .insight-card.severity-positive {{ border-left: 4px solid #10b981; }}
        .insight-card.severity-neutral {{ border-left: 4px solid #64748b; }}
        .insight-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            margin-bottom: 6px;
        }}
        .insight-tag {{
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: #e2e8f0;
            color: #334155;
        }}
        .insight-title {{
            font-weight: 700;
            font-size: 13px;
            color: #0f172a;
            margin-bottom: 4px;
        }}
        .insight-desc {{
            font-size: 12px;
            color: #475569;
            margin: 0 0 8px 0;
            line-height: 1.4;
        }}
        .insight-calc {{
            font-size: 10px;
            color: #94a3b8;
        }}
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }}
        .kpi-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
        }}
        .kpi-label {{
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: #64748b;
            margin-bottom: 4px;
        }}
        .kpi-value {{
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
        }}
        .kpi-subtext {{
            font-size: 11px;
            color: #94a3b8;
            margin-top: 4px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 10px;
        }}
        th, td {{
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
        }}
        th {{
            background-color: #f8fafc;
            color: #475569;
            font-weight: 600;
        }}
        .badge {{
            display: inline-block;
            background: #e2e8f0;
            color: #334155;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }}
        .quality-score-header {{
            display: flex;
            align-items: center;
            gap: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
        }}
        .score-circle {{
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: #2563eb;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }}
        .score-num {{ font-size: 22px; font-weight: 800; line-height: 1; }}
        .score-denom {{ font-size: 10px; opacity: 0.8; }}
        .badges-row {{ display: flex; gap: 8px; margin-top: 4px; }}
        .severity-tag {{
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .severity-tag.critical {{ background: #fee2e2; color: #dc2626; }}
        .severity-tag.high {{ background: #ffedd5; color: #ea580c; }}
        .severity-tag.medium {{ background: #fef3c7; color: #d97706; }}
        .severity-tag.low {{ background: #f1f5f9; color: #64748b; }}
        .callout-box {{
            background: #f0f9ff;
            border-left: 4px solid #0284c7;
            padding: 14px 18px;
            border-radius: 0 6px 6px 0;
            margin-bottom: 16px;
            font-size: 13px;
        }}
        .recs-box {{
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
        }}
        .recs-box h3 {{ margin: 0 0 8px 0; font-size: 14px; color: #166534; }}
        .recs-box ul {{ margin: 0; padding-left: 20px; font-size: 13px; color: #15803d; }}
        .text-block {{ font-size: 13px; color: #475569; line-height: 1.6; }}
        
        @media print {{
            body {{ padding: 0; background: #ffffff; }}
            .no-print-toolbar {{ display: none; }}
            .section {{ page-break-inside: avoid; }}
            @page {{ margin: 15mm; size: auto; }}
        }}
    </style>
</head>
<body>
    <div class="report-container">
        <div class="no-print-toolbar">
            <span style="font-size: 13px; color: #64748b;">Ready to export or print this executive report.</span>
            <button class="print-btn" onclick="window.print()">Print to PDF / Download</button>
        </div>
        
        <div class="header">
            <div class="brand">DataPilot AI • Executive Intelligence Report</div>
            <h1>{report_data['title']}</h1>
            <div class="meta-row">
                <span><strong>Dataset:</strong> {report_data['dataset_name']} ({meta.get('domain', 'General')})</span>
                <span><strong>Records:</strong> {meta.get('row_count', 0):,} rows • {meta.get('column_count', 0)} columns</span>
                <span><strong>Generated:</strong> {report_data['generated_at']}</span>
            </div>
        </div>

        {notes_html}
        {exec_html}
        {kpi_html}
        {qual_html}
        {segments_html}
        {forecast_html}
        {dict_html}
        {methodology_html}
        {limitations_html}
    </div>
</body>
</html>
"""
    return html
