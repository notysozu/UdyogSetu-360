from app.models.dummy_routing_model import DummyRoutingModel
from app.rules.department_rules import DEPARTMENT_LABELS, REQUIRED_DOCUMENT_RULES, SLA_DEFAULTS
from app.rules.routing_rules import FIRE_HEIGHT_THRESHOLD_M, LABOUR_TRACK_THRESHOLD, POWER_TRACK_THRESHOLD_KW, WATER_USAGE_THRESHOLD_KLD

model = DummyRoutingModel()


def recommend_approval_path(request):
    project = request.project
    warnings = []
    missing_information = []
    tracks = []
    not_required = []

    def add_track(code: str, reason: str, confidence: float):
        tracks.append({
            "department_code": code,
            "department_name": DEPARTMENT_LABELS[code],
            "task_type": "scrutiny",
            "required_approval_type": code,
            "is_mandatory": True,
            "reason": reason,
            "confidence": round(confidence, 2),
            "required_documents": REQUIRED_DOCUMENT_RULES.get(code, []),
            "suggested_sla_days": SLA_DEFAULTS[code],
        })

    if (project.water_requirement_kld and project.water_requirement_kld > WATER_USAGE_THRESHOLD_KLD) or project.hazardous_process:
        add_track("pollution", "Water use / hazardous indicators suggest pollution review.", 0.86)
    else:
        not_required.append("pollution")
    if project.power_requirement_kw is not None and project.power_requirement_kw > POWER_TRACK_THRESHOLD_KW:
        add_track("power", "Power requirement indicates power approval path.", 0.9)
    else:
        not_required.append("power")
    if project.fire_noc_required or (project.building_height_m and project.building_height_m >= FIRE_HEIGHT_THRESHOLD_M) or project.flammable_storage:
        add_track("fire", "Fire risk indicators suggest fire department review.", 0.88)
    else:
        not_required.append("fire")
    if project.hazardous_process or project.boilers:
        add_track("industrial_safety", "Hazardous process / boilers require industrial safety scrutiny.", 0.9)
    else:
        not_required.append("industrial_safety")
    if project.workers_count and project.workers_count >= LABOUR_TRACK_THRESHOLD:
        add_track("labour", "Worker count indicates labour registration track.", 0.84)
    else:
        not_required.append("labour")

    if not project.sector:
        missing_information.append("project.sector")
        warnings.append("missing project sector")
    if project.power_requirement_kw is None:
        missing_information.append("project.power_requirement_kw")
    if project.workers_count is None:
        missing_information.append("project.workers_count")

    confidence = model.recommend_approval_path(request)
    if missing_information:
        confidence = max(0.45, confidence - 0.2)

    return {
        "result": {
            "recommended_tracks": tracks,
            "not_required_tracks": not_required,
            "missing_information": missing_information,
            "overall_routing_confidence": round(confidence, 2),
            "suggested_case_priority": "high" if len(tracks) >= 4 else "normal",
            "suggested_sla_days": min([track["suggested_sla_days"] for track in tracks], default=21),
        },
        "confidence": round(confidence, 2),
        "warnings": warnings,
    }
