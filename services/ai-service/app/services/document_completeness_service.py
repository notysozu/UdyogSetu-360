from app.models.dummy_document_model import DummyDocumentModel
from app.rules.department_rules import REQUIRED_DOCUMENT_RULES
from app.rules.document_rules import DOCUMENT_LABELS, DOCUMENT_TYPE_ALIASES, OPTIONAL_DOCUMENTS_BY_TRACK

document_model = DummyDocumentModel()


def infer_tracks(request) -> list[str]:
    project = request.project
    tracks = set(request.declared_approval_tracks or [])
    if project.water_requirement_kld and project.water_requirement_kld > 10:
        tracks.add("pollution")
    if project.power_requirement_kw and project.power_requirement_kw > 0:
        tracks.add("power")
    if project.fire_noc_required or (project.building_height_m and project.building_height_m >= 15):
        tracks.add("fire")
    if project.hazardous_process or project.boilers:
        tracks.add("industrial_safety")
    if project.workers_count and project.workers_count >= 10:
        tracks.add("labour")
    return sorted(tracks)


def check_document_completeness(request):
    tracks = infer_tracks(request)
    provided = []
    duplicates = []
    seen = set()
    invalid = []
    warnings = []
    missing = []
    required_by_department = {}
    optional_documents = []

    for doc in request.provided_documents:
        doc_type = DOCUMENT_TYPE_ALIASES.get(doc.document_type.lower(), doc.document_type.lower())
        if doc_type in seen:
            duplicates.append(doc_type)
        seen.add(doc_type)
        provided.append(doc_type)
        if doc.status in {"rejected", "expired"}:
            invalid.append(doc_type)

    for track in tracks:
        required = REQUIRED_DOCUMENT_RULES.get(track, [])
        required_by_department[track] = required
        optional_documents.extend(OPTIONAL_DOCUMENTS_BY_TRACK.get(track, []))
        for doc_type in required:
            if doc_type not in provided:
                missing.append({
                    "document_type": doc_type,
                    "label": DOCUMENT_LABELS.get(doc_type, doc_type.replace("_", " ").title()),
                    "required_for_department": track,
                    "reason": f"Required for {track} track.",
                    "severity": "high",
                })

    if not request.project.sector:
        warnings.append("missing project sector")
    if not tracks:
        warnings.append("missing department tracks")
    if len(request.provided_documents) < 2:
        warnings.append("too few documents provided")
    if any(doc.document_type.lower() not in DOCUMENT_TYPE_ALIASES and doc.document_type.lower() not in DOCUMENT_LABELS for doc in request.provided_documents):
        warnings.append("unknown document types")

    confidence = document_model.check_completeness(request, [doc for docs in required_by_department.values() for doc in docs])
    if warnings:
        confidence = max(0.35, confidence - 0.15)
    status = "complete" if not missing and not invalid else "incomplete"
    if not missing and warnings and confidence < 0.7:
        status = "needs_review"

    actions = []
    if missing:
        actions.append("Collect missing required documents before workflow escalation.")
    if invalid:
        actions.append("Replace expired or rejected document references with updated metadata.")
    if not actions:
        actions.append("Proceed to Node validation and officer scrutiny.")

    return {
        "result": {
            "completeness_status": status,
            "missing_documents": missing,
            "optional_documents": sorted(set(optional_documents)),
            "invalid_documents": sorted(set(invalid)),
            "duplicate_documents": sorted(set(duplicates)),
            "required_by_department": required_by_department,
            "suggested_next_actions": actions,
        },
        "confidence": round(confidence, 2),
        "warnings": warnings,
        "tracks": tracks,
    }
