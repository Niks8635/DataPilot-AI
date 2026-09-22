import os
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.models.dataset import Dataset, DatasetVersion, CleaningOperation
from app.schemas.dataset import DatasetResponse, DatasetPreviewResponse, CleaningLogEntry
from app.schemas.profiling import DatasetProfileResponse
from app.schemas.analysis import QualityScoreResponse
from app.schemas.cleaning import CleaningSuggestion, CleaningApplyRequest, CleaningResponse, CleaningPreviewRequest, CleaningPreviewResponse, RevertVersionRequest
from app.data_processing.parser import parse_dataset_file, get_preview_data
from app.data_processing.storage import save_upload_file, save_dataframe_as_csv
from app.analysis.profiler import profile_dataset
from app.analysis.quality import compute_data_quality
from app.cleaning.engine import generate_cleaning_suggestions, apply_cleaning_operations, preview_cleaning_operation
from app.utils.demo_data import generate_sales_demo_df
from app.reports.export import build_multi_tab_excel
from app.analysis.statistics import compute_correlations, detect_outliers_detailed
from app.analysis.eda import perform_eda
from app.analysis.forecasting import check_forecasting_eligibility, generate_forecast
from app.ai.insights import generate_ai_insights

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    original_filename = file.filename or "dataset.csv"
    _, ext = os.path.splitext(original_filename.lower())
    
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
        
    dest_path, safe_filename, file_size = save_upload_file(file_bytes, original_filename)
    
    # Parse and validate dataset
    try:
        df = parse_dataset_file(dest_path, original_filename)
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise e
        
    dataset_name = name or os.path.splitext(original_filename)[0].replace("_", " ").title()
    
    dataset = Dataset(
        user_id=user_id,
        name=dataset_name,
        original_filename=original_filename,
        file_type=ext.replace(".", ""),
        file_path=dest_path,
        current_file_path=dest_path,
        row_count=len(df),
        column_count=len(df.columns),
        file_size_bytes=file_size,
        status="ready",
        current_version=1
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    # Save version 1
    v1 = DatasetVersion(
        dataset_id=dataset.id,
        version_number=1,
        file_path=dest_path,
        description="Original upload",
        row_count=len(df),
        column_count=len(df.columns)
    )
    db.add(v1)
    db.commit()
    
    return dataset

@router.post("/demo", response_model=DatasetResponse)
def load_demo_dataset(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    df = generate_sales_demo_df()
    demo_filename = "sales_data.csv"
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    
    dest_path, _, file_size = save_upload_file(csv_bytes, demo_filename)
    
    dataset = Dataset(
        user_id=user_id,
        name="Global Sales & Profitability",
        original_filename=demo_filename,
        file_type="csv",
        file_path=dest_path,
        current_file_path=dest_path,
        row_count=len(df),
        column_count=len(df.columns),
        file_size_bytes=file_size,
        status="ready",
        current_version=1
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    v1 = DatasetVersion(
        dataset_id=dataset.id,
        version_number=1,
        file_path=dest_path,
        description="Sample Sales Analytics Dataset",
        row_count=len(df),
        column_count=len(df.columns)
    )
    db.add(v1)
    db.commit()
    
    return dataset

@router.get("", response_model=List[DatasetResponse])
def list_datasets(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Dataset).filter(Dataset.user_id == user_id).order_by(Dataset.created_at.desc()).all()

@router.get("/{id}", response_model=DatasetResponse)
def get_dataset(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return ds

@router.get("/{id}/preview", response_model=DatasetPreviewResponse)
def get_dataset_preview(
    id: str, 
    page: int = Query(1, ge=1), 
    page_size: int = Query(50, ge=1, le=500),
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_desc: bool = False,
    user_id: str = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    
    # Optional search across columns
    if search:
        search_lower = search.lower()
        mask = df.astype(str).apply(lambda row: row.str.lower().str.contains(search_lower).any(), axis=1)
        df = df[mask]
        
    # Optional sorting
    if sort_by and sort_by in df.columns:
        df = df.sort_values(by=sort_by, ascending=not sort_desc)
        
    preview = get_preview_data(df, page=page, page_size=page_size)
    return DatasetPreviewResponse(
        id=ds.id,
        name=ds.name,
        total_rows=preview["total_rows"],
        total_columns=preview["total_columns"],
        page=preview["page"],
        page_size=preview["page_size"],
        total_pages=preview["total_pages"],
        columns=preview["columns"],
        rows=preview["rows"]
    )

@router.get("/{id}/profile", response_model=DatasetProfileResponse)
def get_dataset_profile(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    return profile_dataset(df, ds.id)

@router.get("/{id}/quality", response_model=QualityScoreResponse)
def get_dataset_quality(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    return compute_data_quality(df, profile)

@router.get("/{id}/cleaning-suggestions", response_model=List[CleaningSuggestion])
def get_cleaning_suggestions(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    quality = compute_data_quality(df, profile)
    return generate_cleaning_suggestions(df, profile, quality)

@router.post("/{id}/clean", response_model=CleaningResponse)
def apply_cleaning(
    id: str, 
    payload: CleaningApplyRequest, 
    user_id: str = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    rows_before = len(df)
    cols_before = len(df.columns)
    
    actions_dict = [a.model_dump() for a in payload.actions]
    cleaned_df, logs = apply_cleaning_operations(df, actions_dict)
    
    new_version_num = ds.current_version + 1
    new_file_path = save_dataframe_as_csv(cleaned_df, ds.id, new_version_num)
    
    # Update dataset
    ds.current_file_path = new_file_path
    ds.row_count = len(cleaned_df)
    ds.column_count = len(cleaned_df.columns)
    ds.current_version = new_version_num
    db.commit()
    
    # Save new version record
    desc = payload.version_description or f"Cleaned version (Applied {len(logs)} operations)"
    v = DatasetVersion(
        dataset_id=ds.id,
        version_number=new_version_num,
        file_path=new_file_path,
        description=desc,
        row_count=len(cleaned_df),
        column_count=len(cleaned_df.columns)
    )
    db.add(v)
    db.commit()
    db.refresh(v)
    
    # Log each cleaning operation
    op_summaries = []
    for log_item in logs:
        op = CleaningOperation(
            dataset_id=ds.id,
            version_id=v.id,
            operation_type=log_item["operation_type"],
            parameters=log_item.get("parameters"),
            summary=log_item["summary"],
            affected_rows=log_item.get("affected_rows", 0)
        )
        db.add(op)
        op_summaries.append(log_item["summary"])
    db.commit()
    
    return CleaningResponse(
        success=True,
        dataset_id=ds.id,
        new_version_number=new_version_num,
        rows_before=rows_before,
        rows_after=len(cleaned_df),
        columns_before=cols_before,
        columns_after=len(cleaned_df.columns),
        operations_performed=op_summaries,
        message=f"Successfully applied {len(logs)} cleaning operations. Dataset updated to version {new_version_num}."
    )

@router.post("/{id}/clean/preview", response_model=CleaningPreviewResponse)
def preview_cleaning(
    id: str,
    payload: CleaningPreviewRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    action_dict = payload.action.model_dump()
    return preview_cleaning_operation(df, action_dict)

@router.post("/{id}/revert")
def revert_dataset_version(
    id: str,
    payload: RevertVersionRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    target_v = db.query(DatasetVersion).filter(
        DatasetVersion.dataset_id == ds.id,
        DatasetVersion.version_number == payload.target_version_number
    ).first()
    if not target_v:
        raise HTTPException(status_code=404, detail=f"Version {payload.target_version_number} not found")
        
    ds.current_file_path = target_v.file_path
    ds.row_count = target_v.row_count
    ds.column_count = target_v.column_count
    ds.current_version = target_v.version_number
    db.commit()
    
    # Log revert operation
    op = CleaningOperation(
        dataset_id=ds.id,
        version_id=target_v.id,
        operation_type="revert_version",
        parameters={"target_version": payload.target_version_number},
        summary=f"Reverted dataset state to version {payload.target_version_number}",
        affected_rows=target_v.row_count
    )
    db.add(op)
    db.commit()
    
    return {
        "success": True,
        "message": f"Successfully reverted to version {payload.target_version_number}",
        "current_version": ds.current_version,
        "row_count": ds.row_count,
        "column_count": ds.column_count
    }

@router.get("/{id}/history", response_model=List[CleaningLogEntry])
def get_dataset_history(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    ops = db.query(CleaningOperation).filter(CleaningOperation.dataset_id == ds.id).order_by(CleaningOperation.created_at.desc()).all()
    return ops

@router.get("/{id}/export")
def export_dataset(
    id: str,
    format: str = Query("csv", pattern="^(csv|json|xlsx|xlsx_multitab)$"),
    version: Optional[str] = Query("current"),  # "current" or "original"
    multitab: bool = Query(False),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df_raw = parse_dataset_file(ds.file_path, ds.original_filename)
    df_cleaned = parse_dataset_file(ds.current_file_path, ds.original_filename)
    
    filename_base = f"{ds.name.replace(' ', '_').lower()}_{version}"
    
    if format == "xlsx_multitab" or (format == "xlsx" and multitab):
        # Generate complete 7-sheet professional workbook
        profile = profile_dataset(df_cleaned, ds.id)
        quality = compute_data_quality(df_cleaned, profile)
        correlations = compute_correlations(df_cleaned)
        outliers = detect_outliers_detailed(df_cleaned)
        eda = perform_eda(df_cleaned, profile.get("intelligence"))
        insights = generate_ai_insights(profile, quality, eda, correlations, outliers)
        
        forecast_data = None
        intel = profile.get("intelligence", {})
        eligibility = check_forecasting_eligibility(df_cleaned, intel)
        if eligibility["is_eligible"]:
            try:
                d_col = intel.get("primary_date_col")
                m_col = intel.get("target_variable") or (intel.get("key_metrics", [])[0] if intel.get("key_metrics") else None)
                if d_col and m_col:
                    forecast_data = generate_forecast(df_cleaned, d_col, m_col, horizon="30d")
            except Exception:
                forecast_data = None
                
        stream = build_multi_tab_excel(
            df_raw=df_raw,
            df_cleaned=df_cleaned,
            profile=profile,
            quality=quality,
            eda=eda,
            insights=insights,
            outliers=outliers,
            forecast_data=forecast_data
        )
        response = StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = f"attachment; filename={ds.name.replace(' ', '_').lower()}_executive_workbook.xlsx"
        return response

    target_path = ds.file_path if version == "original" else ds.current_file_path
    df = parse_dataset_file(target_path, ds.original_filename)
    
    if format == "csv":
        stream = io.StringIO()
        df.to_csv(stream, index=False)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
        response.headers["Content-Disposition"] = f"attachment; filename={filename_base}.csv"
        return response
    elif format == "json":
        stream = io.StringIO()
        df.to_json(stream, orient="records", indent=2)
        response = StreamingResponse(iter([stream.getvalue()]), media_type="application/json")
        response.headers["Content-Disposition"] = f"attachment; filename={filename_base}.json"
        return response
    elif format == "xlsx":
        stream = io.BytesIO()
        df.to_excel(stream, index=False, engine="openpyxl")
        stream.seek(0)
        response = StreamingResponse(stream, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response.headers["Content-Disposition"] = f"attachment; filename={filename_base}.xlsx"
        return response

@router.delete("/{id}")
def delete_dataset(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Delete disk files
    try:
        if os.path.exists(ds.file_path):
            os.remove(ds.file_path)
        if os.path.exists(ds.current_file_path) and ds.current_file_path != ds.file_path:
            os.remove(ds.current_file_path)
    except Exception:
        pass
        
    db.delete(ds)
    db.commit()
    return {"message": "Dataset and all associated analyses deleted successfully."}
