const { getAiConfig } = require("../config/ai.config");

function advisoryMeta(context = {}) {
  return {
    correlationId: context.correlationId || null,
    source: "node_fallback",
    advisoryOnly: true
  };
}

function fallbackDocumentCompleteness(payload, context = {}) {
  const tracks = [];
  if ((payload?.project?.water_requirement_kld || 0) > 10 || payload?.project?.hazardous_process) tracks.push("pollution");
  if ((payload?.project?.power_requirement_kw || 0) > 0) tracks.push("power");
  if (payload?.project?.fire_noc_required) tracks.push("fire");
  if (payload?.project?.hazardous_process || payload?.project?.boilers) tracks.push("industrial_safety");
  if ((payload?.project?.workers_count || 0) >= 10) tracks.push("labour");
  const provided = new Set((payload?.provided_documents || []).map((doc) => String(doc.document_type || "").toLowerCase()));
  const missing = [];
  if (tracks.includes("pollution") && !provided.has("pollution_control_document")) missing.push("pollution_control_document");
  if (tracks.includes("power") && !provided.has("land_document")) missing.push("land_document");
  if (tracks.includes("fire") && !provided.has("layout_plan")) missing.push("layout_plan");
  return {
    success: true,
    result: {
      completeness_status: missing.length ? "incomplete" : "needs_review",
      missing_documents: missing.map((item) => ({ document_type: item, label: item, required_for_department: "derived", reason: "Fallback rules detected required document gap.", severity: "high" })),
      optional_documents: [],
      invalid_documents: [],
      duplicate_documents: [],
      required_by_department: {},
      suggested_next_actions: ["Human review required because AI service fallback handled the request."]
    },
    confidence: 0.58,
    uncertainty: { isUncertain: true, reason: "ai_service_unavailable", requiresHumanReview: true },
    explainability: {
      summary: "Fallback document completeness used deterministic Node rules.",
      signals: [],
      rulesApplied: [],
      warnings: ["AI service unavailable. Final decision must remain with Node validation and officers."]
    },
    meta: advisoryMeta(context)
  };
}

function fallbackNormaliseFields(payload, context = {}) {
  const raw = { ...(payload?.raw_fields || {}) };
  if (typeof raw.pan === "string") raw.pan = raw.pan.toUpperCase();
  if (typeof raw.gstin === "string") raw.gstin = raw.gstin.toUpperCase();
  return {
    success: true,
    result: {
      normalised_fields: raw,
      changed_fields: [],
      unresolved_fields: [],
      validation_warnings: ["Fallback normalisation used limited deterministic transforms."]
    },
    confidence: 0.6,
    uncertainty: { isUncertain: true, reason: "ai_service_unavailable", requiresHumanReview: true },
    explainability: { summary: "Fallback normalisation was applied.", signals: [], rulesApplied: [], warnings: ["Advisory only."] },
    meta: advisoryMeta(context)
  };
}

function fallbackMismatchDetection(_payload, context = {}) {
  return {
    success: true,
    result: {
      mismatch_status: "needs_review",
      mismatches: [],
      consistency_score: 0.55,
      suggested_resolutions: ["Run manual review because AI mismatch detection was unavailable."]
    },
    confidence: 0.45,
    uncertainty: { isUncertain: true, reason: "ai_service_unavailable", requiresHumanReview: true },
    explainability: { summary: "Fallback mismatch detection returned conservative output.", signals: [], rulesApplied: [], warnings: ["Advisory only."] },
    meta: advisoryMeta(context)
  };
}

function fallbackApprovalPath(payload, context = {}) {
  const recommended = [];
  if ((payload?.project?.water_requirement_kld || 0) > 10 || payload?.project?.hazardous_process) recommended.push("pollution");
  if ((payload?.project?.power_requirement_kw || 0) > 0) recommended.push("power");
  if (payload?.project?.fire_noc_required) recommended.push("fire");
  if (payload?.project?.hazardous_process || payload?.project?.boilers) recommended.push("industrial_safety");
  if ((payload?.project?.workers_count || 0) >= 10) recommended.push("labour");
  return {
    success: true,
    result: {
      recommended_tracks: [...new Set(recommended)].map((department_code) => ({
        department_code,
        department_name: department_code,
        task_type: "scrutiny",
        required_approval_type: department_code,
        is_mandatory: true,
        reason: "Fallback deterministic routing rule matched.",
        confidence: 0.62,
        required_documents: [],
        suggested_sla_days: 21
      })),
      not_required_tracks: [],
      missing_information: [],
      overall_routing_confidence: 0.62,
      suggested_case_priority: recommended.length >= 4 ? "high" : "normal",
      suggested_sla_days: 21
    },
    confidence: 0.62,
    uncertainty: { isUncertain: true, reason: "ai_service_unavailable", requiresHumanReview: true },
    explainability: { summary: "Fallback approval path used five-department deterministic rules.", signals: [], rulesApplied: [], warnings: ["Compare this with Node rule engine before any routing action."] },
    meta: advisoryMeta(context)
  };
}

function fallbackSmartRouting(payload, context = {}) {
  const riskFlags = [];
  if (payload?.document_summary?.missingDocuments?.length) riskFlags.push("missing_documents");
  if (payload?.sla_summary?.hasWarnings) riskFlags.push("likely_sla_delay");
  return {
    success: true,
    result: {
      suggested_routes: [],
      suggested_priority: riskFlags.length ? "high" : "normal",
      next_best_actions: [{
        action_code: "manual_review",
        label: "Manual review",
        owner_role: "department_officer",
        reason: "Fallback mode activated for smart routing.",
        due_hint: "Within SLA warning window"
      }],
      risk_flags: riskFlags,
      delay_risk_score: riskFlags.length ? 0.65 : 0.45,
      officer_notes_suggestion: "AI unavailable, so this advisory was produced from deterministic fallback logic.",
      confidence: 0.55
    },
    confidence: 0.55,
    uncertainty: { isUncertain: true, reason: "ai_service_unavailable", requiresHumanReview: true },
    explainability: { summary: "Fallback smart routing returned conservative recommendations.", signals: [], rulesApplied: [], warnings: ["Advisory only."] },
    meta: advisoryMeta(context)
  };
}

module.exports = {
  fallbackDocumentCompleteness,
  fallbackNormaliseFields,
  fallbackMismatchDetection,
  fallbackApprovalPath,
  fallbackSmartRouting,
  advisoryMeta,
  getAiConfig
};
