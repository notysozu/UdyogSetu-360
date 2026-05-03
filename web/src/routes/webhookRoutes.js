const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { n8nEscalation } = require('../controllers/webhookController');

const router = express.Router();

router.post('/n8n/escalation', asyncHandler(n8nEscalation));

module.exports = router;
