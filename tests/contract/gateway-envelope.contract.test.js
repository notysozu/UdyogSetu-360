const test = require("node:test");
const assert = require("node:assert/strict");

function validateEnvelope(body) {
  assert.equal(typeof body.success, "boolean");
  assert.ok("data" in body || "result" in body || "error" in body);
  assert.ok(body.meta === undefined || typeof body.meta === "object");
}

test("standard gateway envelope shape", () => {
  validateEnvelope({
    success: true,
    data: { ok: true },
    error: null,
    meta: { correlationId: "contract-test" }
  });
});
