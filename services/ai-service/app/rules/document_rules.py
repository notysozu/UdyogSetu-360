DOCUMENT_LABELS = {
    "project_report": "Project report",
    "pollution_control_document": "Pollution control document",
    "land_document": "Land ownership / lease document",
    "layout_plan": "Approved layout plan",
    "fire_safety_plan": "Fire safety plan",
    "factory_safety_document": "Factory safety document",
    "labour_document": "Labour compliance document",
    "authorisation_letter": "Authorisation letter",
    "pan_card": "PAN card",
    "gst_certificate": "GST certificate",
    "udyam_certificate": "Udyam certificate",
}

DOCUMENT_TYPE_ALIASES = {
    "pan": "pan_card",
    "gst": "gst_certificate",
    "udyam": "udyam_certificate",
    "site_plan": "layout_plan",
}

REQUIRED_DOCUMENTS_BY_TRACK = {
    "pollution": ["project_report", "pollution_control_document"],
    "power": ["project_report", "land_document"],
    "fire": ["layout_plan", "fire_safety_plan"],
    "industrial_safety": ["factory_safety_document", "layout_plan"],
    "labour": ["labour_document"],
}

OPTIONAL_DOCUMENTS_BY_TRACK = {
    "pollution": ["pan_card", "gst_certificate"],
    "power": ["pan_card"],
    "fire": ["authorisation_letter"],
    "industrial_safety": ["udyam_certificate"],
    "labour": ["gst_certificate"],
}

DOCUMENT_VALIDATION_RULES = {
    "expired": "Document status expired requires updated version.",
    "rejected": "Previously rejected documents should be refreshed before resubmission.",
}
