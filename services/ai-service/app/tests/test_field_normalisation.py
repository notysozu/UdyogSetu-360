from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_pan_gstin_uppercase():
    response = client.post("/ai/v1/fields/normalise", json={"raw_fields": {"pan": "abcde1234f", "gstin": "29abcde1234f1z2"}})
    body = response.json()
    assert body["result"]["normalised_fields"]["pan"] == "ABCDE1234F"
    assert body["result"]["normalised_fields"]["gstin"] == "29ABCDE1234F1Z2"


def test_boolean_aliases_normalised():
    response = client.post("/ai/v1/fields/normalise", json={"raw_fields": {"fire_noc_required": "yes"}})
    assert response.json()["result"]["normalised_fields"]["fire_noc_required"] is True


def test_department_alias_normalised():
    response = client.post("/ai/v1/fields/normalise", json={"raw_fields": {"department_code": "KSPCB"}})
    assert response.json()["result"]["normalised_fields"]["department_code"] == "pollution"
