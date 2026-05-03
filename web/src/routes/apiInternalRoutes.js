const express = require('express');
const { requireInternalCall } = require('../middleware/service-auth.middleware');
const { success } = require('../utils/response');

const router = express.Router();

router.use(requireInternalCall);
router.get('/health', (req, res) => {
  return success(res, {
    service: 'udyogsetu-web-api-internal',
    time: new Date().toISOString()
  });
});

module.exports = router;
