import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.dataset import Dataset
from app.models.dashboard import Dashboard, DashboardWidget
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardCreate,
    DashboardUpdate,
    DashboardWidgetSchema,
    DashboardPage,
    DashboardLayoutConfig,
    KPICardData,
    TableWidgetConfig,
    SlicerWidgetConfig,
    DateFilterWidgetConfig
)
from app.data_processing.parser import parse_dataset_file
from app.analysis.profiler import profile_dataset
from app.analysis.quality import compute_data_quality
from app.analysis.eda import perform_eda
from app.visualization.recommender import recommend_kpis, generate_recommended_charts

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])

def _build_widget_schema(w: DashboardWidget) -> DashboardWidgetSchema:
    cfg = w.chart_config or {}
    gp = w.grid_position or {}
    
    table_cfg = None
    if cfg.get("table_config"):
        table_cfg = TableWidgetConfig(**cfg["table_config"])
    elif w.widget_type == "table":
        table_cfg = TableWidgetConfig(columns=cfg.get("columns", []))
        
    slicer_cfg = None
    if cfg.get("slicer_config"):
        slicer_cfg = SlicerWidgetConfig(**cfg["slicer_config"])
    elif w.widget_type == "slicer":
        slicer_cfg = SlicerWidgetConfig(column=cfg.get("column", ""))
        
    date_filter_cfg = None
    if cfg.get("date_filter_config"):
        date_filter_cfg = DateFilterWidgetConfig(**cfg["date_filter_config"])
    elif w.widget_type == "date_filter":
        date_filter_cfg = DateFilterWidgetConfig(date_col=cfg.get("date_col", ""))

    return DashboardWidgetSchema(
        id=w.id,
        widget_type=w.widget_type,
        title=w.title,
        subtitle=cfg.get("subtitle"),
        page_id=cfg.get("page_id", "page_1"),
        kpi_data=cfg.get("kpi_data"),
        chart_config=cfg.get("chart_config"),
        table_config=table_cfg,
        slicer_config=slicer_cfg,
        date_filter_config=date_filter_cfg,
        color_palette=cfg.get("color_palette", "blue"),
        grid_w=gp.get("w", 6),
        grid_h=gp.get("h", 4)
    )

def _build_dashboard_response(d: Dashboard) -> DashboardResponse:
    widgets = [_build_widget_schema(w) for w in (d.widgets or [])]
    
    # Ensure layout_config has at least page_1 with widgets
    layout = d.layout_config or {}
    if not layout.get("pages"):
        page_1 = {
            "id": "page_1",
            "title": "Executive Overview",
            "description": "Primary metrics and key distributions",
            "widget_ids": [w.id for w in widgets],
            "local_filters": {}
        }
        layout = {
            "theme": layout.get("theme", "dark"),
            "active_page_id": "page_1",
            "pages": [page_1],
            "global_filters": {}
        }
        
    return DashboardResponse(
        id=d.id,
        dataset_id=d.dataset_id,
        user_id=d.user_id,
        title=d.title,
        description=d.description,
        is_default=d.is_default,
        layout_config=layout,
        widgets=widgets,
        created_at=d.created_at,
        updated_at=d.updated_at
    )

def _synthesize_complete_auto_dashboard(ds: Dataset, user_id: str, db: Session) -> Dashboard:
    # Automatically generate default comprehensive dashboard with KPIs, Slicers, DateFilters, Charts, and Table
    df = parse_dataset_file(ds.current_file_path, ds.original_filename)
    profile = profile_dataset(df, ds.id)
    quality = compute_data_quality(df, profile)
    eda = perform_eda(df)
    
    kpis = recommend_kpis(df, profile, quality)
    recommended_charts = generate_recommended_charts(df, profile, eda)
    
    cat_cols = eda.get("categorical_columns", []) or [c["name"] for c in profile.get("columns", []) if c.get("inferred_type") == "categorical"]
    dt_cols = eda.get("datetime_columns", []) or [c["name"] for c in profile.get("columns", []) if c.get("inferred_type") == "datetime"]
    all_cols = [c["name"] for c in profile.get("columns", [])]
    
    # Multi-page default layout
    default_layout = {
        "theme": "dark",
        "active_page_id": "page_1",
        "pages": [
            {
                "id": "page_1",
                "title": "Executive Overview",
                "description": "Core performance KPIs, dimension filters, and high-level trends",
                "widget_ids": [],
                "local_filters": {}
            },
            {
                "id": "page_2",
                "title": "Detailed Segment Analysis",
                "description": "Categorical breakdowns, distributions, and transaction records",
                "widget_ids": [],
                "local_filters": {}
            }
        ],
        "global_filters": {}
    }
    
    dash = Dashboard(
        dataset_id=ds.id,
        user_id=user_id,
        title=f"{ds.name} — Executive Dashboard",
        description="Automatically synthesized executive KPIs, slicers, charts, and summary table",
        is_default=True,
        layout_config=default_layout
    )
    db.add(dash)
    db.commit()
    db.refresh(dash)
    
    p1_widget_ids = []
    p2_widget_ids = []
    
    # 1. Add KPI widgets to Page 1
    for idx, k in enumerate(kpis[:4]):
        w = DashboardWidget(
            dashboard_id=dash.id,
            widget_type="kpi",
            title=k["label"],
            chart_config={
                "kpi_data": k, 
                "page_id": "page_1",
                "color_palette": "blue"
            },
            grid_position={"x": (idx % 4) * 3, "y": 0, "w": 3, "h": 2}
        )
        db.add(w)
        db.commit()
        db.refresh(w)
        p1_widget_ids.append(w.id)
        
    # 2. Add Slicers & Date Filters to Page 1
    if cat_cols:
        primary_cat = cat_cols[0]
        s_w = DashboardWidget(
            dashboard_id=dash.id,
            widget_type="slicer",
            title=f"{primary_cat} Slicer",
            chart_config={
                "page_id": "page_1",
                "slicer_config": {
                    "column": primary_cat,
                    "multi_select": True,
                    "selected_values": []
                }
            },
            grid_position={"x": 0, "y": 2, "w": 4 if dt_cols else 6, "h": 2}
        )
        db.add(s_w)
        db.commit()
        db.refresh(s_w)
        p1_widget_ids.append(s_w.id)

    if dt_cols:
        primary_dt = dt_cols[0]
        d_w = DashboardWidget(
            dashboard_id=dash.id,
            widget_type="date_filter",
            title=f"{primary_dt} Timeline",
            chart_config={
                "page_id": "page_1",
                "date_filter_config": {
                    "date_col": primary_dt,
                    "preset": "all"
                }
            },
            grid_position={"x": 4 if cat_cols else 0, "y": 2, "w": 4, "h": 2}
        )
        db.add(d_w)
        db.commit()
        db.refresh(d_w)
        p1_widget_ids.append(d_w.id)

    if len(cat_cols) > 1:
        sec_cat = cat_cols[1]
        s2_w = DashboardWidget(
            dashboard_id=dash.id,
            widget_type="slicer",
            title=f"{sec_cat} Slicer",
            chart_config={
                "page_id": "page_1",
                "slicer_config": {
                    "column": sec_cat,
                    "multi_select": True,
                    "selected_values": []
                }
            },
            grid_position={"x": 8 if dt_cols else 6, "y": 2, "w": 4 if dt_cols else 6, "h": 2}
        )
        db.add(s2_w)
        db.commit()
        db.refresh(s2_w)
        p1_widget_ids.append(s2_w.id)

    # 3. Add Charts (First 2 to Page 1, remaining to Page 2)
    for idx, c in enumerate(recommended_charts):
        page_target = "page_1" if idx < 2 else "page_2"
        palette = "blue" if page_target == "page_1" else ("emerald" if idx % 2 == 0 else "amber")
        w = DashboardWidget(
            dashboard_id=dash.id,
            widget_type="chart",
            title=c["title"],
            chart_config={
                "chart_config": c["config"],
                "subtitle": c["config"].get("subtitle"),
                "page_id": page_target,
                "color_palette": palette
            },
            grid_position={"x": (idx % 2) * 6, "y": 4 + (idx // 2) * 4, "w": 6, "h": 4}
        )
        db.add(w)
        db.commit()
        db.refresh(w)
        if page_target == "page_1":
            p1_widget_ids.append(w.id)
        else:
            p2_widget_ids.append(w.id)

    # 4. Add Interactive Data Table Widget to Page 2
    table_cols = all_cols[:8] if all_cols else []
    tbl_w = DashboardWidget(
        dashboard_id=dash.id,
        widget_type="table",
        title=f"{ds.name} Data Table & Summary",
        chart_config={
            "page_id": "page_2",
            "table_config": {
                "columns": table_cols,
                "page_size": 5,
                "show_totals": True
            }
        },
        grid_position={"x": 0, "y": 8, "w": 12, "h": 4}
    )
    db.add(tbl_w)
    db.commit()
    db.refresh(tbl_w)
    p2_widget_ids.append(tbl_w.id)
            
    # Update layout page widget_ids
    default_layout["pages"][0]["widget_ids"] = p1_widget_ids
    default_layout["pages"][1]["widget_ids"] = p2_widget_ids
    dash.layout_config = default_layout
    db.commit()
    db.refresh(dash)
    
    return dash

@router.get("/dataset/{dataset_id}", response_model=DashboardResponse)
def get_or_create_auto_dashboard(dataset_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    existing_db = db.query(Dashboard).filter(
        Dashboard.dataset_id == ds.id,
        Dashboard.user_id == user_id,
        Dashboard.is_default == True
    ).first()
    
    if existing_db and existing_db.widgets:
        # Check if slicer and table are present; if not, backfill automatically
        has_slicer = any(w.widget_type == "slicer" for w in existing_db.widgets)
        has_table = any(w.widget_type == "table" for w in existing_db.widgets)
        
        if not has_slicer or not has_table:
            df = parse_dataset_file(ds.current_file_path, ds.original_filename)
            profile = profile_dataset(df, ds.id)
            eda = perform_eda(df)
            cat_cols = eda.get("categorical_columns", []) or [c["name"] for c in profile.get("columns", []) if c.get("inferred_type") == "categorical"]
            dt_cols = eda.get("datetime_columns", []) or [c["name"] for c in profile.get("columns", []) if c.get("inferred_type") == "datetime"]
            all_cols = [c["name"] for c in profile.get("columns", [])]
            
            layout = dict(existing_db.layout_config or {})
            pages = layout.get("pages", [])
            if not pages:
                pages = [
                    {"id": "page_1", "title": "Executive Overview", "widget_ids": [w.id for w in existing_db.widgets]},
                    {"id": "page_2", "title": "Detailed Segment Analysis", "widget_ids": []}
                ]
                layout["pages"] = pages
                
            if not has_slicer and cat_cols:
                s_w = DashboardWidget(
                    dashboard_id=existing_db.id,
                    widget_type="slicer",
                    title=f"{cat_cols[0]} Slicer",
                    chart_config={
                        "page_id": "page_1",
                        "slicer_config": {"column": cat_cols[0], "multi_select": True, "selected_values": []}
                    },
                    grid_position={"x": 0, "y": 2, "w": 4 if dt_cols else 6, "h": 2}
                )
                db.add(s_w)
                db.commit()
                db.refresh(s_w)
                pages[0]["widget_ids"].append(s_w.id)
                
            if not has_table:
                tbl_w = DashboardWidget(
                    dashboard_id=existing_db.id,
                    widget_type="table",
                    title=f"{ds.name} Data Table & Summary",
                    chart_config={
                        "page_id": "page_2" if len(pages) > 1 else "page_1",
                        "table_config": {"columns": all_cols[:8], "page_size": 5, "show_totals": True}
                    },
                    grid_position={"x": 0, "y": 8, "w": 12, "h": 4}
                )
                db.add(tbl_w)
                db.commit()
                db.refresh(tbl_w)
                target_p = pages[1] if len(pages) > 1 else pages[0]
                target_p["widget_ids"].append(tbl_w.id)

            existing_db.layout_config = layout
            db.commit()
            db.refresh(existing_db)

        return _build_dashboard_response(existing_db)

    # Automatically generate comprehensive default dashboard
    dash = _synthesize_complete_auto_dashboard(ds, user_id, db)
    return _build_dashboard_response(dash)

@router.post("/dataset/{dataset_id}/regenerate", response_model=DashboardResponse)
def regenerate_auto_dashboard(dataset_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    existing_db = db.query(Dashboard).filter(
        Dashboard.dataset_id == ds.id,
        Dashboard.user_id == user_id,
        Dashboard.is_default == True
    ).first()
    if existing_db:
        db.delete(existing_db)
        db.commit()
        
    dash = _synthesize_complete_auto_dashboard(ds, user_id, db)
    return _build_dashboard_response(dash)

@router.get("/dataset/{dataset_id}/all", response_model=List[DashboardResponse])
def get_all_dashboards_for_dataset(dataset_id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # Ensure default dashboard exists and is updated with all modern components
    try:
        get_or_create_auto_dashboard(dataset_id, user_id, db)
    except Exception:
        pass

    dashboards = db.query(Dashboard).filter(
        Dashboard.dataset_id == dataset_id,
        Dashboard.user_id == user_id
    ).order_by(Dashboard.is_default.desc(), Dashboard.updated_at.desc()).all()
    return [_build_dashboard_response(d) for d in dashboards]

@router.get("/{id}", response_model=DashboardResponse)
def get_dashboard_by_id(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    d = db.query(Dashboard).filter(Dashboard.id == id, Dashboard.user_id == user_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return _build_dashboard_response(d)

@router.post("", response_model=DashboardResponse)
def create_dashboard(payload: DashboardCreate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    ds = db.query(Dataset).filter(Dataset.id == payload.dataset_id, Dataset.user_id == user_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    layout = payload.layout_config or {
        "theme": "dark",
        "active_page_id": "page_1",
        "pages": [
            {
                "id": "page_1",
                "title": "Page 1",
                "description": "",
                "widget_ids": [],
                "local_filters": {}
            }
        ],
        "global_filters": {}
    }
    
    dash = Dashboard(
        dataset_id=payload.dataset_id,
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        is_default=payload.is_default,
        layout_config=layout
    )
    db.add(dash)
    db.commit()
    db.refresh(dash)
    
    saved_ids = []
    for w_schema in payload.widgets:
        w = DashboardWidget(
            dashboard_id=dash.id,
            widget_type=w_schema.widget_type,
            title=w_schema.title,
            chart_config={
                "subtitle": w_schema.subtitle,
                "page_id": w_schema.page_id or "page_1",
                "kpi_data": w_schema.kpi_data.model_dump() if w_schema.kpi_data else None,
                "chart_config": w_schema.chart_config.model_dump() if w_schema.chart_config else None,
                "table_config": w_schema.table_config.model_dump() if w_schema.table_config else None,
                "slicer_config": w_schema.slicer_config.model_dump() if w_schema.slicer_config else None,
                "date_filter_config": w_schema.date_filter_config.model_dump() if w_schema.date_filter_config else None,
                "color_palette": w_schema.color_palette or "blue"
            },
            grid_position={"w": w_schema.grid_w, "h": w_schema.grid_h}
        )
        db.add(w)
        db.commit()
        db.refresh(w)
        saved_ids.append(w.id)
        
    # If layout pages don't have widget_ids assigned yet, assign to page_1
    if layout.get("pages") and not layout["pages"][0].get("widget_ids"):
        layout["pages"][0]["widget_ids"] = saved_ids
        dash.layout_config = layout
        db.commit()
        db.refresh(dash)
        
    return _build_dashboard_response(dash)

@router.put("/{id}", response_model=DashboardResponse)
def update_dashboard(id: str, payload: DashboardUpdate, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    dash = db.query(Dashboard).filter(Dashboard.id == id, Dashboard.user_id == user_id).first()
    if not dash:
        raise HTTPException(status_code=404, detail="Dashboard not found")
        
    if payload.title is not None:
        dash.title = payload.title
    if payload.description is not None:
        dash.description = payload.description
    if payload.is_default is not None:
        dash.is_default = payload.is_default
    if payload.layout_config is not None:
        dash.layout_config = payload.layout_config
        
    if payload.widgets is not None:
        # Reconcile widgets: remove existing, replace with incoming
        db.query(DashboardWidget).filter(DashboardWidget.dashboard_id == dash.id).delete()
        for w_schema in payload.widgets:
            w = DashboardWidget(
                dashboard_id=dash.id,
                widget_type=w_schema.widget_type,
                title=w_schema.title,
                chart_config={
                    "subtitle": w_schema.subtitle,
                    "page_id": w_schema.page_id or "page_1",
                    "kpi_data": w_schema.kpi_data.model_dump() if hasattr(w_schema.kpi_data, "model_dump") else (w_schema.kpi_data.dict() if hasattr(w_schema.kpi_data, "dict") else w_schema.kpi_data),
                    "chart_config": w_schema.chart_config.model_dump() if hasattr(w_schema.chart_config, "model_dump") else (w_schema.chart_config.dict() if hasattr(w_schema.chart_config, "dict") else w_schema.chart_config),
                    "table_config": w_schema.table_config.model_dump() if hasattr(w_schema.table_config, "model_dump") else (w_schema.table_config.dict() if hasattr(w_schema.table_config, "dict") else w_schema.table_config),
                    "slicer_config": w_schema.slicer_config.model_dump() if hasattr(w_schema.slicer_config, "model_dump") else (w_schema.slicer_config.dict() if hasattr(w_schema.slicer_config, "dict") else w_schema.slicer_config),
                    "date_filter_config": w_schema.date_filter_config.model_dump() if hasattr(w_schema.date_filter_config, "model_dump") else (w_schema.date_filter_config.dict() if hasattr(w_schema.date_filter_config, "dict") else w_schema.date_filter_config),
                    "color_palette": w_schema.color_palette or "blue"
                },
                grid_position={"w": w_schema.grid_w, "h": w_schema.grid_h}
            )
            db.add(w)
            
    db.commit()
    db.refresh(dash)
    return _build_dashboard_response(dash)

@router.post("/{id}/duplicate", response_model=DashboardResponse)
def duplicate_dashboard(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    source = db.query(Dashboard).filter(Dashboard.id == id, Dashboard.user_id == user_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source dashboard not found")
        
    new_dash = Dashboard(
        dataset_id=source.dataset_id,
        user_id=user_id,
        title=f"Copy of {source.title}",
        description=source.description,
        is_default=False,
        layout_config=source.layout_config
    )
    db.add(new_dash)
    db.commit()
    db.refresh(new_dash)
    
    old_to_new_id_map = {}
    for w in source.widgets:
        new_w = DashboardWidget(
            dashboard_id=new_dash.id,
            widget_type=w.widget_type,
            title=w.title,
            chart_config=w.chart_config,
            grid_position=w.grid_position
        )
        db.add(new_w)
        db.commit()
        db.refresh(new_w)
        old_to_new_id_map[w.id] = new_w.id
        
    # Remap widget IDs inside layout_config pages
    if new_dash.layout_config and new_dash.layout_config.get("pages"):
        updated_pages = []
        for p in new_dash.layout_config["pages"]:
            p_copy = dict(p)
            p_copy["widget_ids"] = [old_to_new_id_map.get(wid, wid) for wid in p.get("widget_ids", [])]
            updated_pages.append(p_copy)
        layout = dict(new_dash.layout_config)
        layout["pages"] = updated_pages
        new_dash.layout_config = layout
        db.commit()
        db.refresh(new_dash)
        
    return _build_dashboard_response(new_dash)

@router.get("", response_model=List[DashboardResponse])
def list_dashboards(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    dashboards = db.query(Dashboard).filter(Dashboard.user_id == user_id).order_by(Dashboard.updated_at.desc()).all()
    return [_build_dashboard_response(d) for d in dashboards]

@router.delete("/{id}")
def delete_dashboard(id: str, user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    d = db.query(Dashboard).filter(Dashboard.id == id, Dashboard.user_id == user_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    db.delete(d)
    db.commit()
    return {"message": "Dashboard deleted"}
