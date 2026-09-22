import os
import io
import csv
import json
from typing import Tuple, Dict, Any, List
import pandas as pd
from fastapi import HTTPException, UploadFile

SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json", ".parquet"}

def detect_csv_delimiter(sample_bytes: bytes) -> str:
    try:
        sample_str = sample_bytes.decode("utf-8", errors="ignore")
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample_str[:4096])
        return dialect.delimiter
    except Exception:
        return ","

def parse_dataset_file(file_path: str, original_filename: str) -> pd.DataFrame:
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on storage")
        
    _, ext = os.path.splitext(original_filename.lower())
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format '{ext}'. Supported formats: CSV, XLSX, XLS, JSON, Parquet"
        )
        
    file_size = os.path.getsize(file_path)
    if file_size == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        if ext == ".csv":
            # Sniff delimiter and encoding
            with open(file_path, "rb") as f:
                header_bytes = f.read(8192)
            delimiter = detect_csv_delimiter(header_bytes)
            
            try:
                df = pd.read_csv(file_path, sep=delimiter, encoding="utf-8", low_memory=False)
            except UnicodeDecodeError:
                df = pd.read_csv(file_path, sep=delimiter, encoding="latin-1", low_memory=False)
                
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
            
        elif ext == ".json":
            with open(file_path, "r", encoding="utf-8") as f:
                content = json.load(f)
            if isinstance(content, list):
                df = pd.DataFrame(content)
            elif isinstance(content, dict):
                # Try common keys or direct record conversion
                if "data" in content and isinstance(content["data"], list):
                    df = pd.DataFrame(content["data"])
                else:
                    df = pd.DataFrame([content])
            else:
                raise ValueError("JSON must contain an array of objects or an object")
                
        elif ext == ".parquet":
            df = pd.read_parquet(file_path)
            
        else:
            raise ValueError(f"Unsupported format: {ext}")
            
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to parse {ext.upper()} file. Error: {str(e)}"
        )

    if df.empty:
        raise HTTPException(status_code=400, detail="Dataset contains 0 rows.")

    # Clean column names (strip whitespace, ensure string type)
    df.columns = [str(col).strip() for col in df.columns]
    
    return df

def get_preview_data(df: pd.DataFrame, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
    total_rows = len(df)
    total_columns = len(df.columns)
    total_pages = max(1, (total_rows + page_size - 1) // page_size)
    
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_rows)
    
    sub_df = df.iloc[start_idx:end_idx].copy()
    
    # Fill NaN with None for clean JSON serialization
    sub_df = sub_df.astype(object).where(pd.notnull(sub_df), None)
    
    rows = sub_df.to_dict(orient="records")
    
    columns = []
    for col in df.columns:
        series = df[col]
        null_count = int(series.isnull().sum())
        unique_count = int(series.nunique(dropna=True))
        
        # Inferred type
        if pd.api.types.is_numeric_dtype(series):
            inferred = "numerical"
        elif pd.api.types.is_datetime64_any_dtype(series):
            inferred = "datetime"
        elif pd.api.types.is_bool_dtype(series):
            inferred = "boolean"
        else:
            # Check if strings look like dates
            inferred = "categorical"
            if unique_count > 0.8 * total_rows and total_rows > 20:
                inferred = "id"
                
        sample_vals = [v for v in series.dropna().head(5).tolist()]
        
        columns.append({
            "name": col,
            "data_type": str(series.dtype),
            "inferred_type": inferred,
            "null_count": null_count,
            "null_percentage": round((null_count / total_rows) * 100, 2) if total_rows > 0 else 0,
            "unique_count": unique_count,
            "sample_values": sample_vals
        })
        
    return {
        "total_rows": total_rows,
        "total_columns": total_columns,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "columns": columns,
        "rows": rows
    }
