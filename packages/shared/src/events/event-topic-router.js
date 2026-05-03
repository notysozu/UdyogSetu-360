const { EVENT_NAMES } = require('../constants/event-names.constants');
const { EVENT_TOPICS } = require('../constants/event-topics.constants');
const { NonRetryableEventError } = require('../errors/event-errors');

function getTopicForEvent(eventName) {
  if (eventName.startsWith('case.')) return EVENT_TOPICS.DOMAIN_CASE;
  if (eventName.startsWith('task.')) return EVENT_TOPICS.DOMAIN_TASK;
  if (eventName.startsWith('document.')) return EVENT_TOPICS.DOMAIN_DOCUMENT;
  if (eventName.startsWith('grievance.')) return EVENT_TOPICS.DOMAIN_GRIEVANCE;
  if (eventName.startsWith('inspection.')) return EVENT_TOPICS.DOMAIN_INSPECTION;
  if (eventName.startsWith('fee.')) return EVENT_TOPICS.DOMAIN_FEE;
  if (eventName.startsWith('certificate.')) return EVENT_TOPICS.DOMAIN_CERTIFICATE;
  if (eventName.startsWith('notification.')) return EVENT_TOPICS.DOMAIN_NOTIFICATION;
  if (eventName.startsWith('audit.')) return EVENT_TOPICS.DOMAIN_AUDIT;
  if (eventName.startsWith('sla.')) return EVENT_TOPICS.DOMAIN_SLA;
  if (eventName.startsWith('integration.dispatch_')) return EVENT_TOPICS.INTEGRATION_DEPARTMENT;
  if (eventName.startsWith('integration.callback_')) return EVENT_TOPICS.INTEGRATION_CALLBACK;
  if (eventName.startsWith('projection.')) return EVENT_TOPICS.PROJECTION_UPDATE;
  throw new NonRetryableEventError(`No Kafka topic mapping exists for event ${eventName}.`);
}

function getAggregateTypeForEvent(eventName) {
  return String(eventName).split('.')[0];
}

function getPartitionKeyForEvent(eventEnvelope) {
  return (
    eventEnvelope.partitionkey ||
    eventEnvelope.data?.universalCaseId ||
    eventEnvelope.data?.payload?.externalReferenceId ||
    eventEnvelope.data?.aggregateId ||
    eventEnvelope.subject
  );
}

module.exports = {
  getTopicForEvent,
  getAggregateTypeForEvent,
  getPartitionKeyForEvent
};
