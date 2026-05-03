from app.utils.scoring import clamp_score


class DummyMismatchModel:
    def detect_mismatches(self, request) -> list[dict]:
        mismatches = []
        doc_fields = request.extracted_document_fields
        legal_name = (request.enterprise.legal_name or "").strip().lower()
        gst_legal_name = str(doc_fields.get("gst_certificate", {}).get("legal_name", "")).strip().lower()
        if gst_legal_name and legal_name and gst_legal_name != legal_name:
            mismatches.append({"type": "gstin_legal_name_mismatch", "field": "legal_name"})
        land_district = doc_fields.get("land_document", {}).get("district")
        if land_district and request.project.district and str(land_district).strip().lower() != str(request.project.district).strip().lower():
            mismatches.append({"type": "district_mismatch", "field": "district"})
        return mismatches

    def score_consistency(self, mismatches: list[dict]) -> float:
        return clamp_score(1 - (len(mismatches) * 0.2))
