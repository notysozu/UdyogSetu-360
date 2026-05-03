const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const controller = require('../controllers/investor-certificate.controller');
const { requireInvestorAuth } = require('../middleware/investor-auth.middleware');

const router = express.Router();
router.use(requireInvestorAuth);

router.get('/certificates', asyncHandler(controller.listCertificates));
router.get('/cases/:caseId/certificates', asyncHandler(controller.listCaseCertificates));
router.get('/certificates/:certificateId', asyncHandler(controller.showCertificate));
router.get('/certificates/:certificateId/download', asyncHandler(controller.downloadCertificate));
router.get('/renewals', asyncHandler(controller.listRenewals));
router.get('/certificates/:certificateId/renew', asyncHandler(controller.showRenewalForm));
router.post('/certificates/:certificateId/renew', asyncHandler(controller.submitRenewalRequest));

module.exports = router;
