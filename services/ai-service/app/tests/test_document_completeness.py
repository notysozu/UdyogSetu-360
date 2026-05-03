from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def payload(documents):
    return {
        "case_context": {"case_type": "factory", "status": "draft", "department_codes": [], "current_stage": "submission"},
        "enterprise": {"legal_name": "Acme Industries", "organisation_type": "private_limited"},
        "project": {"sector": "manufacturing", "power_requirement_kw": 150, "water_requirement_kld": 20, "fire_noc_required": True, "workers_count": 20},
        "provided_documents": documents,
        "declared_approval_tracks": ["pollution", "power", "fire", "labour"],
    }


def test_complete_document_set_returns_complete():
    response = client.post("/ai/v1/documents/completeness-check", json=payload([
        {"document_type": "project_report"},
        {"document_type": "pollution_control_document"},
        {"document_type": "land_document"},
        {"document_type": "layout_plan"},
        {"document_type": "fire_safety_plan"},
        {"document_type": "labour_document"},
    ]))
    assert response.status_code == 200
    assert response.json()["result"]["completeness_status"] in {"complete", "needs_review"}


def test_missing_pollution_document_returns_incomplete():
    response = client.post("/ai/v1/documents/completeness-check", json=payload([{"document_type": "project_report"}]))
    assert response.status_code == 200
    assert response.json()["result"]["completeness_status"] == "incomplete"


def test_unknown_document_types_produce_warning():
    response = client.post("/ai/v1/documents/completeness-check", json=payload([{"document_type": "mystery_doc"}]))
    assert "unknown document types" in response.json()["explainability"]["warnings"]
