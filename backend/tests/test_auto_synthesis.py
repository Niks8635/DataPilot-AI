import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.dataset import Dataset
from app.models.dashboard import Dashboard

client = TestClient(app)

def test_complete_auto_dashboard_synthesis_and_regenerate():
    db = SessionLocal()
    # Find or use an existing dataset
    ds = db.query(Dataset).first()
    assert ds is not None, "At least one dataset must exist in DB for testing"
    ds_id = ds.id
    db.close()

    # 1. Test auto dashboard endpoint
    res = client.get(f"/api/v1/dashboards/dataset/{ds_id}")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["dataset_id"] == ds_id
    assert data["is_default"] is True
    assert len(data["widgets"]) >= 6, f"Expected at least 6 widgets, got {len(data['widgets'])}"
    
    # Check widget types
    types = [w["widget_type"] for w in data["widgets"]]
    assert "kpi" in types, "KPI cards should be present"
    assert "chart" in types, "Charts should be present"
    assert "slicer" in types, "Slicer should be present"
    assert "table" in types, "Table should be present"

    # Check pages
    layout = data.get("layout_config", {})
    pages = layout.get("pages", [])
    assert len(pages) >= 2, f"Expected at least 2 pages, got {len(pages)}"
    assert pages[0]["title"] == "Executive Overview"
    assert pages[1]["title"] == "Detailed Segment Analysis"

    # 2. Test regenerate endpoint
    regen_res = client.post(f"/api/v1/dashboards/dataset/{ds_id}/regenerate")
    assert regen_res.status_code == 200, regen_res.text
    regen_data = regen_res.json()
    assert regen_data["dataset_id"] == ds_id
    assert len(regen_data["widgets"]) >= 6

    # 3. Test list all dashboards
    all_res = client.get(f"/api/v1/dashboards/dataset/{ds_id}/all")
    assert all_res.status_code == 200
    all_dashboards = all_res.json()
    assert len(all_dashboards) >= 1
    assert any(d["is_default"] for d in all_dashboards)
