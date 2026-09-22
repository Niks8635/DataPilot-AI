import os
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, get_db
from app.models.dataset import Dataset
from app.models.dashboard import Dashboard

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_advanced_dashboard_lifecycle():
    # 1. Upload/seed a mock dataset
    data = {
        "Date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"] * 4,
        "Region": ["North", "South", "East", "West"] * 5,
        "Category": ["Electronics", "Furniture", "Supplies", "Tech"] * 5,
        "Revenue": [100.0, 250.0, 300.0, 450.0, 500.0] * 4,
        "Profit": [20.0, 50.0, 60.0, 90.0, 110.0] * 4
    }
    df = pd.DataFrame(data)
    os.makedirs("data/uploads", exist_ok=True)
    fpath = "data/uploads/test_advanced_dash.csv"
    df.to_csv(fpath, index=False)

    db_gen = get_db()
    db = next(db_gen)
    ds = Dataset(
        user_id="demo-user-default-uuid",
        name="Dashboard Test Dataset",
        original_filename="test_advanced_dash.csv",
        file_path=fpath,
        current_file_path=fpath,
        file_type="csv",
        file_size_bytes=os.path.getsize(fpath),
        row_count=len(df),
        column_count=len(df.columns)
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)
    dataset_id = ds.id

    # 2. Get or Create Default Auto Dashboard
    res = client.get(f"/api/v1/dashboards/dataset/{dataset_id}")
    assert res.status_code == 200
    auto_dash = res.json()
    assert auto_dash["is_default"] is True
    assert "layout_config" in auto_dash
    assert "pages" in auto_dash["layout_config"]
    assert len(auto_dash["layout_config"]["pages"]) >= 1
    dash_id = auto_dash["id"]

    # 3. Get Dashboard by ID
    res_get = client.get(f"/api/v1/dashboards/{dash_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == dash_id

    # 4. Create a Custom Multi-Page Dashboard with KPI, Chart, Table, Slicer, DateFilter
    create_payload = {
        "dataset_id": dataset_id,
        "title": "Custom PowerBI Executive Studio",
        "description": "Custom user layout with multi-page and cross-filtering",
        "is_default": False,
        "layout_config": {
            "theme": "dark",
            "active_page_id": "page_1",
            "pages": [
                {
                    "id": "page_1",
                    "title": "Overview",
                    "description": "High-level summary",
                    "widget_ids": ["w_kpi_1", "w_slicer_1"],
                    "local_filters": {}
                },
                {
                    "id": "page_2",
                    "title": "Deep Dive",
                    "description": "Tables and breakdowns",
                    "widget_ids": ["w_table_1"],
                    "local_filters": {}
                }
            ],
            "global_filters": {}
        },
        "widgets": [
            {
                "id": "w_kpi_1",
                "widget_type": "kpi",
                "title": "Total Revenue",
                "page_id": "page_1",
                "kpi_data": {
                    "id": "kpi_rev",
                    "label": "Total Revenue",
                    "value": 3200.0,
                    "formatted_value": "$3,200.00",
                    "subtext": "Sum of Revenue",
                    "trend_direction": "up",
                    "icon_name": "DollarSign"
                },
                "grid_w": 4,
                "grid_h": 2
            },
            {
                "id": "w_slicer_1",
                "widget_type": "slicer",
                "title": "Region Slicer",
                "page_id": "page_1",
                "slicer_config": {
                    "column": "Region",
                    "multi_select": True,
                    "selected_values": ["North", "East"]
                },
                "grid_w": 4,
                "grid_h": 2
            },
            {
                "id": "w_table_1",
                "widget_type": "table",
                "title": "Detailed Transactions",
                "page_id": "page_2",
                "table_config": {
                    "columns": ["Date", "Region", "Category", "Revenue"],
                    "page_size": 5,
                    "show_totals": True
                },
                "grid_w": 12,
                "grid_h": 4
            }
        ]
    }
    res_create = client.post("/api/v1/dashboards", json=create_payload)
    assert res_create.status_code == 200
    custom_dash = res_create.json()
    assert custom_dash["title"] == "Custom PowerBI Executive Studio"
    assert len(custom_dash["widgets"]) == 3
    custom_dash_id = custom_dash["id"]

    # 5. Update Layout, Theme, and Widgets
    update_payload = {
        "title": "Custom Studio Updated",
        "layout_config": {
            "theme": "light",
            "active_page_id": "page_2",
            "pages": custom_dash["layout_config"]["pages"],
            "global_filters": {"Region": ["North"]}
        }
    }
    res_update = client.put(f"/api/v1/dashboards/{custom_dash_id}", json=update_payload)
    assert res_update.status_code == 200
    updated_dash = res_update.json()
    assert updated_dash["title"] == "Custom Studio Updated"
    assert updated_dash["layout_config"]["theme"] == "light"

    # 6. Duplicate Dashboard
    res_dup = client.post(f"/api/v1/dashboards/{custom_dash_id}/duplicate")
    assert res_dup.status_code == 200
    dup_dash = res_dup.json()
    assert "Copy of" in dup_dash["title"]
    assert len(dup_dash["widgets"]) == 3

    # 7. Get All Dashboards for Dataset
    res_all = client.get(f"/api/v1/dashboards/dataset/{dataset_id}/all")
    assert res_all.status_code == 200
    all_dashes = res_all.json()
    assert len(all_dashes) >= 3  # Auto + Custom + Duplicate
