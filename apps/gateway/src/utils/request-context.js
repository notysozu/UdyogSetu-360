const { randomUUID } = require('crypto');

function createRequestContext(req, apiVersion = 'v1') {
  const correlationId = req.get('x-correlation-id') || randomUUID();
  const requestId = randomUUID();

  return {
    correlationId,
    requestId,
    apiVersion,
    actor: req.user || req.serviceUser || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || '',
    startedAt: Date.now()
  };
}

module.exports = { createRequestContext };
