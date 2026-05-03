const { createLogger } = require('../../../../packages/shared/src/logger');

const logger = createLogger('audit-consumer');

function createAuditHandlerMap() {
  return new Proxy(
    {},
    {
      get(_target, eventName) {
        return async function handleAuditMirror(eventEnvelope) {
          logger.info('audit_event_received', {
            eventId: eventEnvelope.id,
            eventName: eventEnvelope.type || eventName,
            correlationId: eventEnvelope.correlationid
          });
          return { mirrored: true };
        };
      }
    }
  );
}

module.exports = { createAuditHandlerMap };
