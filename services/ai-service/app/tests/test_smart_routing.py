from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_missing_documents_produces_next_best_action():
    response = client.post("/ai/v1/routing/smart-suggestions", json={
        "case_context": {"case_type": "factory", "status": "submitted", "department_codes": ["fire"], "current_stage": "scrutiny"},
        "enterprise": {"legal_name": "Acme", "organisation_type": "private_limited"},
        "project": {"sector": "manufacturing", "fire_noc_required": True},
        "document_summary": {"missingDocuments": ["layout_plan"]},
        "grievance_summary": {},
        "sla_summary": {"inspectionRequired": True, "hasWarnings": True},
        "historical_signals": {},
    })
    body = response.json()
    assert "missing_documents" in body["result"]["risk_flags"]
    assert body["result"]["next_best_actions"]
