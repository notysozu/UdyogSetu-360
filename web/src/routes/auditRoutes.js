const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role.middleware');
const { requireAnyPermission } = require('../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../packages/shared/src');
const admin = require('../controllers/adminController');

const router = express.Router();
router.use(requireAuth);
router.use(requireRole('auditor', 'admin'));
router.use(requireAnyPermission(PERMISSIONS.AUDIT_READ, PERMISSIONS.AUDIT_EXPORT));

router.get('/', asyncHandler(admin.dashboard));
router.get('/events', asyncHandler(admin.dashboard));
router.get('/cases/:caseId/timeline', asyncHandler(admin.caseTimeline));
router.get('/case/:caseId', asyncHandler(admin.caseTimeline));

module.exports = router;
