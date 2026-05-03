const { ok, fail } = require("../../../../packages/shared/src/utils/apiResponse");
const aiClient = require("../services/ai-client.service");

function ensureAdminOrSystem(req, res) {
  const role = req.get("x-user-role") || "anonymous";
  if (!["admin", "system"].includes(role)) {
    res.status(403).json(fail("Access denied"));
    return false;
  }
  return true;
}

function contextFromReq(req) {
  return {
    correlationId: req.correlationId,
    userId: req.get("x-user-id") || null,
    role: req.get("x-user-role") || null
  };
}

async function testDocumentCompleteness(req, res, next) {
  if (!ensureAdminOrSystem(req, res)) return;
  try {
    const result = await aiClient.checkDocumentCompleteness(req.body, contextFromReq(req));
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
}

async function testApprovalPath(req, res, next) {
  if (!ensureAdminOrSystem(req, res)) return;
  try {
    const result = await aiClient.recommendApprovalPath(req.body, contextFromReq(req));
    res.json(ok(result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  testDocumentCompleteness,
  testApprovalPath
};
