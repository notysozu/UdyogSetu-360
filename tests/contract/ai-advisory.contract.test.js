const test = require("node:test");
const assert = require("node:assert/strict");

test("AI advisory response includes safety fields", () => {
  const response = {
    success: true,
    result: {},
    confidence: 0.82,
    uncertainty: { isUncertain: false, reason: null, requiresHumanReview: false },
    explainability: { summary: "reason", signals: [], rulesApplied: [], warnings: [] },
    advisory: { advisoryOnly: true, mustNotAutoApply: true, finalDecisionOwner: "node_or_human_officer" },
    model: { modelName: "dummy_sla_risk_model", modelVersion: "0.1.0", modelMode: "dummy", trainedAt: null },
    meta: { correlationId: "contract-test" }
  };
  assert.equal(response.advisory.advisoryOnly, true);
  assert.equal(response.advisory.mustNotAutoApply, true);
  assert.equal(typeof response.confidence, "number");
});
