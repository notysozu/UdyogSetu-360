const { ok } = require('../../../../packages/shared/src/utils/apiResponse');

function buildStubHandler(resourceName) {
  return function stubHandler(req, res) {
    res.json(
      ok({
        resource: resourceName,
        route: req.originalUrl,
        method: req.method,
        message: `Gateway stub for ${resourceName}. Wire this to a downstream service or proxy during the next migration step.`,
        todo: 'Connect this route to the target service via internal SDK or proxy.'
      })
    );
  };
}

module.exports = { buildStubHandler };
