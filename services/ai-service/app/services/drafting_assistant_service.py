from __future__ import annotations

from app.config import get_settings
from app.models.dummy_drafting_model import DummyDraftingModel


def build_draft_assistance(payload: dict) -> dict:
    settings = get_settings()
    max_length = min(payload.get("max_length") or settings.advisory_draft_max_chars, settings.advisory_draft_max_chars)
    draft = DummyDraftingModel().build_draft(payload["draft_type"], payload.get("issue_summary"), payload.get("tone"))
    draft = draft[: max_length - 1].rstrip() + ("…" if len(draft) > max_length else "")

    warnings = ["Draft is advisory only and must be reviewed by an authorised human officer."]
    if payload["draft_type"] == "rejection_reason" and not payload.get("issue_summary"):
        warnings.append("Specific reason or supporting evidence is missing from the supplied data.")

    return {
        "result": {
            "suggested_draft": draft,
            "alternate_drafts": [],
            "checklist_of_required_review": [
                "Verify factual accuracy against the case record.",
                "Confirm policy or legal references manually before sending.",
                "Ensure tone and commitments match department practice.",
            ],
            "safety_warnings": warnings,
            "confidence": 0.74,
            "requires_human_review": True,
        },
        "confidence": 0.74,
        "warnings": warnings,
        "signals": [
            {"name": "draft_type", "value": payload["draft_type"], "weight": 0.2, "impact": "neutral", "explanation": "Draft structure depends on the operational use case."},
            {"name": "issue_summary_present", "value": bool(payload.get("issue_summary")), "weight": 0.2, "impact": "positive" if payload.get("issue_summary") else "negative", "explanation": "Specific issue context improves drafting quality."},
        ],
        "rules": [
            {"ruleCode": "no_final_legal_decision", "description": "Drafts must not become automatic final legal decisions.", "matched": True, "outcome": "guardrail_applied"},
            {"ruleCode": "british_english_default", "description": "Use formal British English unless otherwise directed.", "matched": True, "outcome": "applied"},
        ],
    }
