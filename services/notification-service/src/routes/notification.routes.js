const express = require('express');
const controller = require('../controllers/notification.controller');
const templateController = require('../controllers/message-template.controller');

const router = express.Router();

router.get('/api/v1/notifications', controller.list);
router.post('/api/v1/notifications', controller.create);
router.post('/api/v1/notifications/send', controller.send);
router.patch('/api/v1/notifications/:notificationId/read', controller.read);
router.post('/api/v1/notifications/mark-all-read', controller.markAllRead);
router.post('/api/v1/notifications/:notificationId/retry', controller.retry);
router.post('/api/v1/notifications/:notificationId/cancel', controller.cancel);

router.get('/api/v1/message-templates', templateController.listTemplates);
router.get('/api/v1/message-templates/:templateCode', templateController.getTemplate);
router.post('/api/v1/message-templates', templateController.createTemplate);
router.patch('/api/v1/message-templates/:templateCode', templateController.patchTemplate);
router.post('/api/v1/message-templates/seed-defaults', templateController.seedDefaults);

module.exports = router;
