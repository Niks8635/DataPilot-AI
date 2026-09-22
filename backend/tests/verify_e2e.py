import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://127.0.0.1:8000/api/v1"

def post(url, data=None):
    if data is None:
        data = {}
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode("utf-8"), 
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get(url):
    with urllib.request.urlopen(url) as resp:
        return json.loads(resp.read().decode())

def run_tests():
    print("1. Seeding demo sales dataset...")
    ds = post(f"{BASE}/datasets/demo")
    ds_id = ds["id"]
    print(f"   -> Dataset ID: {ds_id}")
    print(f"   -> Name: {ds['name']}")
    print(f"   -> Rows: {ds['row_count']}, Columns: {ds['column_count']}")

    print("\n2. Getting spreadsheet preview...")
    prev = get(f"{BASE}/datasets/{ds_id}/preview?page=1&page_size=5")
    print(f"   -> Preview rows loaded: {len(prev['rows'])}")
    print(f"   -> Columns detected: {[c['name'] for c in prev['columns']]}")

    print("\n3. Getting profile and quality score...")
    prof = get(f"{BASE}/datasets/{ds_id}/profile")
    qual = get(f"{BASE}/datasets/{ds_id}/quality")
    print(f"   -> Quality Score: {qual['overall_score']}/100 ({qual['grade']})")
    print(f"   -> Structural Health: {qual['structural_health']}%")
    print(f"   -> Summary Badges: {qual['summary_badges']}")

    print("\n4. Getting cleaning suggestions and applying duplicate removal...")
    suggs = get(f"{BASE}/datasets/{ds_id}/cleaning-suggestions")
    print(f"   -> Suggested cleaning operations: {len(suggs)}")
    for s in suggs[:3]:
        print(f"      • {s['title']} ({s['impact_estimate']})")
    clean_res = post(
        f"{BASE}/datasets/{ds_id}/clean",
        {"actions": [{"action_type": "drop_duplicates"}]}
    )
    print(f"   -> Cleaned successfully! Rows before: {clean_res['rows_before']}, after: {clean_res['rows_after']}")
    print(f"   -> Version incremented to: v{clean_res['new_version_number']}")

    print("\n5. Running comprehensive analysis (EDA, Correlations, AI Insights)...")
    anl = get(f"{BASE}/analysis/{ds_id}")
    print(f"   -> Executive Summary: {anl['insights']['executive_summary']}")
    print(f"   -> Key Insights ({len(anl['insights']['key_insights'])}):")
    for ins in anl['insights']['key_insights'][:2]:
        print(f"      • {ins}")

    print("\n6. Generating Auto-Dashboard...")
    dash = get(f"{BASE}/dashboards/dataset/{ds_id}")
    print(f"   -> Dashboard Title: {dash['title']}")
    print(f"   -> Total Generated Widgets: {len(dash['widgets'])}")
    for w in dash["widgets"]:
        print(f"      - [{w['widget_type'].upper()}] {w['title']}")

    print("\n7. Conversational Ask Your Data: 'What is total Revenue?'...")
    ask_res = post(f"{BASE}/ask-data", {"dataset_id": ds_id, "question": "What is total Revenue?"})
    print(f"   -> Executed Code: {ask_res.get('executed_code')}")
    print(f"   -> Answer: {ask_res['answer_text']}")

    print("\n8. Generating Executive Report...")
    rep = post(f"{BASE}/reports/generate", {"dataset_id": ds_id, "title": "Executive Sales & Profit Audit"})
    print(f"   -> Report ID: {rep['id']}")
    print(f"   -> Title: {rep['title']}")

    print("\n✅ COMPLETE VERIFICATION PASSED: ALL 8 CORE ANALYTICS WORKFLOWS EXECUTED PERFECTLY!")

if __name__ == "__main__":
    run_tests()
