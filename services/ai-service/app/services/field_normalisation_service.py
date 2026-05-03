from app.rules.normalisation_rules import (
    BOOLEAN_ALIASES,
    DEPARTMENT_ALIASES,
    DISTRICT_ALIASES,
    ORGANISATION_TYPE_ALIASES,
    POLLUTION_CATEGORY_ALIASES,
)
from app.utils.scoring import clamp_score
from app.utils.text import normalise_whitespace


def _parse_numeric(value):
    if isinstance(value, str):
        stripped = value.replace(",", "").strip()
        try:
            if "." in stripped:
                return float(stripped)
            return int(stripped)
        except ValueError:
            return value
    return value


def normalise_fields(request):
    raw = dict(request.raw_fields or {})
    changed_fields = []
    unresolved_fields = []
    warnings = []
    normalized = {}

    for field_name, value in raw.items():
        original = value
        normalized_value = value
        method = "identity"
        confidence = 0.95

        if isinstance(value, str):
            normalized_value = normalise_whitespace(value)

        if field_name in {"pan", "gstin", "udyam_number"} and isinstance(normalized_value, str):
            normalized_value = normalized_value.upper()
            method = "uppercase_identifier"
        elif field_name == "district" and isinstance(normalized_value, str):
            normalized_value = DISTRICT_ALIASES.get(normalized_value.lower(), normalized_value.title())
            method = "district_alias_lookup"
            confidence = 0.8
        elif field_name == "organisation_type" and isinstance(normalized_value, str):
            normalized_value = ORGANISATION_TYPE_ALIASES.get(normalized_value.lower(), normalized_value.lower().replace(" ", "_"))
            method = "organisation_alias_lookup"
        elif field_name in {"department_code", "department"} and isinstance(normalized_value, str):
            normalized_value = DEPARTMENT_ALIASES.get(normalized_value.lower(), normalized_value.lower())
            method = "department_alias_lookup"
        elif field_name in {"pollution_category"} and isinstance(normalized_value, str):
            normalized_value = POLLUTION_CATEGORY_ALIASES.get(normalized_value.lower(), normalized_value.lower())
            method = "pollution_alias_lookup"
        elif isinstance(normalized_value, str) and normalized_value.lower() in BOOLEAN_ALIASES:
            normalized_value = BOOLEAN_ALIASES[normalized_value.lower()]
            method = "boolean_alias_lookup"
        elif field_name in {"workers_count", "employment_expected", "power_requirement_kw", "land_area_sq_m"}:
            parsed = _parse_numeric(normalized_value)
            if parsed != normalized_value:
                normalized_value = parsed
                method = "numeric_parse"

        if field_name == "phone":
            warnings.append("Phone number standardisation is placeholder only.")

        if field_name == "district" and isinstance(original, str) and original.strip().lower() not in DISTRICT_ALIASES and original.strip() != normalized_value:
            unresolved_fields.append({
                "field_name": field_name,
                "value": original,
                "reason": "ambiguous_district_match",
                "suggested_action": "Verify district against master list.",
            })
            confidence = 0.6

        normalized[field_name] = normalized_value
        if normalized_value != original:
            changed_fields.append({
                "field_name": field_name,
                "original_value": original,
                "normalised_value": normalized_value,
                "method": method,
                "confidence": clamp_score(confidence),
            })

    return {
        "normalised_fields": normalized,
        "changed_fields": changed_fields,
        "unresolved_fields": unresolved_fields,
        "validation_warnings": warnings,
    }
