const { createLogger } = require('../../../../packages/shared/src/logger');
const { EVENT_NAMES } = require('../../../../packages/shared/src/constants/event-names.constants');

const logger = createLogger('orchestration-consumer');

function createOrchestrationHandlerMap(orchestrationService) {
  return {
    [EVENT_NAMES.CASE_SUBMITTED]: async function handleCaseSubmitted(eventEnvelope) {
      logger.info('orchestration_event_received', {
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        correlationId: eventEnvelope.correlationid
      });
      return orchestrationService.handleCaseEvent({
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        payload: eventEnvelope.data.payload
      });
    },
    [EVENT_NAMES.TASK_STATUS_CHANGED]: async function handleTaskStatusChanged(eventEnvelope) {
      logger.info('orchestration_event_received', {
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        correlationId: eventEnvelope.correlationid
      });
      return orchestrationService.handleTaskEvent({
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        payload: eventEnvelope.data.payload
      });
    }
  };
}

module.exports = { createOrchestrationHandlerMap };
