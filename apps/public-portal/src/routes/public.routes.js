const express = require('express');
const controller = require('../controllers/public-dashboard.controller');
const { publicMetricsLimiter } = require('../middleware/public-rate-limit.middleware');
const { validateMetricsRequest } = require('../middleware/anti-abuse.middleware');

const router = express.Router();

router.use(['/public', '/api/v1/public/metrics'], publicMetricsLimiter, validateMetricsRequest);

router.get('/public', controller.showDashboard);
router.get('/public/dashboard', controller.showDashboard);
router.get('/public/metrics', controller.showMetricsOverview);
router.get('/public/departments', controller.showDepartments);
router.get('/public/grievances', controller.showGrievances);
router.get('/public/certificates', controller.showCertificates);

router.get('/api/v1/public/metrics', controller.getBundleApi);
router.get('/api/v1/public/metrics/applications', controller.getApplicationsApi);
router.get('/api/v1/public/metrics/stages', controller.getStagesApi);
router.get('/api/v1/public/metrics/departments', controller.getDepartmentsApi);
router.get('/api/v1/public/metrics/approvals', controller.getApprovalsApi);
router.get('/api/v1/public/metrics/certificates', controller.getCertificatesApi);
router.get('/api/v1/public/metrics/grievances', controller.getGrievancesApi);

module.exports = router;
