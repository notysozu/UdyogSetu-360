from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone


def store_override(payload: dict) -> dict:
    if not payload.get("override_reason"):
        raise ValueError("override_reason is required.")
    record = {
        "override_id": str(uuid.uuid4()),
        "endpoint_name": payload["endpoint_name"],
        "universal_case_id": payload.get("universal_case_id"),
        "actor_context": payload["actor_context"],
        "override_type": payload["override_type"],
        "override_reason": payload["override_reason"][:500],
        "human_decision": payload["human_decision"][:500],
        "final_action_taken": (payload.get("final_action_taken") or "")[:500],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    directory = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "feedback")
    os.makedirs(directory, exist_ok=True)
    with open(os.path.join(directory, "human-overrides.jsonl"), "a", encoding="utf-8") as handle:
        handle.write(json.dumps(record) + "\n")
    return {"override_id": record["override_id"], "logged": True, "message": "Human override captured for advisory learning."}
