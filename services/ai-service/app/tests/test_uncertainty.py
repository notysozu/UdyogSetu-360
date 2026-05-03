from app.services.uncertainty_service import build_uncertainty


def test_confidence_below_threshold_sets_human_review():
    result = build_uncertainty(0.4, ["low confidence"])
    assert result["requiresHumanReview"] is True


def test_high_confidence_can_skip_human_review():
    result = build_uncertainty(0.9, [])
    assert result["isUncertain"] is False


def test_contradictory_signals_require_review():
    result = build_uncertainty(0.85, [], conflicting_signals=True)
    assert result["requiresHumanReview"] is True
