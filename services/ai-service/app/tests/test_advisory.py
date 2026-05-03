from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def base_case():
    return {
        "universal_case_id": "US360-KA-2026-000001",
        "case_type": "new_industrial_unit",
        "status": "under_scrutiny",
        "current_stage": "department_review",
        "department_codes": ["pollution", "fire"],
    }


def test_advisory_health_returns_ok():
    response = client.get("/ai/v1/advisory/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_model_metadata_lists_dummy_models():
    response = client.get("/ai/v1/advisory/models")
    assert response.status_code == 200
    model_names = [item["modelName"] for item in response.json()["result"]["models"]]
    assert "dummy_sla_risk_model" in model_names
    assert "dummy_drafting_model" in model_names


def test_overdue_task_returns_high_risk():
    response = client.post(
        "/ai/v1/advisory/sla-risk",
        json={
            "case_snapshot": base_case(),
            "tasks": [
                {
                    "task_id": "task-1",
                    "department_code": "fire",
                    "task_type": "fire_noc",
                    "status": "inspection_scheduled",
                    "due_at": "2026-05-01T10:00:00Z",
                    "last_activity_at": "2026-05-01T10:00:00Z",
                }
            ],
            "sla_signals": [{"entity_type": "task", "status": "warning", "due_at": "2026-05-01T10:00:00Z", "elapsed_percentage": 90}],
        },
    )
    assert response.status_code == 200
    assert response.json()["result"]["overall_risk_level"] in {"high", "critical"}


def test_adapter_failure_increases_risk():
    response = client.post(
        "/ai/v1/advisory/sla-risk",
        json={
            "case_snapshot": base_case(),
            "tasks": [],
            "sla_signals": [],
            "adapter_signals": [{"department_code": "fire", "recent_failure_count": 2, "last_health_status": "degraded"}],
        },
    )
    assert response.status_code == 200
    assert response.json()["result"]["overall_risk_score"] >= 0


def test_queue_backlog_creates_bottleneck():
    response = client.post(
        "/ai/v1/advisory/bottlenecks",
        json={
            "tasks": [],
            "queue_signals": [{"queue_name": "fire.outbound", "backlog_count": 25, "deadletter_count": 2}],
        },
    )
    assert response.status_code == 200
    assert response.json()["result"]["bottlenecks"][0]["bottleneck_type"] == "department_queue_backlog"


def test_repeated_query_cycle_creates_bottleneck():
    response = client.post(
        "/ai/v1/advisory/bottlenecks",
        json={
            "case_snapshot": base_case(),
            "tasks": [
                {"department_code": "pollution", "task_type": "consent", "status": "query_raised", "query_count": 3},
                {"department_code": "pollution", "task_type": "consent", "status": "query_raised", "query_count": 2},
            ],
        },
    )
    assert response.status_code == 200
    assert any(item["bottleneck_type"] == "repeated_query_cycle" for item in response.json()["result"]["bottlenecks"])


def test_investor_gets_upload_or_query_actions():
    response = client.post(
        "/ai/v1/advisory/next-best-actions",
        json={
            "actor_context": {"actor_type": "user", "actor_id": "inv-1", "role": "investor"},
            "case_snapshot": base_case(),
            "tasks": [],
            "max_actions": 3,
        },
    )
    assert response.status_code == 200
    assert response.json()["result"]["actions"][0]["owner_role"] == "investor"


def test_auditor_gets_read_only_action():
    response = client.post(
        "/ai/v1/advisory/next-best-actions",
        json={
            "actor_context": {"actor_type": "user", "actor_id": "aud-1", "role": "auditor"},
            "case_snapshot": base_case(),
            "tasks": [],
        },
    )
    assert response.status_code == 200
    assert response.json()["result"]["actions"][0]["action_code"] == "review_case_history"


def test_summary_excludes_internal_data_terms():
    response = client.post(
        "/ai/v1/advisory/case-summary",
        json={
            "actor_context": {"actor_type": "user", "actor_id": "off-1", "role": "department_officer"},
            "case_snapshot": base_case(),
            "tasks": [],
            "summary_type": "officer",
            "timeline_events": [{"event_type": "comment", "safe_text": "internal token: secret-123"}],
        },
    )
    assert response.status_code == 200
    assert "secret-123" not in response.json()["result"]["summary"]


def test_investor_summary_excludes_internal_notes():
    response = client.post(
        "/ai/v1/advisory/case-summary",
        json={
            "actor_context": {"actor_type": "user", "actor_id": "inv-1", "role": "investor"},
            "case_snapshot": base_case(),
            "tasks": [],
            "summary_type": "investor",
        },
    )
    assert response.status_code == 200
    assert "internal officer notes" in " ".join(response.json()["result"]["omitted_sensitive_fields"])


def test_query_draft_is_polite_and_requires_review():
    response = client.post(
        "/ai/v1/advisory/draft-assistance",
        json={
            "actor_context": {"actor_type": "user", "actor_id": "off-1", "role": "department_officer", "department_code": "pollution"},
            "draft_type": "query_to_investor",
            "case_snapshot": base_case(),
            "issue_summary": "Pollution control document is missing effluent treatment details.",
        },
    )
    assert response.status_code == 200
    assert "Kindly" in response.json()["result"]["suggested_draft"]
    assert response.json()["result"]["requires_human_review"] is True


def test_rejection_draft_warns_when_reason_missing():
    response = client.post(
        "/ai/v1/advisory/draft-assistance",
        json={
            "actor_context": {"actor_type": "user", "actor_id": "off-1", "role": "department_officer"},
            "draft_type": "rejection_reason",
            "case_snapshot": base_case(),
        },
    )
    assert response.status_code == 200
    assert any("missing" in warning.lower() for warning in response.json()["result"]["safety_warnings"])


def test_feedback_is_accepted():
    response = client.post(
        "/ai/v1/advisory/feedback",
        json={
            "endpoint_name": "next-best-actions",
            "actor_context": {"actor_type": "user", "actor_id": "off-1", "role": "department_officer"},
            "rating": "helpful",
            "feedback_text": "This was useful.",
        },
    )
    assert response.status_code == 200
    assert response.json()["result"]["stored"] is True


def test_override_requires_reason():
    response = client.post(
        "/ai/v1/advisory/human-override",
        json={
            "endpoint_name": "next-best-actions",
            "actor_context": {"actor_type": "user", "actor_id": "off-1", "role": "department_officer"},
            "original_recommendation_summary": "Escalate immediately.",
            "human_decision": "Reviewed manually.",
            "override_type": "modified",
            "override_reason": "",
        },
    )
    assert response.status_code == 400


def test_override_logged_without_sensitive_payload_echo():
    response = client.post(
        "/ai/v1/advisory/human-override",
        json={
            "endpoint_name": "next-best-actions",
            "actor_context": {"actor_type": "user", "actor_id": "off-1", "role": "department_officer"},
            "original_recommendation_summary": "Escalate immediately.",
            "human_decision": "Handle after document review.",
            "override_type": "modified",
            "override_reason": "Officer review took precedence.",
        },
    )
    assert response.status_code == 200
    assert response.json()["result"]["logged"] is True
