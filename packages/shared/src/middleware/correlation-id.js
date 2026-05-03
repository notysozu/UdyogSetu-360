const { randomUUID } = require('crypto');

function correlationIdMiddleware(req, res, next) {
  const correlationHeader = process.env.CORRELATION_HEADER || 'x-correlation-id';
  const requestHeader = process.env.REQUEST_ID_HEADER || 'x-request-id';
  const traceHeader = process.env.TRACEPARENT_HEADER || 'traceparent';
  const correlationId = req.get(correlationHeader) || randomUUID();
  const requestId = req.get(requestHeader) || randomUUID();
  const traceparent = req.get(traceHeader) || null;
  req.correlationId = correlationId;
  req.requestId = requestId;
  req.context = { ...(req.context || {}), correlationId, requestId, traceparent };
  res.locals.correlationId = correlationId;
  res.locals.requestId = requestId;
  res.locals.traceparent = traceparent;
  res.setHeader(correlationHeader, correlationId);
  res.setHeader(requestHeader, requestId);
  if (traceparent) res.setHeader(traceHeader, traceparent);
  next();
}

module.exports = { correlationIdMiddleware };
