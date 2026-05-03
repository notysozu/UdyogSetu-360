def build_explainability(summary: str, signals: list[dict] | None = None, rules_applied: list[dict] | None = None, warnings: list[str] | None = None):
    return {
        "summary": summary,
        "signals": signals or [],
        "rulesApplied": rules_applied or [],
        "warnings": warnings or ["Advisory only. Final decision remains with Node domain services and human officers."],
    }
