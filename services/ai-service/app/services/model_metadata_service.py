from __future__ import annotations

from app.config import get_settings


def _metadata(name: str) -> dict:
    settings = get_settings()
    return {
        "modelName": name,
        "modelVersion": "0.1.0",
        "modelMode": settings.advisory_model_mode,
        "trainedAt": None,
        "trainingDataVersion": None,
        "featureSetVersion": "0.1.0",
        "evaluationMetrics": {"note": "Deterministic starter model. No production training metrics yet."},
        "limitations": [
            "Rule-based starter output only.",
            "Requires human review for medium and low confidence cases.",
            "Cannot directly mutate case or task state.",
        ],
        "intendedUse": "Operational advisory support for Node and authorised officers.",
        "notIntendedFor": [
            "Automatic approvals or rejections",
            "Certificate issuance",
            "State mutation",
            "Legal decision-making without human review",
        ],
    }


def list_models() -> list[dict]:
    return [
        _metadata("dummy_sla_risk_model"),
        _metadata("dummy_bottleneck_model"),
        _metadata("dummy_next_action_model"),
        _metadata("dummy_summariser"),
        _metadata("dummy_drafting_model"),
    ]


def get_model(model_name: str) -> dict | None:
    for item in list_models():
        if item["modelName"] == model_name:
            return item
    return None
