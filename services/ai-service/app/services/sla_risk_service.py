from __future__ import annotations

from app.models.dummy_sla_risk_model import DummySlaRiskModel
from app.services.feature_engineering_service import build_sla_risk_features


def _risk_level(score: int) -> str:
    if score >= 85:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"


def predict_sla_risk(payload: dict) -> dict:
    model = DummySlaRiskModel()
    model_output = model.predict(payload)
    features = build_sla_risk_features(payload)
    queue_pressure = min(20, int(features.get("queue_backlog_count", 0) / 5))
    adapter_penalty = min(20, int(features.get("adapter_failure_count", 0) * 5))
    at_risk_entities = []
    drivers = []
    warnings = []

    if features.get("queue_backlog_count", 0) > 0:
        drivers.append(
            {
                "driver_code": "queue_backlog",
                "label": "Queue backlog",
                "impact": "negative",
                "evidence": f"Backlog count is {features['queue_backlog_count']}.",
                "confidence": 0.74,
            }
        )
    if features.get("adapter_failure_count", 0) > 0:
        drivers.append(
            {
                "driver_code": "adapter_failures",
                "label": "Adapter failures",
                "impact": "negative",
                "evidence": f"Recent adapter failures total {features['adapter_failure_count']}.",
                "confidence": 0.79,
            }
        )

    highest_score = 0
    for item in model_output["scored_tasks"]:
        score = min(100, item["score"] + queue_pressure + adapter_penalty)
        level = _risk_level(score)
        highest_score = max(highest_score, score)
        if level != "low":
            at_risk_entities.append(
                {
                    "entity_type": "task",
                    "entity_id": item["task"].get("task_id") or f"task-{item['task']['department_code']}",
                    "department_code": item["task"].get("department_code"),
                    "current_status": item["task"].get("status", "unknown"),
                    "due_at": item["task"].get("due_at"),
                    "risk_score": score,
                    "risk_level": level,
                    "reason": "; ".join(item["evidence"]) or "Derived from current SLA and activity signals.",
                    "suggested_owner_role": "department_officer" if item["task"].get("status") == "query_raised" else "department_supervisor",
                }
            )
    if not payload.get("sla_signals"):
        warnings.append("sla_signals_missing")
    if not payload.get("tasks"):
        warnings.append("tasks_missing")

    interventions = []
    if highest_score >= 65:
        interventions.append(
            {
                "action_code": "review_at_risk_tasks",
                "label": "Review at-risk tasks",
                "owner_role": "department_supervisor",
                "department_code": None,
                "urgency": "high",
                "reason": "High-risk tasks need immediate human review.",
                "must_be_human_approved": True,
            }
        )
    if features.get("adapter_failure_count", 0) > 0:
        interventions.append(
            {
                "action_code": "contact_department_adapter_owner",
                "label": "Contact adapter owner",
                "owner_role": "admin",
                "department_code": None,
                "urgency": "medium",
                "reason": "Adapter instability may cause SLA delay.",
                "must_be_human_approved": True,
            }
        )

    return {
        "result": {
            "overall_risk_level": _risk_level(highest_score),
            "overall_risk_score": highest_score,
            "at_risk_entities": at_risk_entities,
            "risk_drivers": drivers,
            "recommended_interventions": interventions,
            "monitoring_notes": [
                "This prediction is advisory only.",
                "Node services and officers remain responsible for decisions.",
            ],
        },
        "confidence": 0.84 if highest_score >= 65 else 0.73,
        "warnings": warnings,
        "signals": [
            {"name": "queue_backlog_count", "value": features.get("queue_backlog_count", 0), "weight": 0.2, "impact": "negative", "explanation": "Operational backlog can delay task progression."},
            {"name": "adapter_failure_count", "value": features.get("adapter_failure_count", 0), "weight": 0.2, "impact": "negative", "explanation": "Adapter failures can block department callbacks."},
            {"name": "hours_since_last_activity", "value": features.get("hours_since_last_activity", 0), "weight": 0.2, "impact": "negative", "explanation": "Long inactivity windows increase breach risk."},
        ],
        "rules": [
            {"ruleCode": "overdue_due_at", "description": "Overdue entities are high risk.", "matched": highest_score >= 65, "outcome": "risk_increased"},
            {"ruleCode": "queue_backlog_penalty", "description": "Queue backlog raises risk.", "matched": features.get("queue_backlog_count", 0) > 0, "outcome": "risk_adjusted"},
        ],
    }
