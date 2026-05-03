from __future__ import annotations

from datetime import datetime, timezone


def _hours_between(start, end) -> float:
    if not start or not end:
        return 0.0
    return max(0.0, (end - start).total_seconds() / 3600)


def extract_case_age_features(case_snapshot: dict) -> dict:
    now = datetime.now(timezone.utc)
    created_at = case_snapshot.get("created_at") or case_snapshot.get("submitted_at")
    return {
        "case_age_hours": round(_hours_between(created_at, now), 2),
        "hours_since_last_activity": round(_hours_between(case_snapshot.get("last_activity_at"), now), 2),
    }


def extract_task_age_features(tasks: list[dict]) -> dict:
    now = datetime.now(timezone.utc)
    if not tasks:
        return {"task_count": 0, "completed_task_ratio": 0, "open_query_count": 0}
    completed = sum(1 for task in tasks if task.get("status") in {"approved", "completed", "closed", "certificate_issued"})
    return {
        "task_count": len(tasks),
        "completed_task_ratio": round(completed / len(tasks), 2),
        "open_query_count": sum(1 for task in tasks if task.get("status") == "query_raised" or (task.get("query_count") or 0) > 0),
        "inspection_pending_flag": any(task.get("inspection_required") and task.get("status") != "inspection_completed" for task in tasks),
        "fee_pending_flag": any(task.get("fee_pending") for task in tasks),
        "certificate_pending_flag": any(task.get("certificate_pending") for task in tasks),
        "days_until_due": min(
            [round((task["due_at"] - now).total_seconds() / 86400, 2) for task in tasks if task.get("due_at")] or [0]
        ),
    }


def extract_queue_features(queue_signals: list[dict]) -> dict:
    return {
        "queue_backlog_count": sum(int(item.get("backlog_count") or 0) for item in queue_signals),
        "queue_deadletter_count": sum(int(item.get("deadletter_count") or 0) for item in queue_signals),
        "queue_retry_count": sum(int(item.get("retry_count") or 0) for item in queue_signals),
    }


def extract_adapter_features(adapter_signals: list[dict]) -> dict:
    return {
        "adapter_failure_count": sum(int(item.get("recent_failure_count") or 0) for item in adapter_signals),
        "degraded_adapter_count": sum(1 for item in adapter_signals if item.get("last_health_status") not in {None, "ok", "healthy"}),
    }


def extract_document_defect_features(documents: list[dict]) -> dict:
    return {
        "document_rejection_count": sum(1 for item in documents if item.get("status") in {"rejected", "expired"}),
        "missing_document_count": sum(1 for item in documents if item.get("status") == "missing"),
    }


def extract_grievance_features(grievances: list[dict]) -> dict:
    return {
        "open_grievance_count": sum(1 for item in grievances if item.get("status") not in {"resolved", "closed"}),
        "high_priority_grievance_count": sum(1 for item in grievances if item.get("priority") in {"high", "urgent"}),
    }


def extract_history_features(historical_signals: list[dict]) -> dict:
    if not historical_signals:
        return {"department_recent_breach_rate": 0.0}
    return {
        "department_recent_breach_rate": round(
            sum(float(item.get("recent_sla_breach_rate") or 0) for item in historical_signals) / len(historical_signals),
            2,
        )
    }


def build_sla_risk_features(request: dict) -> dict:
    return {
        **extract_case_age_features(request["case_snapshot"]),
        **extract_task_age_features(request.get("tasks", [])),
        **extract_queue_features(request.get("queue_signals", [])),
        **extract_adapter_features(request.get("adapter_signals", [])),
        **extract_history_features(request.get("historical_signals", [])),
    }


def build_bottleneck_features(request: dict) -> dict:
    return {
        **extract_case_age_features(request.get("case_snapshot") or {}),
        **extract_task_age_features(request.get("tasks", [])),
        **extract_queue_features(request.get("queue_signals", [])),
        **extract_adapter_features(request.get("adapter_signals", [])),
        **extract_history_features(request.get("historical_signals", [])),
    }


def build_next_action_features(request: dict) -> dict:
    return {
        **extract_case_age_features(request["case_snapshot"]),
        **extract_task_age_features(request.get("tasks", [])),
        **extract_queue_features(request.get("queue_signals", [])),
        **extract_adapter_features(request.get("adapter_signals", [])),
        **extract_document_defect_features(request.get("documents", [])),
        **extract_grievance_features(request.get("grievances", [])),
        **extract_history_features(request.get("historical_signals", [])),
    }
