const express = require('express');
const healthRoutes = require('./health.routes');
const apiV1Routes = require('./api-v1.routes');
const legacyRoutes = require('./legacy.routes');

const router = express.Router();

router.use(healthRoutes);
router.use('/api/v1', apiV1Routes);
router.use(legacyRoutes);

module.exports = router;
