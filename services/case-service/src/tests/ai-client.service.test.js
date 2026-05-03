const test = require("node:test");
const assert = require("node:assert/strict");

const fallback = require("../services/ai-fallback.service");
const aiClient = require("../services/ai-client.service");

test("fallback approval path returns deterministic tracks", () => {
  const result = fallback.fallbackApprovalPath({
    project: {
      water_requirement_kld: 20,
      power_requirement_kw: 50,
      fire_noc_required: true,
      hazardous_process: true,
      workers_count: 20
    }
  });
  const codes = result.result.recommended_tracks.map((track) => track.department_code);
  assert.ok(codes.includes("pollution"));
  assert.ok(codes.includes("power"));
  assert.ok(codes.includes("fire"));
  assert.ok(codes.includes("industrial_safety"));
  assert.ok(codes.includes("labour"));
});

test("fallback document completeness is conservative", () => {
  const result = fallback.fallbackDocumentCompleteness({
    project: { power_requirement_kw: 100 },
    provided_documents: [{ document_type: "project_report" }]
  });
  assert.equal(result.uncertainty.requiresHumanReview, true);
});

test("ai client returns success response when upstream is available", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    async json() {
      return { success: true, result: { recommended_tracks: [] }, confidence: 0.9 };
    }
  });
  const result = await aiClient.recommendApprovalPath({ project: {} }, { correlationId: "test-ai-success" });
  assert.equal(result.success, true);
  global.fetch = originalFetch;
});

test("ai client uses fallback when upstream fails", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("network down");
  };
  const result = await aiClient.recommendApprovalPath(
    { project: { power_requirement_kw: 50, workers_count: 20 } },
    { correlationId: "test-ai-fallback" }
  );
  assert.equal(result.uncertainty.requiresHumanReview, true);
  assert.ok(Array.isArray(result.result.recommended_tracks));
  global.fetch = originalFetch;
});
