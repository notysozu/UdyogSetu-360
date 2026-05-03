const express = require('express');
const controller = require('../controllers/certificate.controller');
const { asyncHandler } = require('../utils/async-handler');
const { validateBody, validateParams } = require('../middleware/validation.middleware');
const { requireAnyPermission } = require('../middleware/auth.middleware');
const { createRateLimiters } = require('../middleware/rate-limit.middleware');
const { PERMISSIONS } = require('../../../../packages/shared/src');
const validators = require('../validators/certificate.validators');

const router = express.Router();
const rateLimiters = createRateLimiters();

router.post('/certificates/verify', rateLimiters.certificateLimiter, validateBody(validators.verifyCertificateBody), asyncHandler(controller.verifyCertificate));
router.get('/certificates/:certificateNumber', validateParams(validators.certificateNumberParams), requireAnyPermission(PERMISSIONS.CASE_READ, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_VIEW_ALL), asyncHandler(controller.getCertificate));
router.get('/cases/:caseId/certificates', validateParams(validators.caseCertificatesParams), requireAnyPermission(PERMISSIONS.CASE_READ, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_VIEW_ALL), asyncHandler(controller.listCaseCertificates));

module.exports = router;
