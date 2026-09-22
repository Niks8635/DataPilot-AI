import io
import openpyxl
import pytest
import pandas as pd
import numpy as np
from app.analysis.domain import detect_domain
from app.analysis.intelligence import synthesize_dataset_intelligence
from app.analysis.profiler import profile_dataset
from app.analysis.eda import perform_eda
from app.cleaning.engine import apply_cleaning_operations, preview_cleaning_operation
from app.ai.insights import generate_ai_insights
from app.sandbox.executor import process_ask_data_query
from app.analysis.forecasting import check_forecasting_eligibility, generate_forecast
from app.reports.generator import build_comprehensive_report_data, generate_html_report
from app.reports.export import build_multi_tab_excel

@pytest.fixture
def sample_sales_df():
    dates = pd.date_range("2024-01-01", periods=30, freq="D")
    categories = ["Electronics", "Furniture", "Apparel"] * 10
    sales = [1200 + i * 35 + (i % 3) * 150 for i in range(30)]
    sales[5] = 9500.0  # outlier
    profit = [s * 0.25 for s in sales]
    customers = [f"CUST_{i%5}" for i in range(30)]
    regions = ["North", "South", "East", "West"] * 7 + ["North", "South"]
    
    df = pd.DataFrame({
        "order_id": [f"ORD_{1000+i}" for i in range(30)],
        "order_date": dates,
        "customer_id": customers,
        "product_category": categories,
        "region": regions,
        "sales_amount": sales,
        "profit": profit
    })
    # Add a duplicate row
    df = pd.concat([df, df.iloc[[0]]], ignore_index=True)
    return df

def test_feature_1_domain_detection_and_intelligence(sample_sales_df):
    domain = detect_domain(sample_sales_df)
    assert domain["domain"] == "Sales & E-commerce"
    assert domain["confidence"] >= 0.70
    assert len(domain["matched_indicators"]) > 0
    
    intel = synthesize_dataset_intelligence(sample_sales_df)
    assert intel["primary_date_col"] == "order_date"
    assert intel["target_variable"] in ["sales_amount", "profit"]
    assert "product_category" in intel["key_dimensions"] or "region" in intel["key_dimensions"]
    assert "sales_amount" in intel["key_metrics"]

def test_feature_1_profiler_and_eda(sample_sales_df):
    profile = profile_dataset(sample_sales_df, "test_ds")
    assert profile["duplicate_rows_count"] >= 1
    assert "intelligence" in profile
    assert "domain_info" in profile
    
    # Check semantic role tagging
    col_roles = {c["name"]: c["semantic_role"] for c in profile["columns"]}
    assert col_roles["order_id"] == "identifier"
    assert col_roles["sales_amount"] == "currency"
    assert col_roles["region"] == "geographic"
    
    # Check smart rule-based EDA
    eda = perform_eda(sample_sales_df, profile["intelligence"])
    assert "analysis_plan" in eda
    assert len(eda["analysis_plan"]) >= 5
    assert len(eda["pareto_analyses"]) > 0
    assert len(eda["time_series_trends"]) > 0
    assert eda["time_series_trends"][0]["trend_direction"] in ["upward", "downward", "stable"]

def test_feature_3_cleaning_engine_and_preview(sample_sales_df):
    # Test preview diff without altering source df
    preview_res = preview_cleaning_operation(sample_sales_df, {
        "action_type": "drop_duplicates"
    })
    assert preview_res["success"] is True
    assert preview_res["metrics_diff"]["rows_before"] == 31
    assert preview_res["metrics_diff"]["rows_after"] == 30
    assert preview_res["affected_rows_count"] == 1
    
    # Test clipping outliers
    clip_action = {
        "action_type": "clip_outliers",
        "column": "sales_amount"
    }
    clip_preview = preview_cleaning_operation(sample_sales_df, clip_action)
    assert clip_preview["success"] is True
    assert len(clip_preview["changed_cells"]) >= 1

def test_feature_4_ai_structured_insights(sample_sales_df):
    profile = profile_dataset(sample_sales_df, "test_ds")
    eda = perform_eda(sample_sales_df, profile["intelligence"])
    corrs = {"top_correlations": [{"column_x": "sales_amount", "column_y": "profit", "pearson": 0.99, "strength": "strong positive"}]}
    outliers = [{"column": "sales_amount", "iqr_outliers_count": 1, "lower_bound": 500, "upper_bound": 3500, "sample_outlier_values": [9500]}]
    quality = {"overall_score": 88.0, "grade": "Good", "issues": []}
    
    insights = generate_ai_insights(profile, quality, eda, corrs, outliers, detail_level="deep")
    assert "structured_insights" in insights
    assert len(insights["structured_insights"]) >= 3
    
    first_insight = insights["structured_insights"][0]
    assert "title" in first_insight
    assert "metric" in first_insight
    assert "value" in first_insight
    assert "calculation_reference" in first_insight
    assert "source_columns" in first_insight
    assert first_insight["severity"] in ["critical", "warning", "positive", "neutral"]

def test_feature_5_ask_data_with_memory_and_pronouns(sample_sales_df):
    # Turn 1: Top categories by sales
    q1 = "Top 3 product_category by sales_amount"
    res1 = process_ask_data_query(sample_sales_df, q1)
    assert res1["tabular_result"] is not None
    assert len(res1["tabular_result"]) > 0
    assert "executed_code" in res1
    assert "queried_columns" in res1
    assert "filter_explanation" in res1
    
    # Turn 2: Pronoun reference resolution using history
    history = [
        {"role": "user", "content": q1},
        {"role": "assistant", "content": res1["answer_text"], "result_data": res1["tabular_result"], "query_code": res1["executed_code"]}
    ]
    q2 = "What is the total sales_amount for the first one?"
    res2 = process_ask_data_query(sample_sales_df, q2, history)
    assert res2["answer_text"] is not None
    assert "calculation_details" in res2

def test_feature_9_forecasting_engine(sample_sales_df):
    intel = synthesize_dataset_intelligence(sample_sales_df)
    eligibility = check_forecasting_eligibility(sample_sales_df, intel)
    assert eligibility["is_eligible"] is True
    
    forecast = generate_forecast(
        sample_sales_df,
        date_column="order_date",
        metric_column="sales_amount",
        horizon="7d"
    )
    assert forecast["periods_forecasted"] == 7
    assert len(forecast["chart_points"]) > 30
    assert "mape" in forecast["metrics"]
    assert "rmse" in forecast["metrics"]
    assert "narrative" in forecast
    assert "disclaimer" in forecast
    # Verify confidence intervals exist on forecast points
    last_pt = forecast["chart_points"][-1]
    assert last_pt["lower_bound"] is not None
    assert last_pt["upper_bound"] is not None
    assert last_pt["lower_bound"] <= last_pt["forecast"] <= last_pt["upper_bound"]

def test_feature_10_professional_report_builder(sample_sales_df):
    profile = profile_dataset(sample_sales_df, "test_ds")
    eda = perform_eda(sample_sales_df, profile["intelligence"])
    corrs = {"top_correlations": []}
    outliers = []
    quality = {"overall_score": 92.0, "grade": "Excellent", "issues": []}
    insights = generate_ai_insights(profile, quality, eda, corrs, outliers)
    kpis = [{"label": "Total Sales", "value": 45000, "formatted_value": "$45,000"}]
    
    report_data = build_comprehensive_report_data(
        dataset_name="Global Sales",
        profile=profile,
        quality=quality,
        eda=eda,
        correlations=corrs,
        outliers=outliers,
        insights=insights,
        cleaning_logs=[],
        kpis=kpis,
        custom_notes="Q4 Board Review commentary."
    )
    html = generate_html_report(report_data)
    assert "Global Sales" in html
    assert "@media print" in html
    assert "Q4 Board Review commentary." in html
    assert "Analytical Methodology" in html

def test_feature_20_multi_tab_excel_export(sample_sales_df):
    profile = profile_dataset(sample_sales_df, "test_ds")
    eda = perform_eda(sample_sales_df, profile["intelligence"])
    corrs = {"top_correlations": []}
    outliers = []
    quality = {"overall_score": 92.0, "grade": "Excellent", "issues": []}
    insights = generate_ai_insights(profile, quality, eda, corrs, outliers)
    
    stream = build_multi_tab_excel(
        df_raw=sample_sales_df,
        df_cleaned=sample_sales_df.drop_duplicates(),
        profile=profile,
        quality=quality,
        eda=eda,
        insights=insights,
        outliers=outliers,
        forecast_data=None
    )
    assert isinstance(stream, io.BytesIO)
    # Validate with openpyxl that all sheets are created
    wb = openpyxl.load_workbook(stream)
    expected_sheets = ["Raw Data", "Cleaned Data", "Summary Statistics", "KPIs & Metrics", "AI Insights", "Anomalies", "Forecast"]
    for s in expected_sheets:
        assert s in wb.sheetnames
