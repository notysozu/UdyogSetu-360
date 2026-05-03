const store = { traceId: null, spanId: null };

function getTraceContext() {
  return { traceId: store.traceId, spanId: store.spanId };
}

function setTraceContext(traceId, spanId) {
  store.traceId = traceId || null;
  store.spanId = spanId || null;
}

module.exports = {
  getTraceContext,
  setTraceContext
};
