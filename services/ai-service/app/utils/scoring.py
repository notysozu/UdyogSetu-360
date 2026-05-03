def clamp_score(value: float) -> float:
    return round(max(0.0, min(1.0, float(value))), 2)


def average_score(scores: list[float]) -> float:
    if not scores:
        return 0.0
    return clamp_score(sum(scores) / len(scores))
