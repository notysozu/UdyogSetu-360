const test = require("node:test");
const assert = require("node:assert/strict");

const advisoryClient = require("../services/ai-advisory-client.service");

test("advisory client success", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    async json() {
      return { success: true, result: { actions: [] }, confidence: 0.9 };
    }
  });
  const result = await advisoryClient.getNextBestActions(
    { actor_context: { role: "department_officer" }, case_snapshot: { universal_case_id: "US360-1" }, tasks: [] },
    { correlationId: "advisory-success" }
  );
  assert.equal(result.success, true);
  global.fetch = originalFetch;
});

test("timeout triggers advisory fallback", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("timeout");
  };
  const result = await advisoryClient.predictSlaRisk(
    { case_snapshot: { universal_case_id: "US360-2" }, tasks: [], sla_signals: [] },
    { correlationId: "advisory-timeout" }
  );
  assert.equal(result.uncertainty.requiresHumanReview, true);
  global.fetch = originalFetch;
});

test("service unavailable triggers summary fallback", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("network down");
  };
  const result = await advisoryClient.summariseCase(
    {
      actor_context: { role: "department_officer" },
      case_snapshot: {
        universal_case_id: "US360-3",
        case_type: "new_unit",
        status: "under_scrutiny",
        current_stage: "review",
        department_codes: ["fire"]
      },
      tasks: [],
      summary_type: "officer"
    },
    { correlationId: "advisory-summary-fallback" }
  );
  assert.equal(result.success, true);
  assert.equal(result.advisory.advisoryOnly, true);
  global.fetch = originalFetch;
});

test("fallback does not throw to controller callers", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("service down");
  };
  await assert.doesNotReject(() =>
    advisoryClient.draftOfficerText(
      {
        actor_context: { role: "department_officer" },
        draft_type: "query_to_investor",
        case_snapshot: {
          universal_case_id: "US360-4",
          case_type: "new_unit",
          status: "under_scrutiny",
          current_stage: "document_scrutiny",
          department_codes: ["pollution"]
        },
        issue_summary: "Missing effluent treatment details."
      },
      { correlationId: "advisory-no-throw" }
    )
  );
  global.fetch = originalFetch;
});
