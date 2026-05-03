const test = require("node:test");
const assert = require("node:assert/strict");

test("canonical event envelope fixture has required fields", () => {
  const event = {
    id: "evt-contract-001",
    source: "case-service",
    type: "case.submitted.v1",
    specversion: "1.0",
    time: "2026-05-03T00:00:00.000Z",
    datacontenttype: "application/json",
    data: { universalCaseId: "US360-KA-2026-000001" }
  };
  for (const field of ["id", "source", "type", "specversion", "time", "data"]) {
    assert.ok(event[field]);
  }
});
