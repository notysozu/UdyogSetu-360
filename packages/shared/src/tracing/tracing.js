const { randomUUID } = require('crypto');
const { getTraceContext, setTraceContext } = require('./span-utils');

function isEnabled() {
  return String(process.env.OTEL_ENABLED || 'false') === 'true' && String(process.env.OTEL_TRACES_ENABLED || 'false') === 'true';
}

async function startSpan(name, attributes = {}, fn = async () => null) {
  const parent = getTraceContext();
  const traceId = parent.traceId || randomUUID();
  const spanId = randomUUID().slice(0, 16);
  setTraceContext(traceId, spanId);
  try {
    return await fn({
      name,
      attributes,
      traceId,
      spanId,
      enabled: isEnabled()
    });
  } finally {
    setTraceContext(parent.traceId, parent.spanId);
  }
}

function addSpanEvent(_name, _attributes = {}) {}
function setSpanAttributes(_attributes = {}) {}
function recordException(_error) {}

function injectTraceHeaders(headers = {}) {
  const ctx = getTraceContext();
  if (ctx.traceId && ctx.spanId) {
    headers[process.env.TRACEPARENT_HEADER || 'traceparent'] = `00-${ctx.traceId.replace(/-/g, '').slice(0, 32)}-${ctx.spanId.replace(/-/g, '').slice(0, 16)}-01`;
  }
  return headers;
}

function extractTraceContext(headers = {}) {
  const key = (process.env.TRACEPARENT_HEADER || 'traceparent').toLowerCase();
  const incoming = headers[key] || headers[process.env.TRACEPARENT_HEADER || 'traceparent'];
  if (!incoming || typeof incoming !== 'string') return null;
  const parts = incoming.split('-');
  if (parts.length < 4) return null;
  setTraceContext(parts[1], parts[2]);
  return { traceId: parts[1], spanId: parts[2] };
}

module.exports = {
  startSpan,
  addSpanEvent,
  setSpanAttributes,
  recordException,
  getTraceContext,
  injectTraceHeaders,
  extractTraceContext
};
