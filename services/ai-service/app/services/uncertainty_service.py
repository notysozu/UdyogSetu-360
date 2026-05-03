from app.config import get_settings


def build_uncertainty(confidence: float, warnings: list[str] | None = None, conflicting_signals: bool = False, high_risk: bool = False):
    settings = get_settings()
    reasons = warnings or []
    if conflicting_signals:
        return {
            "isUncertain": True,
            "reason": "contradictory_signals",
            "requiresHumanReview": True,
        }
    if confidence >= settings.confidence_threshold:
        return {
            "isUncertain": False,
            "reason": "high_risk" if high_risk else None,
            "requiresHumanReview": bool(high_risk),
        }
    if confidence >= settings.uncertain_threshold:
        return {
            "isUncertain": True,
            "reason": reasons[0] if reasons else "medium_confidence",
            "requiresHumanReview": True,
        }
    return {
        "isUncertain": True,
        "reason": reasons[0] if reasons else "low_confidence",
        "requiresHumanReview": True,
    }
