function getAiConfig() {
  return {
    enabled: String(process.env.AI_SERVICE_ENABLED || "true") === "true",
    baseUrl: process.env.AI_SERVICE_BASE_URL || process.env.AI_SERVICE_URL || "http://localhost:8000",
    timeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS || 5000),
    retries: Number(process.env.AI_SERVICE_RETRIES || 2),
    apiKey: process.env.AI_SERVICE_API_KEY || "",
    requireAuth: String(process.env.AI_SERVICE_REQUIRE_AUTH || "false") === "true",
    confidenceThreshold: Number(process.env.AI_SERVICE_CONFIDENCE_THRESHOLD || 0.7),
    fallbackEnabled: true
  };
}

function getAiAdvisoryConfig() {
  return {
    enabled: String(process.env.AI_ADVISORY_ENABLED || "true") === "true",
    baseUrl:
      process.env.AI_ADVISORY_BASE_URL ||
      process.env.AI_SERVICE_BASE_URL ||
      process.env.AI_SERVICE_URL ||
      "http://localhost:8000",
    timeoutMs: Number(process.env.AI_ADVISORY_TIMEOUT_MS || 5000),
    retries: Number(process.env.AI_ADVISORY_RETRIES || 2),
    apiKey: process.env.AI_ADVISORY_API_KEY || "",
    requireAuth: String(process.env.AI_ADVISORY_REQUIRE_AUTH || "false") === "true",
    confidenceThreshold: Number(process.env.AI_ADVISORY_CONFIDENCE_THRESHOLD || 0.7),
    fallbackEnabled: true
  };
}

module.exports = { getAiConfig, getAiAdvisoryConfig };
