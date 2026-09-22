import io
from typing import Dict, Any, List, Optional
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import pandas as pd

def style_header_row(ws, max_col: int):
    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    align = Alignment(horizontal="left", vertical="center")
    
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='1E293B'),
        bottom=Side(style='medium', color='0F172A')
    )
    
    for col in range(1, max_col + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = align
        cell.border = thin_border
    ws.row_dimensions[1].height = 26

def autofit_column_widths(ws):
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

def build_multi_tab_excel(
    df_raw: pd.DataFrame,
    df_cleaned: pd.DataFrame,
    profile: Dict[str, Any],
    quality: Dict[str, Any],
    eda: Dict[str, Any],
    insights: Dict[str, Any],
    outliers: List[Dict[str, Any]],
    forecast_data: Optional[Dict[str, Any]] = None
) -> io.BytesIO:
    """
    Generates a professional 7-sheet Excel workbook (.xlsx) with corporate header styling,
    zebra striping, and auto column widths.
    """
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # ---------------------------------------------------------
    # Sheet 1: Raw Data
    # ---------------------------------------------------------
    ws_raw = wb.create_sheet(title="Raw Data")
    raw_sample = df_raw.head(5000)
    # Write header
    headers = list(raw_sample.columns)
    ws_raw.append(headers)
    for row in raw_sample.itertuples(index=False):
        ws_raw.append([None if pd.isna(v) else v for v in row])
    style_header_row(ws_raw, len(headers))
    autofit_column_widths(ws_raw)

    # ---------------------------------------------------------
    # Sheet 2: Cleaned Data
    # ---------------------------------------------------------
    ws_clean = wb.create_sheet(title="Cleaned Data")
    clean_sample = df_cleaned.head(5000)
    headers_clean = list(clean_sample.columns)
    ws_clean.append(headers_clean)
    for row in clean_sample.itertuples(index=False):
        ws_clean.append([None if pd.isna(v) else v for v in row])
    style_header_row(ws_clean, len(headers_clean))
    autofit_column_widths(ws_clean)

    # ---------------------------------------------------------
    # Sheet 3: Summary Statistics
    # ---------------------------------------------------------
    ws_stats = wb.create_sheet(title="Summary Statistics")
    stats_headers = ["Column Name", "Inferred Type", "Semantic Role", "Missing Count", "Missing %", "Unique Count", "Mean", "Median", "Min", "Max", "Std Dev", "IQR Outliers"]
    ws_stats.append(stats_headers)
    
    for c in profile.get("columns", []):
        n_stats = c.get("numerical_stats") or {}
        ws_stats.append([
            c["name"],
            c["inferred_type"],
            c.get("semantic_role", "dimension"),
            c["null_count"],
            f"{c['null_percentage']}%",
            c["unique_count"],
            n_stats.get("mean", "-"),
            n_stats.get("median", "-"),
            n_stats.get("min", "-"),
            n_stats.get("max", "-"),
            n_stats.get("std", "-"),
            n_stats.get("outliers_iqr_count", 0)
        ])
    style_header_row(ws_stats, len(stats_headers))
    autofit_column_widths(ws_stats)

    # ---------------------------------------------------------
    # Sheet 4: KPIs & Metrics
    # ---------------------------------------------------------
    ws_kpi = wb.create_sheet(title="KPIs & Metrics")
    kpi_headers = ["Metric / Dimension", "Category / Group", "Total Sum", "Average / Mean", "Share %", "Record Count"]
    ws_kpi.append(kpi_headers)
    
    for biv in eda.get("bivariate_aggregations", []):
        cat_name = biv.get("category_col")
        num_name = biv.get("numerical_col")
        for p in biv.get("top_performers", []):
            ws_kpi.append([
                f"{num_name} by {cat_name}",
                p.get("category"),
                p.get("sum"),
                p.get("mean"),
                f"{p.get('percentage')}%",
                p.get("count")
            ])
    style_header_row(ws_kpi, len(kpi_headers))
    autofit_column_widths(ws_kpi)

    # ---------------------------------------------------------
    # Sheet 5: AI Insights
    # ---------------------------------------------------------
    ws_ins = wb.create_sheet(title="AI Insights")
    ins_headers = ["Severity", "Type", "Insight Title", "Key Metric", "Reported Value", "Detailed Finding", "Calculation Reference"]
    ws_ins.append(ins_headers)
    
    for s_ins in insights.get("structured_insights", []):
        ws_ins.append([
            s_ins.get("severity", "neutral").upper(),
            s_ins.get("type", "finding").upper(),
            s_ins.get("title", ""),
            s_ins.get("metric", ""),
            str(s_ins.get("value", "")),
            s_ins.get("description", ""),
            s_ins.get("calculation_reference", "")
        ])
        
    # If no structured insights, fallback to key_insights list
    if not insights.get("structured_insights"):
        for ki in insights.get("key_insights", []):
            ws_ins.append(["INFO", "FINDING", ki, "-", "-", ki, "Descriptive analysis"])
            
    style_header_row(ws_ins, len(ins_headers))
    autofit_column_widths(ws_ins)

    # ---------------------------------------------------------
    # Sheet 6: Anomalies
    # ---------------------------------------------------------
    ws_anom = wb.create_sheet(title="Anomalies")
    anom_headers = ["Anomaly Type", "Column / Scope", "Detected Count", "Lower Boundary", "Upper Boundary", "Sample Values"]
    ws_anom.append(anom_headers)
    
    for out in outliers:
        sample_vals = ", ".join([str(v) for v in out.get("sample_outlier_values", [])[:5]])
        ws_anom.append([
            "IQR Statistical Outlier",
            out["column"],
            out["iqr_outliers_count"],
            out["lower_bound"],
            out["upper_bound"],
            sample_vals
        ])
    for issue in quality.get("issues", []):
        ws_anom.append([
            f"Quality Issue: {issue.get('type')}",
            issue.get("column", "Dataset Level"),
            issue.get("impact_count", 0),
            "-",
            "-",
            issue.get("message", "")
        ])
    style_header_row(ws_anom, len(anom_headers))
    autofit_column_widths(ws_anom)

    # ---------------------------------------------------------
    # Sheet 7: Forecast
    # ---------------------------------------------------------
    ws_fc = wb.create_sheet(title="Forecast")
    fc_headers = ["Date / Period", "Historical Actual", "Forecast Point", "95% CI Lower Bound", "95% CI Upper Bound", "Model Notes"]
    ws_fc.append(fc_headers)
    
    if forecast_data:
        model_name = forecast_data.get("model_name", "Holt-Winters")
        for pt in forecast_data.get("chart_points", []):
            ws_fc.append([
                pt.get("date"),
                pt.get("actual", "-"),
                pt.get("forecast", "-"),
                pt.get("lower_bound", "-"),
                pt.get("upper_bound", "-"),
                model_name
            ])
    else:
        ws_fc.append(["No time-series forecast generated for this dataset.", "-", "-", "-", "-", "-"])
        
    style_header_row(ws_fc, len(fc_headers))
    autofit_column_widths(ws_fc)

    # Write workbook to bytes stream
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream
