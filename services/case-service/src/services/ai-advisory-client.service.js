const { createLogger } = require("../../../../packages/shared/src/logger");
const { getAiAdvisoryConfig } = require("../config/ai.config");
const fallback = require("./ai-advisory-fallback.service");

const logger = createLogger("case-service");

async function postWithRetry(path, payload, context = {}) {
  const config = getAiAdvisoryConfig();
  if (!config.enabled) {
    return { ok: false, fallbackReason: "disabled" };
  }
  const url = `${config.baseUrl}${path}`;
  for (let attempt = 0; attempt <= config.retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const headers = {
        "content-type": "application/json",
        "x-correlation-id": context.correlationId || ""
      };
      if (config.requireAuth && config.apiKey) headers["x-ai-advisory-key"] = config.apiKey;
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const body = await response.text();
        logger.warn("ai_advisory_http_error", {
          correlationId: context.correlationId,
          path,
          statusCode: response.status,
          attempt,
          body
        });
        if (response.status >= 500 && attempt < config.retries) continue;
        return { ok: false, statusCode: response.status, message: body || "AI advisory request failed." };
      }
      return { ok: true, data: await response.json() };
    } catch (error) {
      clearTimeout(timeout);
      logger.warn("ai_advisory_unavailable", {
        correlationId: context.correlationId,
        path,
        attempt,
        message: error.message
      });
      if (attempt >= config.retries) return { ok: false, message: error.message };
    }
  }
  return { ok: false, message: "AI advisory service unavailable." };
}

async function withFallback(path, payload, context, fallbackMethod) {
  const result = await postWithRetry(path, payload, context);
  if (result.ok) return result.data;
  fallback.logFallbackWarning(path, context, result.message || result.fallbackReason);
  return fallbackMethod(payload, context);
}

async function predictSlaRisk(payload, context = {}) {
  return withFallback("/ai/v1/advisory/sla-risk", payload, context, fallback.fallbackSlaRisk);
}

async function detectBottlenecks(payload, context = {}) {
  return withFallback("/ai/v1/advisory/bottlenecks", payload, context, fallback.fallbackBottlenecks);
}

async function getNextBestActions(payload, context = {}) {
  return withFallback("/ai/v1/advisory/next-best-actions", payload, context, fallback.fallbackNextBestActions);
}

async function summariseCase(payload, context = {}) {
  return withFallback("/ai/v1/advisory/case-summary", payload, context, fallback.fallbackCaseSummary);
}

async function draftOfficerText(payload, context = {}) {
  return withFallback("/ai/v1/advisory/draft-assistance", payload, context, fallback.fallbackDraftAssistance);
}

async function submitAdvisoryFeedback(payload, context = {}) {
  return withFallback("/ai/v1/advisory/feedback", payload, context, (input, ctx) => ({
    success: true,
    result: { feedback_id: null, stored: false, message: "Feedback capture deferred because advisory service is unavailable." },
    confidence: 0.45,
    uncertainty: { isUncertain: true, reason: "ai_advisory_service_unavailable", requiresHumanReview: true },
    explainability: { summary: "Feedback was not sent to the advisory service.", signals: [], rulesApplied: [], warnings: ["Retry later if feedback retention is required."] },
    advisory: { advisoryOnly: true, mustNotAutoApply: true, finalDecisionOwner: "node_or_human_officer" },
    model: { modelName: "node_advisory_fallback", modelVersion: "0.1.0", modelMode: "deterministic_fallback", trainedAt: null },
    meta: { correlationId: ctx.correlationId || null, source: "node_advisory_fallback" }
  }));
}

async function logHumanOverride(payload, context = {}) {
  return withFallback("/ai/v1/advisory/human-override", payload, context, (input, ctx) => ({
    success: true,
    result: { override_id: null, logged: false, message: "Override learning log deferred because advisory service is unavailable." },
    confidence: 0.45,
    uncertainty: { isUncertain: true, reason: "ai_advisory_service_unavailable", requiresHumanReview: true },
    explainability: { summary: "Override was not sent to the advisory service.", signals: [], rulesApplied: [], warnings: ["Node legal audit should still record the human decision."] },
    advisory: { advisoryOnly: true, mustNotAutoApply: true, finalDecisionOwner: "node_or_human_officer" },
    model: { modelName: "node_advisory_fallback", modelVersion: "0.1.0", modelMode: "deterministic_fallback", trainedAt: null },
    meta: { correlationId: ctx.correlationId || null, source: "node_advisory_fallback" }
  }));
}

module.exports = {
  predictSlaRisk,
  detectBottlenecks,
  getNextBestActions,
  summariseCase,
  draftOfficerText,
  submitAdvisoryFeedback,
  logHumanOverride
};
