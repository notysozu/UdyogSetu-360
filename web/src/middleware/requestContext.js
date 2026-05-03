const { randomUUID } = require('crypto');

function attachRequestContext(req, res, next) {
  req.correlationId = req.get('x-correlation-id') || randomUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}

module.exports = { attachRequestContext };
