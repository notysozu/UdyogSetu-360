from app.models.dummy_routing_model import DummyRoutingModel

model = DummyRoutingModel()


def get_smart_routing_suggestions(request):
    warnings = []
    risk_flags = []
    next_actions = []
    suggested_routes = []
    delay_risk_score = model.calculate_delay_risk(request)

    if request.document_summary.get("missingDocuments"):
        risk_flags.append("missing_documents")
        next_actions.append({
            "action_code": "collect_documents",
            "label": "Collect missing documents",
            "owner_role": "investor",
            "department_code": None,
            "reason": "Document summary indicates missing required files.",
            "due_hint": "Within 3 days",
        })
    if request.sla_summary.get("hasWarnings") or delay_risk_score >= 0.65:
        risk_flags.append("likely_sla_delay")
    if request.sla_summary.get("inspectionRequired"):
        risk_flags.append("inspection_required")
        suggested_routes.append({
            "department_code": request.case_context.department_codes[0] if request.case_context.department_codes else "fire",
            "action": "prioritise_inspection",
            "reason": "Inspection requirement is unresolved.",
            "urgency": "high",
            "confidence": 0.81,
        })
    if len(request.case_context.department_codes) >= 3:
        risk_flags.append("multi_department_dependency")
    if request.historical_signals.get("repeatedQueries"):
        risk_flags.append("repeated_query_risk")
    if request.project.hazardous_process or request.project.boilers:
        risk_flags.append("high_complexity_project")
    if delay_risk_score < 0.5:
        warnings.append("low operational risk from starter model")

    for action_code in model.suggest_next_best_actions(request):
        if action_code == "prepare_fire_track":
            next_actions.append({
                "action_code": action_code,
                "label": "Prepare fire track briefing",
                "owner_role": "department_officer",
                "department_code": "fire",
                "reason": "Fire NOC indicators are present.",
                "due_hint": "Before next scrutiny step",
            })

    confidence = max(0.4, 0.9 - (0.1 * len(warnings)))
    if confidence < 0.7:
        risk_flags.append("low_confidence_routing")

    return {
        "result": {
            "suggested_routes": suggested_routes,
            "suggested_priority": "high" if delay_risk_score >= 0.65 else "normal",
            "next_best_actions": next_actions or [{
                "action_code": "continue_scrutiny",
                "label": "Continue scrutiny",
                "owner_role": "department_officer",
                "department_code": None,
                "reason": "No blocking signal detected.",
                "due_hint": "Standard SLA",
            }],
            "risk_flags": risk_flags,
            "delay_risk_score": delay_risk_score,
            "officer_notes_suggestion": "Advisory only. Compare routing suggestion with deterministic Node workflow rules.",
            "confidence": round(confidence, 2),
        },
        "confidence": round(confidence, 2),
        "warnings": warnings,
    }
