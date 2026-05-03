from __future__ import annotations

from app.models.dummy_next_action_model import DummyNextActionModel
from app.services.feature_engineering_service import build_next_action_features


ROLE_ACTIONS = {
    "investor": {"respond_to_query", "upload_document", "verify_fee_payment", "review_grievance"},
    "department_officer": {"review_document", "respond_to_query", "schedule_inspection", "complete_inspection_report", "create_fee_demand", "approve_task", "reject_with_reason", "issue_certificate"},
    "department_supervisor": {"review_document", "escalate_sla_risk", "schedule_inspection", "create_fee_demand", "approve_task", "reject_with_reason"},
    "nodal_officer": {"escalate_sla_risk", "contact_department_adapter_owner", "review_grievance"},
    "admin": {"contact_department_adapter_owner", "escalate_sla_risk", "review_grievance"},
    "auditor": {"review_case_history"},
}


def suggest_next_best_actions(payload: dict) -> dict:
    actor = payload["actor_context"]
    role = actor.get("role") or "anonymous"
    allowed = ROLE_ACTIONS.get(role, set())
    features = build_next_action_features(payload)
    actions = []
    blocked = []

    for task in payload.get("tasks", []):
        if task.get("status") in {"new", "assigned", "under_review"}:
            candidate = {
                "action_code": "review_document",
                "label": "Review documents",
                "description": "Continue document scrutiny for the task.",
                "owner_role": "department_officer",
                "department_code": task.get("department_code"),
                "target_entity_type": "task",
                "target_entity_id": task.get("task_id"),
                "priority": "high" if features.get("document_rejection_count", 0) else "medium",
                "reason": "The task is under active scrutiny and document review remains relevant.",
                "expected_outcome": "Scrutiny progresses with clearer document status.",
                "confidence": 0.77,
                "must_be_human_approved": True,
            }
            (actions if candidate["action_code"] in allowed else blocked).append(candidate)
        if task.get("inspection_required") and task.get("status") != "inspection_completed":
            candidate = {
                "action_code": "schedule_inspection",
                "label": "Schedule inspection",
                "description": "Arrange the pending inspection step.",
                "owner_role": "department_officer",
                "department_code": task.get("department_code"),
                "target_entity_type": "task",
                "target_entity_id": task.get("task_id"),
                "priority": "high",
                "reason": "Inspection is required before the workflow can progress.",
                "expected_outcome": "Operational blockage reduces once inspection is scheduled or completed.",
                "confidence": 0.8,
                "must_be_human_approved": True,
            }
            (actions if candidate["action_code"] in allowed else blocked).append(candidate)
        if task.get("fee_pending"):
            candidate = {
                "action_code": "create_fee_demand",
                "label": "Create fee demand",
                "description": "Prepare the pending fee demand for human review.",
                "owner_role": "department_officer",
                "department_code": task.get("department_code"),
                "target_entity_type": "task",
                "target_entity_id": task.get("task_id"),
                "priority": "medium",
                "reason": "Fee dependency is delaying completion.",
                "expected_outcome": "Payment step can begin once demand is created.",
                "confidence": 0.75,
                "must_be_human_approved": True,
            }
            (actions if candidate["action_code"] in allowed else blocked).append(candidate)

    if features.get("queue_backlog_count", 0) > 0:
        candidate = {
            "action_code": "contact_department_adapter_owner",
            "label": "Review operational dependencies",
            "description": "Coordinate with technical owners if backlog or adapter issues persist.",
            "owner_role": "admin" if role == "admin" else "nodal_officer",
            "department_code": None,
            "target_entity_type": "case",
            "target_entity_id": payload["case_snapshot"].get("universal_case_id"),
            "priority": "high",
            "reason": "Operational signals suggest downstream processing friction.",
            "expected_outcome": "Dependency delays are surfaced early for human action.",
            "confidence": 0.74,
            "must_be_human_approved": True,
        }
        (actions if candidate["action_code"] in allowed else blocked).append(candidate)

    if role == "investor":
        candidate = {
            "action_code": "respond_to_query",
            "label": "Respond to outstanding query",
            "description": "Review pending clarifications and upload the required information.",
            "owner_role": "investor",
            "department_code": None,
            "target_entity_type": "case",
            "target_entity_id": payload["case_snapshot"].get("universal_case_id"),
            "priority": "high",
            "reason": "Investor action can unblock the case.",
            "expected_outcome": "Department review can resume.",
            "confidence": 0.82,
            "must_be_human_approved": True,
        }
        (actions if candidate["action_code"] in allowed else blocked).append(candidate)

    if role == "auditor":
        actions.append(
            {
                "action_code": "review_case_history",
                "label": "Review case history",
                "description": "Examine the supplied history and note any audit questions.",
                "owner_role": "auditor",
                "department_code": None,
                "target_entity_type": "case",
                "target_entity_id": payload["case_snapshot"].get("universal_case_id"),
                "priority": "medium",
                "reason": "Auditor role is read-only and should receive non-mutating suggestions.",
                "expected_outcome": "Audit review can proceed without changing workflow state.",
                "confidence": 0.86,
                "must_be_human_approved": True,
            }
        )

    actions = DummyNextActionModel().prioritise(actions, max(1, int(payload.get("max_actions", 5))))
    return {
        "result": {
            "actions": actions,
            "priority_ordering_reason": "Actions are sorted by urgency and operational unblock potential.",
            "blocked_actions": blocked[:5],
            "human_review_required": True,
        },
        "confidence": 0.81 if actions else 0.68,
        "warnings": [] if actions else ["no_action_candidates_found"],
        "signals": [
            {"name": "actor_role", "value": role, "weight": 0.2, "impact": "neutral", "explanation": "Role-based suggestions are constrained by permissible actions."},
            {"name": "open_query_count", "value": features.get("open_query_count", 0), "weight": 0.2, "impact": "negative", "explanation": "Open queries often define the next useful action."},
            {"name": "inspection_pending_flag", "value": features.get("inspection_pending_flag"), "weight": 0.2, "impact": "negative", "explanation": "Pending inspections can block downstream decisions."},
        ],
        "rules": [
            {"ruleCode": "role_limited_actions", "description": "Only actions available to the actor role are suggested.", "matched": True, "outcome": "enforced"},
            {"ruleCode": "auditor_read_only", "description": "Auditors receive read-only recommendations.", "matched": role == "auditor", "outcome": "read_only" if role == "auditor" else "not_applicable"},
        ],
    }
