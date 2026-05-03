const { createLogger } = require("../../../../packages/shared/src/logger");

const logger = createLogger("case-service");

function advisoryMeta(context = {}) {
  return {
    correlationId: context.correlationId || null,
    source: "node_advisory_fallback",
    advisoryOnly: true
  };
}

function advisoryEnvelope(result, confidence, summary, context = {}) {
  return {
    success: true,
    result,
    confidence,
    uncertainty: {
      isUncertain: true,
      reason: "ai_advisory_service_unavailable",
      requiresHumanReview: true
    },
    explainability: {
      summary,
      signals: [],
      rulesApplied: [],
      warnings: ["Advisory service unavailable. Fallback output is conservative and must not be auto-applied."]
    },
    advisory: {
      advisoryOnly: true,
      mustNotAutoApply: true,
      finalDecisionOwner: "node_or_human_officer"
    },
    model: {
      modelName: "node_advisory_fallback",
      modelVersion: "0.1.0",
      modelMode: "deterministic_fallback",
      trainedAt: null
    },
    meta: advisoryMeta(context)
  };
}

function fallbackSlaRisk(payload, context = {}) {
  const overdue = (payload?.tasks || []).some((task) => task?.due_at && new Date(task.due_at).getTime() < Date.now());
  return advisoryEnvelope(
    {
      overall_risk_level: overdue ? "high" : "medium",
      overall_risk_score: overdue ? 82 : 55,
      at_risk_entities: [],
      risk_drivers: [],
      recommended_interventions: [{
        action_code: "manual_sla_review",
        label: "Manual SLA review",
        owner_role: "department_supervisor",
        urgency: overdue ? "high" : "medium",
        reason: "Fallback rules detected possible SLA attention need.",
        must_be_human_approved: true
      }],
      monitoring_notes: ["Fallback SLA risk used deterministic rules only."]
    },
    overdue ? 0.64 : 0.58,
    "Fallback SLA risk estimated from due dates and basic task state only.",
    context
  );
}

function fallbackBottlenecks(payload, context = {}) {
  const backlog = (payload?.queue_signals || []).reduce((sum, item) => sum + Number(item?.backlog_count || 0), 0);
  return advisoryEnvelope(
    {
      bottlenecks: backlog > 0 ? [{
        bottleneck_type: "department_queue_backlog",
        severity: backlog > 20 ? "high" : "medium",
        bottleneck_score: Math.min(90, 45 + backlog),
        evidence: [`Queue backlog count is ${backlog}.`],
        likely_cause: "Operational queue backlog detected by fallback logic.",
        recommended_action: "Review queue consumers and prioritise stale items.",
        confidence: 0.6
      }] : [],
      bottleneck_summary: backlog > 0 ? "Fallback logic detected queue pressure." : "No strong bottleneck detected by fallback logic.",
      suggested_remediation: backlog > 0 ? ["Review queue processing capacity."] : [],
      watchlist: backlog > 0 ? ["department_queue_backlog"] : []
    },
    backlog > 0 ? 0.61 : 0.56,
    "Fallback bottleneck detection used basic queue and activity rules.",
    context
  );
}

function fallbackNextBestActions(payload, context = {}) {
  const role = payload?.actor_context?.role || "unknown";
  const actions = [];
  if (role === "investor") {
    actions.push({
      action_code: "respond_to_query",
      label: "Respond to pending query",
      description: "Review pending clarifications and provide the requested response.",
      owner_role: "investor",
      target_entity_type: "case",
      target_entity_id: payload?.case_snapshot?.universal_case_id || null,
      priority: "high",
      reason: "Investor response often unblocks scrutiny.",
      expected_outcome: "Case review can continue.",
      confidence: 0.62,
      must_be_human_approved: true
    });
  } else {
    actions.push({
      action_code: "manual_review",
      label: "Manual review",
      description: "Review the supplied case and task signals manually.",
      owner_role: role,
      target_entity_type: "case",
      target_entity_id: payload?.case_snapshot?.universal_case_id || null,
      priority: "medium",
      reason: "Fallback mode avoids overconfident automation.",
      expected_outcome: "A responsible human can decide the next step.",
      confidence: 0.58,
      must_be_human_approved: true
    });
  }
  return advisoryEnvelope(
    {
      actions,
      priority_ordering_reason: "Fallback actions are deliberately conservative.",
      blocked_actions: [],
      human_review_required: true
    },
    0.58,
    "Fallback next-best actions were constrained to safe deterministic hints.",
    context
  );
}

function fallbackCaseSummary(payload, context = {}) {
  const caseId = payload?.case_snapshot?.universal_case_id || "not available";
  return advisoryEnvelope(
    {
      summary: `Case ${caseId} summary is limited because the advisory service was unavailable. Please review the latest supplied case, task and document data directly.`,
      bullet_points: ["Summary produced by fallback mode.", "Internal secrets and private notes are not included."],
      open_actions: [],
      risks: ["Limited evidence available in fallback mode."],
      omitted_sensitive_fields: ["secrets", "tokens", "signed URLs", "private internal comments", "full PII"],
      source_event_count: 0,
      generated_for_role: payload?.actor_context?.role || null
    },
    0.52,
    "Fallback case summary used a minimal safe template.",
    context
  );
}

function fallbackDraftAssistance(payload, context = {}) {
  const issue = payload?.issue_summary || "the matter identified in the supplied case data";
  const draft = payload?.draft_type === "query_to_investor"
    ? `Dear Applicant,\n\nPlease review and clarify ${issue}. Kindly submit the relevant information so that processing may continue.\n\nRegards,\nDepartment Officer`
    : `Please review the following note regarding ${issue}. This draft is advisory and requires officer review before use.`;
  return advisoryEnvelope(
    {
      suggested_draft: draft,
      alternate_drafts: [],
      checklist_of_required_review: [
        "Verify facts against the source record.",
        "Confirm any legal or policy references manually."
      ],
      safety_warnings: ["Fallback draft is generic and must be reviewed by a human officer."],
      confidence: 0.57,
      requires_human_review: true
    },
    0.57,
    "Fallback drafting assistance produced a safe placeholder draft.",
    context
  );
}

function logFallbackWarning(path, context = {}, reason = "service unavailable") {
  logger.warn("ai_advisory_fallback_used", {
    correlationId: context.correlationId,
    path,
    reason
  });
}

module.exports = {
  fallbackSlaRisk,
  fallbackBottlenecks,
  fallbackNextBestActions,
  fallbackCaseSummary,
  fallbackDraftAssistance,
  advisoryMeta,
  logFallbackWarning
};
