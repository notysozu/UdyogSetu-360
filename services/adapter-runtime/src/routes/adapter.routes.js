const express = require('express');
const controller = require('../controllers/adapter.controller');
const { requireServiceOrPermission } = require('../middleware/adapter-auth.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');

const router = express.Router();

router.get('/api/v1/adapters', requireServiceOrPermission(PERMISSIONS.AUDIT_READ, PERMISSIONS.INTEGRATION_READ, PERMISSIONS.SYSTEM_INTERNAL_CALL), controller.listAdapters);
router.get('/api/v1/adapters/health', requireServiceOrPermission(PERMISSIONS.AUDIT_READ, PERMISSIONS.INTEGRATION_READ, PERMISSIONS.SYSTEM_INTERNAL_CALL), controller.getAllHealth);
router.get('/api/v1/adapters/:departmentCode/health', requireServiceOrPermission(PERMISSIONS.AUDIT_READ, PERMISSIONS.INTEGRATION_READ, PERMISSIONS.SYSTEM_INTERNAL_CALL), controller.getHealth);
router.post('/api/v1/adapters/:departmentCode/submit', requireServiceOrPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE), controller.submit);
router.get('/api/v1/adapters/:departmentCode/status/:externalReferenceId', requireServiceOrPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE), controller.getStatus);
router.post('/api/v1/adapters/:departmentCode/documents', requireServiceOrPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE), controller.pushDocument);
router.post('/api/v1/adapters/:departmentCode/callback', requireServiceOrPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE), controller.receiveCallback);
router.post('/api/v1/adapters/:departmentCode/reload', requireServiceOrPermission(PERMISSIONS.SYSTEM_INTERNAL_CALL, PERMISSIONS.INTEGRATION_MANAGE), controller.reload);
router.post('/api/v1/adapters/test/mock/:departmentCode', requireServiceOrPermission(PERMISSIONS.INTEGRATION_MANAGE), controller.testMockAdapter);

module.exports = router;
