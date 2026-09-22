import pytest
import pandas as pd
import numpy as np
from app.utils.demo_data import generate_sales_demo_df
from app.data_processing.parser import get_preview_data
from app.analysis.profiler import profile_dataset
from app.analysis.quality import compute_data_quality
from app.analysis.statistics import compute_correlations, detect_outliers_detailed
from app.analysis.eda import perform_eda
from app.cleaning.engine import generate_cleaning_suggestions, apply_cleaning_operations
from app.sandbox.executor import validate_code_safety, execute_sandboxed_pandas, process_ask_data_query
from app.visualization.recommender import recommend_kpis, generate_recommended_charts

def test_demo_dataset_generation():
    df = generate_sales_demo_df(num_rows=100)
    assert len(df) > 100
    assert "Revenue" in df.columns
    assert "Profit" in df.columns
    assert "Customer" in df.columns

def test_preview_data():
    df = generate_sales_demo_df(num_rows=50)
    preview = get_preview_data(df, page=1, page_size=10)
    assert preview["total_rows"] == len(df)
    assert len(preview["rows"]) == 10
    assert len(preview["columns"]) == len(df.columns)

def test_profiler_and_quality():
    df = generate_sales_demo_df(num_rows=100)
    profile = profile_dataset(df, "test-id")
    assert profile["row_count"] == len(df)
    assert profile["column_count"] == len(df.columns)
    assert profile["duplicate_rows_count"] > 0
    
    quality = compute_data_quality(df, profile)
    assert 0 <= quality["overall_score"] <= 100
    assert len(quality["issues"]) > 0

def test_cleaning_engine():
    df = generate_sales_demo_df(num_rows=100)
    profile = profile_dataset(df, "test-id")
    quality = compute_data_quality(df, profile)
    suggestions = generate_cleaning_suggestions(df, profile, quality)
    assert len(suggestions) > 0
    
    # Test duplicate removal
    cleaned_df, logs = apply_cleaning_operations(df, [{"action_type": "drop_duplicates"}])
    assert len(cleaned_df) < len(df)
    assert len(logs) == 1

def test_sandbox_security():
    df = generate_sales_demo_df(num_rows=20)
    
    # Allowed analytical operation
    safe_code = "result = df['Revenue'].sum()"
    res, err = execute_sandboxed_pandas(df, safe_code)
    assert err is None
    assert res > 0
    
    # Blocked dangerous operation 1: import os
    bad_code_1 = "import os\nresult = os.listdir('.')"
    is_safe, err_msg = validate_code_safety(bad_code_1)
    assert is_safe is False
    
    # Blocked dangerous operation 2: open()
    bad_code_2 = "result = open('secret.txt').read()"
    is_safe2, err_msg2 = validate_code_safety(bad_code_2)
    assert is_safe2 is False

def test_ask_data_query():
    df = generate_sales_demo_df(num_rows=50)
    res = process_ask_data_query(df, "What is total Revenue?")
    assert "total" in res["question"].lower()
    assert res["answer_text"] is not None
    assert res["confidence_score"] > 0
