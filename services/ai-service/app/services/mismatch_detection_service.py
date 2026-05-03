from app.models.dummy_mismatch_model import DummyMismatchModel

model = DummyMismatchModel()


def detect_mismatches(request):
    warnings = []
    mismatches = []
    project = request.project
    enterprise = request.enterprise

    if project.workers_count and project.workers_count >= 10 and "labour" not in request.case_context.department_codes:
        mismatches.append({
            "mismatch_type": "approval_track_conflict",
            "field_name": "workers_count",
            "source_a": "project",
            "value_a": project.workers_count,
            "source_b": "case_context.department_codes",
            "value_b": request.case_context.department_codes,
            "severity": "medium",
            "reason": "Worker count implies labour registration review but labour track is missing.",
            "suggested_resolution": "Add labour review track or confirm exemption.",
            "confidence": 0.78,
        })
    if project.power_requirement_kw and project.power_requirement_kw > 0 and "power" not in request.case_context.department_codes:
        mismatches.append({
            "mismatch_type": "approval_track_conflict",
            "field_name": "power_requirement_kw",
            "source_a": "project",
            "value_a": project.power_requirement_kw,
            "source_b": "case_context.department_codes",
            "value_b": request.case_context.department_codes,
            "severity": "medium",
            "reason": "Power requirement suggests power approval but power track is missing.",
            "suggested_resolution": "Validate whether power department task should be added.",
            "confidence": 0.8,
        })
    if project.hazardous_process and "industrial_safety" not in request.case_context.department_codes:
        mismatches.append({
            "mismatch_type": "approval_track_conflict",
            "field_name": "hazardous_process",
            "source_a": "project",
            "value_a": True,
            "source_b": "case_context.department_codes",
            "value_b": request.case_context.department_codes,
            "severity": "high",
            "reason": "Hazardous process requires industrial safety review.",
            "suggested_resolution": "Escalate for industrial safety track confirmation.",
            "confidence": 0.87,
        })

    for match in model.detect_mismatches(request):
        if match["type"] == "gstin_legal_name_mismatch":
            mismatches.append({
                "mismatch_type": "gstin_legal_name_mismatch",
                "field_name": "legal_name",
                "source_a": "enterprise",
                "value_a": enterprise.legal_name,
                "source_b": "gst_certificate",
                "value_b": request.extracted_document_fields.get("gst_certificate", {}).get("legal_name"),
                "severity": "high",
                "reason": "Enterprise legal name differs from GST certificate extraction.",
                "suggested_resolution": "Review GST extraction and enterprise master details.",
                "confidence": 0.88,
            })
        if match["type"] == "district_mismatch":
            mismatches.append({
                "mismatch_type": "district_mismatch",
                "field_name": "district",
                "source_a": "project",
                "value_a": project.district,
                "source_b": "land_document",
                "value_b": request.extracted_document_fields.get("land_document", {}).get("district"),
                "severity": "medium",
                "reason": "Project district differs from land document district.",
                "suggested_resolution": "Validate location against land ownership records.",
                "confidence": 0.82,
            })

    score = model.score_consistency(mismatches)
    if not request.project.project_name:
        warnings.append("missing project name")
    return {
        "result": {
            "mismatch_status": "no_mismatch" if not mismatches else "mismatch_found",
            "mismatches": mismatches,
            "consistency_score": score,
            "suggested_resolutions": [item["suggested_resolution"] for item in mismatches] or ["No significant mismatches detected."],
        },
        "confidence": max(0.35, score),
        "warnings": warnings,
    }
