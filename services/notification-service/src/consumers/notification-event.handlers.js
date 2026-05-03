const { createLogger } = require('../../../../packages/shared/src/logger');
const { EVENT_NAMES } = require('../../../../packages/shared/src/constants/event-names.constants');

const logger = createLogger('notification-consumer');

function createNotificationHandlerMap() {
  const supported = [
    EVENT_NAMES.CASE_STATUS_CHANGED,
    EVENT_NAMES.TASK_QUERY_RAISED,
    EVENT_NAMES.FEE_DEMANDED,
    EVENT_NAMES.CERTIFICATE_ISSUED,
    EVENT_NAMES.GRIEVANCE_CREATED,
    EVENT_NAMES.SLA_WARNING,
    EVENT_NAMES.SLA_BREACHED
  ];

  return Object.fromEntries(
    supported.map((eventName) => [
      eventName,
      async function handleNotificationEvent(eventEnvelope) {
        logger.info('notification_event_received', {
          eventId: eventEnvelope.id,
          eventName: eventEnvelope.type,
          correlationId: eventEnvelope.correlationid
        });
        return { notificationQueued: true };
      }
    ])
  );
}

module.exports = { createNotificationHandlerMap };
