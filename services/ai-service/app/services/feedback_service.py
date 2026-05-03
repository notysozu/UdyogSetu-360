from __future__ import annotations

import json
import os
import re
import uuid
from datetime import datetime, timezone

from app.config import get_settings

MASK_PATTERNS = [
    (re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"), "[pan-redacted]"),
    (re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]\b"), "[gstin-redacted]"),
    (re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"), "[email-redacted]"),
    (re.compile(r"\b\d{10}\b"), "[phone-redacted]"),
]


def _mask(value: str | None) -> str | None:
    if value is None:
        return None
    masked = value
    for pattern, replacement in MASK_PATTERNS:
        masked = pattern.sub(replacement, masked)
    return masked


def store_feedback(payload: dict) -> dict:
    settings = get_settings()
    if not settings.advisory_feedback_enabled:
        return {"feedback_id": None, "stored": False, "message": "Feedback storage is disabled."}

    record = {
        "feedback_id": str(uuid.uuid4()),
        "endpoint_name": payload["endpoint_name"],
        "universal_case_id": payload.get("universal_case_id"),
        "actor_context": payload["actor_context"],
        "rating": payload["rating"],
        "feedback_text": _mask(payload.get("feedback_text")),
        "selected_action_code": payload.get("selected_action_code"),
        "final_human_action": _mask(payload.get("final_human_action")),
        "override_reason": _mask(payload.get("override_reason")),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "feedback")
    os.makedirs(directory, exist_ok=True)
    with open(os.path.join(directory, "feedback.jsonl"), "a", encoding="utf-8") as handle:
        handle.write(json.dumps(record) + "\n")
    return {"feedback_id": record["feedback_id"], "stored": True, "message": "Feedback captured for advisory improvement."}
