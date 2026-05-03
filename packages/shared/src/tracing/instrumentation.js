function initialiseInstrumentation(logger) {
  if (String(process.env.OTEL_ENABLED || 'false') !== 'true') return { enabled: false, mode: 'noop' };
  logger?.warn?.('otel_initialisation_fallback', {
    message: 'OpenTelemetry dependencies are not wired in this workspace; using no-op tracing.'
  });
  return { enabled: false, mode: 'noop', todo: 'Install @opentelemetry/sdk-node and exporters for full tracing.' };
}

module.exports = {
  initialiseInstrumentation
};
