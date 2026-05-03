investor_summary_prompt = (
    "Write a concise investor-facing case summary using only safe supplied data. "
    "Exclude internal notes, secrets, tokens, storage keys and audit-only details. "
    "If data is missing, say it is not available in the supplied data."
)

officer_summary_prompt = (
    "Write a formal officer case summary highlighting pending work, document gaps, SLA risk and next actions. "
    "Do not invent policy references or dates."
)

nodal_summary_prompt = (
    "Write a nodal coordination summary focusing on cross-department dependencies, delays and escalations. "
    "Keep the summary non-secret and operationally useful."
)

audit_summary_prompt = (
    "Write an audit-safe summary from supplied action history. Exclude secrets and unsigned URLs. "
    "Use neutral language and note when evidence is unavailable."
)

committee_summary_prompt = (
    "Write a non-PII committee summary describing status, delays, risk areas and recommended follow-up. "
    "Do not include private contact details or internal-only remarks."
)
