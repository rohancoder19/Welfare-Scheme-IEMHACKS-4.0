import os
import sys

import site
sys.path.insert(0, site.getusersitepackages())
sys.path.append(os.path.dirname(__file__))

from fastapi.testclient import TestClient
from api import app

client = TestClient(app)

def test_fastapi_endpoints():
    print("\n1. Testing GET /health ...")
    res_health = client.get("/health")
    print("Health Status:", res_health.status_code, res_health.json())
    assert res_health.status_code == 200

    print("\n2. Testing POST /predict-eligibility with RAG ...")
    payload = {
        "userProfile": {
            "income": 150000,
            "age": 22,
            "gender": "Female",
            "occupation": "Student",
            "category": "SC",
            "education": "Undergraduate",
            "state": "Maharashtra"
        },
        "schemes": []
    }
    res_rec = client.post("/predict-eligibility", json=payload)
    print("Prediction API Status:", res_rec.status_code)
    data = res_rec.json()
    print("Success:", data.get("success"))
    print("Returned Schemes Count:", len(data.get("recommendations", [])))

    if data.get("recommendations"):
        top = data["recommendations"][0]
        print("\nTop Ranked Scheme:")
        print("  - Name:", top["schemeName"])
        print("  - Category:", top["category"])
        print("  - Match:", top["matchPercentage"], "%")
        print("  - Status:", top.get("eligibilityStatus"), "(isEligible:", top["isEligible"], ")")
        print("  - Matched Reasons:", top["matchedReasons"])

if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    test_fastapi_endpoints()
