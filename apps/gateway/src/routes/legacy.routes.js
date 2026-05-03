const express = require('express');

const router = express.Router();

function legacyAlias(successor) {
  return (req, res) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', `<${successor}>; rel="successor-version"`);
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(307, `${successor}${query}`);
  };
}

router.all('/api/cases', legacyAlias('/api/v1/cases'));
router.all('/api/tasks', legacyAlias('/api/v1/tasks'));
router.all('/api/documents', legacyAlias('/api/v1/documents'));
router.all('/api/grievances', legacyAlias('/api/v1/grievances'));
router.all('/api/certificates/verify', legacyAlias('/api/v1/certificates/verify'));
router.all('/api/events', legacyAlias('/api/v1/events/ingest'));

module.exports = router;
