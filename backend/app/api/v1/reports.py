from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.dataset import Dataset, CleaningOperation
from app.models.report import Report
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.data_processing.parser import parse_dataset_file
from app.analysis.profiler import profile_dataset
from app.analysis.quality import compute_data_quality
from app.analysis.statistics import compute_correlations, detect_outliers_detailed
from app.analysis.eda import perform_eda
from app.analysis.forecasting import check_forecasting_eligibility, generate_forecast
from app.visualization.recommender import recommend_kpis
from app.ai.insights import generate_ai_insights
from app.reports.generator import build_comprehensive_report_data, generate_html_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportResponse)
def generate_report(payload: ReportGenerateRequest, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == payload.dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    quality = compute_data_quality(df, profile)
    correlations = compute_correlations(df)
    outliers = detect_outliers_detailed(df)
    eda = perform_eda(df, profile.get("intelligence"))
    insights = generate_ai_insights(profile, quality, eda, correlations, outliers, detail_level="deep")
    kpis = recommend_kpis(df, profile, quality)
    
    ops = db.query(CleaningOperation).filter(CleaningOperation.dataset_id == ds.id).all()
    cleaning_logs = [
        {"operation_type": op.operation_type, "summary": op.summary, "affected_rows": op.affected_rows}
        for op in ops
    ]
    
    # Attempt forecast if eligible
    forecast_data = None
    intel = profile.get("intelligence", {})
    eligibility = check_forecasting_eligibility(df, intel)
    if eligibility["is_eligible"]:
        try:
            d_col = intel.get("primary_date_col")
            m_col = intel.get("target_variable") or (intel.get("key_metrics", [])[0] if intel.get("key_metrics") else None)
            if d_col and m_col:
                forecast_data = generate_forecast(df, d_col, m_col, horizon="30d")
        except Exception:
            forecast_data = None
            
    report_data = build_comprehensive_report_data(
        dataset_name=ds.name,
        profile=profile,
        quality=quality,
        eda=eda,
        correlations=correlations,
        outliers=outliers,
        insights=insights,
        cleaning_logs=cleaning_logs,
        kpis=kpis,
        include_sections=payload.include_sections,
        custom_notes=payload.custom_notes,
        forecast_data=forecast_data
    )
    
    html_content = generate_html_report(report_data)
    title = payload.title or f"Executive Report — {ds.name}"
    
    rep = Report(
        dataset_id=ds.id,
        user_id=user_id,
        title=title,
        summary=insights.get("executive_summary"),
        content=report_data,
        html_content=html_content,
        format="html"
    )
    db.add(rep)
    db.commit()
    db.refresh(rep)
    
    return rep

@router.get("", response_model=List[ReportResponse])
def list_reports(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.user_id == user_id).order_by(Report.created_at.desc()).all()

@router.get("/{id}", response_model=ReportResponse)
def get_report(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == id, Report.user_id == user_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    return rep

@router.get("/{id}/html", response_class=HTMLResponse)
def get_report_html(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    rep = db.query(Report).filter(Report.id == id, Report.user_id == user_id).first()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")
    return HTMLResponse(content=rep.html_content)
