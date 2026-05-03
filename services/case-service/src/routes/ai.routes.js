const express = require("express");
const controller = require("../controllers/ai.controller");

const router = express.Router();

router.post("/api/v1/ai/test/document-completeness", controller.testDocumentCompleteness);
router.post("/api/v1/ai/test/approval-path", controller.testApprovalPath);

module.exports = router;
