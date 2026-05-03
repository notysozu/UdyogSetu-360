const { safeNextPath } = require('../utils/navigation');

function getSafeNext(req, fallback = null) {
  return safeNextPath(req.body?.next || req.query?.next, fallback);
}

module.exports = { getSafeNext };
