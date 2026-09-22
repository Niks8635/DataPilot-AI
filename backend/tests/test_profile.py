import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_user_profile_lifecycle():
    # 1. Get profile
    res = client.get("/api/v1/auth/profile")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "email" in data
    assert "full_name" in data
    assert "organization" in data
    assert "role" in data
    assert "stats" in data
    assert "datasets" in data
    assert "recent_activity" in data
    assert "security" in data

    stats = data["stats"]
    assert "total_datasets" in stats
    assert "total_rows" in stats
    assert "total_storage_bytes" in stats
    assert "total_dashboards" in stats

    # 2. Update profile
    new_name = "Lead Analytics Architect"
    new_org = "DataPilot AI Labs"
    put_res = client.put("/api/v1/auth/profile", json={
        "full_name": new_name,
        "organization": new_org,
        "role": "Principal Data Analyst"
    })
    assert put_res.status_code == 200, put_res.text
    updated = put_res.json()
    assert updated["full_name"] == new_name
    assert updated["organization"] == new_org

    # 3. Export full user data package (GDPR portability)
    export_res = client.post("/api/v1/auth/export-data")
    assert export_res.status_code == 200, export_res.text
    export_data = export_res.json()
    assert "exported_at" in export_data
    assert "user" in export_data
    assert "stats" in export_data
    assert "datasets" in export_data
    assert "dashboards" in export_data
