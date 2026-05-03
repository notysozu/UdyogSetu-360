const { createLogger } = require('../../../../packages/shared/src/logger');
const { EVENT_NAMES } = require('../../../../packages/shared/src/constants/event-names.constants');

const logger = createLogger('adapter-runtime-consumer');

function createAdapterHandlerMap() {
  return {
    [EVENT_NAMES.INTEGRATION_DISPATCH_REQUESTED]: async function handleDispatchRequested(eventEnvelope) {
      logger.info('adapter_event_received', {
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        correlationId: eventEnvelope.correlationid
      });
      return { dispatched: true };
    },
    [EVENT_NAMES.TASK_STATUS_CHANGED]: async function handleTaskStatusChanged(eventEnvelope) {
      logger.info('adapter_event_received', {
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        correlationId: eventEnvelope.correlationid
      });
      return { observed: true };
    }
  };
}

module.exports = { createAdapterHandlerMap };
