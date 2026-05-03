from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def base_payload():
    return {
        "case_context": {"case_type": "factory", "status": "submitted", "department_codes": ["pollution"], "current_stage": "scrutiny"},
        "enterprise": {"legal_name": "Acme Industries", "organisation_type": "private_limited"},
        "project": {"project_name": "Plant A", "district": "Bengaluru Urban", "workers_count": 50, "power_requirement_kw": 100, "hazardous_process": True},
        "provided_documents": [],
        "extracted_document_fields": {
            "gst_certificate": {"legal_name": "Other Company"},
            "land_document": {"district": "Mysuru"}
        }
    }


def test_gstin_name_mismatch_detected():
    response = client.post("/ai/v1/mismatch/detect", json=base_payload())
    types = [item["mismatch_type"] for item in response.json()["result"]["mismatches"]]
    assert "gstin_legal_name_mismatch" in types


def test_district_mismatch_detected():
    response = client.post("/ai/v1/mismatch/detect", json=base_payload())
    types = [item["mismatch_type"] for item in response.json()["result"]["mismatches"]]
    assert "district_mismatch" in types
