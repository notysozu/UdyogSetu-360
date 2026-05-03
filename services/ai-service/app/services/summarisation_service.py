from __future__ import annotations

import re

from app.config import get_settings
from app.models.dummy_summariser import DummySummariser


SECRET_PATTERNS = [
    re.compile(r"(token|secret|password|signed_url|object_key)\s*[:=]\s*\S+", re.IGNORECASE),
    re.compile(r"\b\d{10}\b"),
]


def _scrub(text: str) -> str:
    value = text or ""
    for pattern in SECRET_PATTERNS:
        value = pattern.sub("[redacted]", value)
    return value


def build_case_summary(payload: dict) -> dict:
    settings = get_settings()
    max_length = min(payload.get("max_length") or settings.advisory_safe_summary_max_chars, settings.advisory_safe_summary_max_chars)
    summary_type = payload["summary_type"]
    tasks = payload.get("tasks", [])
    grievances = payload.get("grievances", [])
    documents = payload.get("documents", [])
    case_snapshot = payload["case_snapshot"]

    parts = [
        f"Case {case_snapshot.get('universal_case_id') or 'not available'} is currently {case_snapshot['status']} at stage {case_snapshot['current_stage']}.",
        f"The case involves {len(tasks)} task(s), {len(documents)} document signal(s) and {len(grievances)} grievance signal(s).",
        "This summary is advisory and generated from available case data.",
    ]
    if case_snapshot.get("last_activity_at"):
        parts.append(f"Last activity is recorded at {case_snapshot['last_activity_at'].isoformat()}.")
    if summary_type != "investor":
        open_tasks = [task for task in tasks if task.get("status") not in {"approved", "completed", "closed", "certificate_issued"}]
        if open_tasks:
            parts.append(f"{len(open_tasks)} task(s) remain open and need follow-up.")
    if summary_type == "investor":
        parts.append("Internal officer notes are excluded from this summary.")

    summary = DummySummariser().summarise([_scrub(item) for item in parts], max_length)
    bullet_points = [
        f"Current stage: {case_snapshot['current_stage']}",
        f"Open tasks: {sum(1 for task in tasks if task.get('status') not in {'approved', 'completed', 'closed', 'certificate_issued'})}",
        f"Documents with issues: {sum(1 for doc in documents if doc.get('status') in {'rejected', 'expired', 'missing'})}",
    ]
    omitted = ["secrets", "tokens", "signed URLs", "private internal comments", "full PII"]
    if summary_type == "investor":
        omitted.append("internal officer notes")

    return {
        "result": {
            "summary": summary,
            "bullet_points": bullet_points,
            "open_actions": [task.get("task_type") for task in tasks if task.get("status") not in {"approved", "completed", "closed"}][:5],
            "risks": ["not available in the supplied data" if not tasks else "pending task follow-up may affect timelines"],
            "omitted_sensitive_fields": omitted,
            "source_event_count": len(payload.get("timeline_events", [])) + len(payload.get("audit_events", [])),
            "generated_for_role": payload["actor_context"].get("role"),
        },
        "confidence": 0.78,
        "warnings": [] if tasks or documents else ["limited_case_evidence"],
        "signals": [
            {"name": "summary_type", "value": summary_type, "weight": 0.1, "impact": "neutral", "explanation": "Summary visibility and detail are shaped by the requested audience."},
            {"name": "task_count", "value": len(tasks), "weight": 0.2, "impact": "neutral", "explanation": "More supplied task data yields a stronger structured summary."},
        ],
        "rules": [
            {"ruleCode": "safe_summary_no_secrets", "description": "Do not include secrets, tokens, object keys or private comments.", "matched": True, "outcome": "redacted"},
            {"ruleCode": "investor_internal_note_exclusion", "description": "Investor summaries must exclude internal officer notes.", "matched": summary_type == "investor", "outcome": "excluded" if summary_type == "investor" else "not_applicable"},
        ],
    }
