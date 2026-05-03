from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def request_payload(**project):
    return {
        "enterprise": {"legal_name": "Acme", "organisation_type": "private_limited"},
        "project": project,
    }


def test_full_project_recommends_all_five():
    response = client.post("/ai/v1/routing/approval-path", json=request_payload(
        sector="manufacturing",
        power_requirement_kw=250,
        water_requirement_kld=50,
        fire_noc_required=True,
        hazardous_process=True,
        workers_count=30
    ))
    codes = [track["department_code"] for track in response.json()["result"]["recommended_tracks"]]
    for code in ["pollution", "power", "fire", "industrial_safety", "labour"]:
        assert code in codes
