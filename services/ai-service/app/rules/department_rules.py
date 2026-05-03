DEPARTMENT_LABELS = {
    "pollution": "Pollution Control Board",
    "power": "Power Distribution Utility",
    "fire": "Fire and Emergency Services",
    "industrial_safety": "Industrial Safety and Factories",
    "labour": "Labour Department",
}

SLA_DEFAULTS = {
    "pollution": 30,
    "power": 21,
    "fire": 15,
    "industrial_safety": 30,
    "labour": 15,
}

APPROVAL_TRACK_RULES = {
    "pollution": "Pollution review applies when water use, emissions, effluent, or hazardous waste indicators are present.",
    "power": "Power review applies when connected load or transformer demand exists.",
    "fire": "Fire review applies for taller buildings, fire-noc flag, or flammable storage.",
    "industrial_safety": "Industrial safety applies for machinery, boilers, factories, or hazardous process.",
    "labour": "Labour review applies when worker count or labour registration threshold is met.",
}

REQUIRED_DOCUMENT_RULES = {
    "pollution": ["project_report", "pollution_control_document"],
    "power": ["project_report", "land_document"],
    "fire": ["layout_plan", "fire_safety_plan"],
    "industrial_safety": ["factory_safety_document", "layout_plan"],
    "labour": ["labour_document"],
}

STATUS_NORMALISATION_RULES = {"under scrutiny": "under_scrutiny", "query raised": "query_raised"}
