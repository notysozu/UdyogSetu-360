const { createLogger } = require('../../../../packages/shared/src/logger');
const { EVENT_NAMES } = require('../../../../packages/shared/src/constants/event-names.constants');

const logger = createLogger('case-service-consumer');

function createCaseEventHandlerMap() {
  return {
    [EVENT_NAMES.CASE_SUBMITTED]: async function handleCaseSubmitted(eventEnvelope) {
      logger.info('case_event_received', {
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        correlationId: eventEnvelope.correlationid
      });
      return { handled: true };
    },
    [EVENT_NAMES.CASE_AMENDED]: async function handleCaseAmended(eventEnvelope) {
      logger.info('case_event_received', {
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        correlationId: eventEnvelope.correlationid
      });
      return { handled: true };
    },
    [EVENT_NAMES.CASE_STATUS_CHANGED]: async function handleCaseStatusChanged(eventEnvelope) {
      logger.info('case_event_received', {
        eventId: eventEnvelope.id,
        eventName: eventEnvelope.type,
        correlationId: eventEnvelope.correlationid
      });
      return { handled: true };
    }
  };
}

module.exports = { createCaseEventHandlerMap };
