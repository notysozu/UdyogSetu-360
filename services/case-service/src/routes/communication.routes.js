const express = require('express');
const controller = require('../controllers/communication-thread.controller');

const router = express.Router();

router.post('/api/v1/communication/threads', controller.createThread);
router.get('/api/v1/communication/threads/:threadId/messages', controller.listMessages);
router.post('/api/v1/communication/threads/:threadId/messages', controller.addMessage);
router.post('/api/v1/communication/threads/:threadId/close', controller.closeThread);

module.exports = router;
