const { createLogger } = require("../../../../packages/shared/src/logger");
const { getAiConfig } = require("../config/ai.config");
const fallback = require("./ai-fallback.service");

const logger = createLogger("case-service");

async function postWithRetry(path, payload, context = {}) {
  const config = getAiConfig();
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
      if (config.requireAuth && config.apiKey) headers["x-ai-service-key"] = config.apiKey;
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const body = await response.text();
        logger.warn("ai_service_http_error", {
          correlationId: context.correlationId,
          path,
          statusCode: response.status,
          attempt,
          body
        });
        if (response.status >= 500 && attempt < config.retries) continue;
        return { ok: false, statusCode: response.status, message: body || "AI service request failed." };
      }
      return { ok: true, data: await response.json() };
    } catch (error) {
      clearTimeout(timeout);
      logger.warn("ai_service_unavailable", {
        correlationId: context.correlationId,
        path,
        attempt,
        message: error.message
      });
      if (attempt >= config.retries) return { ok: false, message: error.message };
    }
  }
  return { ok: false, message: "AI service unavailable." };
}

async function checkDocumentCompleteness(payload, context = {}) {
  const result = await postWithRetry("/ai/v1/documents/completeness-check", payload, context);
  return result.ok ? result.data : fallback.fallbackDocumentCompleteness(payload, context);
}

async function normaliseFields(payload, context = {}) {
  const result = await postWithRetry("/ai/v1/fields/normalise", payload, context);
  return result.ok ? result.data : fallback.fallbackNormaliseFields(payload, context);
}

async function detectMismatch(payload, context = {}) {
  const result = await postWithRetry("/ai/v1/mismatch/detect", payload, context);
  return result.ok ? result.data : fallback.fallbackMismatchDetection(payload, context);
}

async function recommendApprovalPath(payload, context = {}) {
  const result = await postWithRetry("/ai/v1/routing/approval-path", payload, context);
  return result.ok ? result.data : fallback.fallbackApprovalPath(payload, context);
}

async function getSmartRoutingSuggestions(payload, context = {}) {
  const result = await postWithRetry("/ai/v1/routing/smart-suggestions", payload, context);
  return result.ok ? result.data : fallback.fallbackSmartRouting(payload, context);
}

module.exports = {
  checkDocumentCompleteness,
  normaliseFields,
  detectMismatch,
  recommendApprovalPath,
  getSmartRoutingSuggestions
};
