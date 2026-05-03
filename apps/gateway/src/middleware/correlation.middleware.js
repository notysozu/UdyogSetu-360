const { createRequestContext } = require('../utils/request-context');
const { getGatewayConfig } = require('../config/gateway.config');
const { extractTraceContext } = require('../../../../packages/shared/src/tracing/tracing');

function correlationMiddleware(req, res, next) {
  const config = getGatewayConfig();
  req.context = createRequestContext(req, config.apiVersion);
  extractTraceContext(req.headers || {});
  req.correlationId = req.context.correlationId;
  req.requestId = req.context.requestId;
  res.setHeader(process.env.CORRELATION_HEADER || 'x-correlation-id', req.context.correlationId);
  res.setHeader(process.env.REQUEST_ID_HEADER || 'x-request-id', req.context.requestId);
  next();
}

module.exports = { correlationMiddleware };
