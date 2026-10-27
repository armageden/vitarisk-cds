"""
VitaRisk CDS - Backend API Integration Tests
Tests all endpoints: /api/health, /api/predict, /api/explain, /api/simulate, /api/cohorts, /api/fairness, /api/benchmarks.
"""

import sys
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing /api/health...")
    res = client.get("/api/health")
    assert res.status_code == 200, res.text
    print("  ✅ /api/health passed:", res.json())

    print("\nTesting /api/cohorts...")
    res = client.get("/api/cohorts")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "total_patients" in data
    assert len(data["presets"]) >= 4
    print(f"  ✅ /api/cohorts passed. Total patients: {data['total_patients']}, Presets: {len(data['presets'])}")

    print("\nTesting /api/predict...")
    preset_data = data["presets"][0]["data"]
    res = client.post("/api/predict", json=preset_data)
    assert res.status_code == 200, res.text
    pred = res.json()
    assert "probabilities" in pred
    assert "tier" in pred
    assert "recommendations" in pred
    print(f"  ✅ /api/predict passed. Tier: {pred['tier']}, Composite: {pred['probabilities']['composite']}")

    print("\nTesting /api/explain...")
    res = client.post("/api/explain", json={"patient": preset_data, "target": "onset_t2d"})
    assert res.status_code == 200, res.text
    exp = res.json()
    assert "top_contributions" in exp
    assert len(exp["top_contributions"]) > 0
    print(f"  ✅ /api/explain passed. Top feature: {exp['top_contributions'][0]['feature']} ({exp['top_contributions'][0]['shap_value']})")

    print("\nTesting /api/simulate...")
    res = client.post("/api/simulate", json={
        "patient": preset_data,
        "interventions": {"hba1c": 6.2, "systolic_bp": 125.0, "smoking_status": "Never"}
    })
    assert res.status_code == 200, res.text
    sim = res.json()
    assert "absolute_risk_reduction" in sim
    print(f"  ✅ /api/simulate passed. ARR Composite: {sim['absolute_risk_reduction']['composite']}")

    print("\nTesting /api/fairness...")
    res = client.get("/api/fairness")
    assert res.status_code == 200, res.text
    print("  ✅ /api/fairness passed.")

    print("\nTesting /api/benchmarks...")
    res = client.get("/api/benchmarks")
    assert res.status_code == 200, res.text
    print("  ✅ /api/benchmarks passed.")

    print("\n🎉 ALL BACKEND API INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_endpoints()
