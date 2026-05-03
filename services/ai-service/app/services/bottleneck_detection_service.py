from __future__ import annotations

from app.models.dummy_bottleneck_model import DummyBottleneckModel
from app.services.feature_engineering_service import build_bottleneck_features


def detect_bottlenecks(payload: dict) -> dict:
    features = build_bottleneck_features(payload)
    model = DummyBottleneckModel()
    bottlenecks = model.detect(features)
    case_snapshot = payload.get("case_snapshot") or {}

    repeated_query_tasks = [task for task in payload.get("tasks", []) if (task.get("query_count") or 0) >= 2]
    if repeated_query_tasks:
        bottlenecks.append(
            {
                "bottleneck_type": "repeated_query_cycle",
                "department_code": repeated_query_tasks[0].get("department_code"),
                "stage": payload.get("case_snapshot", {}).get("current_stage"),
                "severity": "medium",
                "bottleneck_score": 62,
                "evidence": [f"{len(repeated_query_tasks)} tasks show repeated query loops."],
                "likely_cause": "Repeated clarifications are slowing task completion.",
                "recommended_action": "Review document defect patterns and improve first-pass scrutiny clarity.",
                "confidence": 0.71,
            }
        )

    hydrated = []
    for item in bottlenecks:
        hydrated.append(
            {
                "department_code": item.get("department_code"),
                "stage": item.get("stage") or case_snapshot.get("current_stage"),
                "severity": item["severity"],
                "bottleneck_score": item["bottleneck_score"],
                "evidence": item.get("evidence") or [item["likely_cause"]],
                "likely_cause": item["likely_cause"],
                "recommended_action": item["recommended_action"],
                "confidence": item.get("confidence", 0.76),
                "bottleneck_type": item["bottleneck_type"],
            }
        )

    return {
        "result": {
            "bottlenecks": hydrated,
            "bottleneck_summary": "Likely bottlenecks were identified from task age, queue signals, adapter health and query patterns." if hydrated else "No strong bottleneck signal was found in the supplied data.",
            "suggested_remediation": [item["recommended_action"] for item in hydrated[:5]],
            "watchlist": [item["bottleneck_type"] for item in hydrated[:5]],
        },
        "confidence": 0.79 if hydrated else 0.72,
        "warnings": [] if hydrated else ["limited_bottleneck_evidence"],
        "signals": [
            {"name": "queue_backlog_count", "value": features.get("queue_backlog_count", 0), "weight": 0.25, "impact": "negative", "explanation": "Heavy backlog is a common operational bottleneck indicator."},
            {"name": "adapter_failure_count", "value": features.get("adapter_failure_count", 0), "weight": 0.25, "impact": "negative", "explanation": "Adapter instability can stall downstream work."},
            {"name": "hours_since_last_activity", "value": features.get("hours_since_last_activity", 0), "weight": 0.15, "impact": "negative", "explanation": "No-activity windows suggest stalled progression."},
        ],
        "rules": [
            {"ruleCode": "queue_backlog_bottleneck", "description": "High queue backlog suggests a bottleneck.", "matched": features.get("queue_backlog_count", 0) >= 20, "outcome": "bottleneck_flagged"},
            {"ruleCode": "repeated_query_cycle", "description": "Repeated queries indicate rework loop risk.", "matched": bool(repeated_query_tasks), "outcome": "bottleneck_flagged" if repeated_query_tasks else "not_flagged"},
        ],
    }
