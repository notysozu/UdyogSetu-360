from app.schemas import SubmissionPayload, DelayRiskRequest

REQUIRED_FIELDS = ["applicantName", "applicantEmail", "enterpriseName", "industry", "district"]


def validate_submission(payload: SubmissionPayload) -> dict:
    data = payload.model_dump()
    missing = [field for field in REQUIRED_FIELDS if not data.get(field)]
    warnings = []
    if payload.industry and "chemical" in payload.industry.lower():
        warnings.append("Chemical-related industry may need stricter pollution scrutiny.")
    if not payload.pollutionConsent:
        warnings.append("Pollution consent flag was not selected; verify if the business is exempt.")

    completeness = max(0.0, 1.0 - (len(missing) / len(REQUIRED_FIELDS)))
    return {
        "completenessScore": round(completeness, 2),
        "missingFields": missing,
        "warnings": warnings,
        "explanation": "Rule-backed starter validation completed. Replace with document-aware checks later."
    }


def recommend_approvals(payload: SubmissionPayload) -> dict:
    departments = {"KSPCB", "BESCOM"}
    explanation_parts = ["KSPCB and BESCOM are selected as baseline pilot approvals."]

    if payload.fireSafety == "yes":
        departments.add("FIRE")
        explanation_parts.append("Fire safety flag selected.")
    if payload.factoryLicence == "yes":
        departments.add("DISH")
        explanation_parts.append("Factory licence flag selected.")
    if payload.labourRegistration == "yes":
        departments.add("LABOUR")
        explanation_parts.append("Labour registration flag selected.")
    if payload.industry and any(word in payload.industry.lower() for word in ["chemical", "food", "manufacturing", "pharma"]):
        departments.add("KSPCB")
        departments.add("DISH")
        explanation_parts.append("Industry type indicates regulatory scrutiny.")

    confidence = 0.74 if len(departments) >= 3 else 0.62
    return {
        "recommendedDepartments": sorted(departments),
        "confidence": confidence,
        "explanation": " ".join(explanation_parts)
    }


def predict_delay(request: DelayRiskRequest) -> dict:
    score = 0.15
    reasons = []
    if request.daysOpen > 10:
        score += 0.25
        reasons.append("Case has been open for more than 10 days.")
    if request.pendingDepartments >= 3:
        score += 0.25
        reasons.append("Multiple departments are still pending.")
    if request.grievanceCount > 0:
        score += 0.2
        reasons.append("Open grievances indicate friction.")

    score = min(score, 0.95)
    if score >= 0.7:
        band = "high"
        action = "Escalate to nodal officer and trigger department reminder."
    elif score >= 0.4:
        band = "medium"
        action = "Send reminder and review stuck tasks."
    else:
        band = "low"
        action = "Continue normal monitoring."

    return {
        "riskScore": round(score, 2),
        "riskBand": band,
        "reasons": reasons or ["No major risk signals in starter model."],
        "suggestedNextAction": action
    }
