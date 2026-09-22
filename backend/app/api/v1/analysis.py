from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.dataset import Dataset
from app.models.analysis import Analysis
from app.schemas.analysis import (
    ComprehensiveAnalysisResponse, 
    InsightsRegenerateRequest, 
    AIInsightsResponse,
    ForecastRequest, 
    ForecastResponse
)
from app.data_processing.parser import parse_dataset_file
from app.analysis.profiler import profile_dataset
from app.analysis.quality import compute_data_quality
from app.analysis.statistics import compute_correlations, detect_outliers_detailed
from app.analysis.eda import perform_eda
from app.analysis.forecasting import check_forecasting_eligibility, generate_forecast
from app.ai.insights import generate_ai_insights

router = APIRouter(prefix="/analysis", tags=["Analysis"])

@router.get("/{dataset_id}", response_model=ComprehensiveAnalysisResponse)
def get_comprehensive_analysis(dataset_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    # Check if existing analysis is saved for current version
    existing = db.query(Analysis).filter(
        Analysis.dataset_id == ds.id,
        Analysis.version_number == str(ds.current_version)
    ).first()
    
    if existing and existing.quality_issues and existing.eda_results and existing.ai_insights:
        eda_res = existing.eda_results
        intelligence = eda_res.get("intelligence") or (existing.profile_data.get("intelligence") if existing.profile_data else None)
        return ComprehensiveAnalysisResponse(
            dataset_id=ds.id,
            quality=existing.quality_issues,
            correlations=existing.correlations,
            outliers=existing.outliers,
            eda=existing.eda_results,
            insights=existing.ai_insights,
            intelligence=intelligence,
            analysis_plan=eda_res.get("analysis_plan")
        )
        
    # Compute full analysis pipeline
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    quality = compute_data_quality(df, profile)
    correlations = compute_correlations(df)
    outliers = detect_outliers_detailed(df)
    eda = perform_eda(df, profile.get("intelligence"))
    insights = generate_ai_insights(profile, quality, eda, correlations, outliers)
    
    # Save to database
    analysis_record = Analysis(
        dataset_id=ds.id,
        user_id=user_id,
        version_number=str(ds.current_version),
        profile_data=profile,
        quality_score=quality["overall_score"],
        quality_issues=quality,
        statistics={},
        eda_results=eda,
        correlations=correlations,
        outliers=outliers,
        ai_insights=insights
    )
    db.add(analysis_record)
    db.commit()
    
    return ComprehensiveAnalysisResponse(
        dataset_id=ds.id,
        quality=quality,
        correlations=correlations,
        outliers=outliers,
        eda=eda,
        insights=insights,
        intelligence=profile.get("intelligence"),
        analysis_plan=eda.get("analysis_plan")
    )

@router.post("/{dataset_id}/refresh", response_model=ComprehensiveAnalysisResponse)
def refresh_analysis(dataset_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    quality = compute_data_quality(df, profile)
    correlations = compute_correlations(df)
    outliers = detect_outliers_detailed(df)
    eda = perform_eda(df, profile.get("intelligence"))
    insights = generate_ai_insights(profile, quality, eda, correlations, outliers)
    
    # Remove old analysis for this version and create fresh record
    db.query(Analysis).filter(
        Analysis.dataset_id == ds.id,
        Analysis.version_number == str(ds.current_version)
    ).delete()
    
    analysis_record = Analysis(
        dataset_id=ds.id,
        user_id=user_id,
        version_number=str(ds.current_version),
        profile_data=profile,
        quality_score=quality["overall_score"],
        quality_issues=quality,
        statistics={},
        eda_results=eda,
        correlations=correlations,
        outliers=outliers,
        ai_insights=insights
    )
    db.add(analysis_record)
    db.commit()
    
    return ComprehensiveAnalysisResponse(
        dataset_id=ds.id,
        quality=quality,
        correlations=correlations,
        outliers=outliers,
        eda=eda,
        insights=insights,
        intelligence=profile.get("intelligence"),
        analysis_plan=eda.get("analysis_plan")
    )

@router.post("/{dataset_id}/insights/regenerate", response_model=AIInsightsResponse)
def regenerate_insights(
    dataset_id: str,
    payload: InsightsRegenerateRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    quality = compute_data_quality(df, profile)
    correlations = compute_correlations(df)
    outliers = detect_outliers_detailed(df)
    eda = perform_eda(df, profile.get("intelligence"))
    
    new_insights = generate_ai_insights(
        profile, 
        quality, 
        eda, 
        correlations, 
        outliers, 
        focus_prompt=payload.focus_prompt, 
        detail_level=payload.detail_level
    )
    
    # Update analysis record
    existing = db.query(Analysis).filter(
        Analysis.dataset_id == ds.id,
        Analysis.version_number == str(ds.current_version)
    ).first()
    if existing:
        existing.ai_insights = new_insights
        db.commit()
        
    return new_insights

@router.get("/{dataset_id}/forecast/eligibility")
def get_forecast_eligibility(
    dataset_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    eligibility = check_forecasting_eligibility(df, profile.get("intelligence"))
    return eligibility

@router.post("/{dataset_id}/forecast", response_model=ForecastResponse)
def run_dataset_forecast(
    dataset_id: str,
    payload: ForecastRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    intel = profile.get("intelligence", {})
    
    date_col = payload.date_column or intel.get("primary_date_col")
    metric_col = payload.metric_column or intel.get("target_variable") or (intel.get("key_metrics", [])[0] if intel.get("key_metrics") else None)
    
    if not date_col:
        raise HTTPException(status_code=400, detail="No datetime column selected or identified in this dataset.")
    if not metric_col:
        raise HTTPException(status_code=400, detail="No continuous numerical metric selected or identified in this dataset.")
        
    try:
        forecast_result = generate_forecast(
            df=df,
            date_column=date_col,
            metric_column=metric_col,
            horizon=payload.horizon,
            model_type=payload.model_type
        )
        forecast_result["dataset_id"] = ds.id
        return forecast_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Forecasting calculation failed: {str(e)}")
