const express = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const certificate = require('../controllers/certificateController');

const router = express.Router();

router.get('/verify', certificate.showVerifyForm);
router.post('/verify', asyncHandler(certificate.verifyCertificate));

module.exports = router;
