const express = require('express');
const { asyncHandler } = require('../../../../web/src/utils/asyncHandler');
const auth = require('../../../investor-portal/src/controllers/auth.controller');

const router = express.Router();
router.get(['/auth/login', '/login'], auth.showLogin);
router.post(['/auth/login', '/login'], asyncHandler(auth.login));
router.post(['/auth/logout', '/logout'], asyncHandler(auth.logout));

module.exports = router;
