const EVENT_TOPICS = Object.freeze({
  DOMAIN_CASE: 'us360.domain.case.v1',
  DOMAIN_TASK: 'us360.domain.task.v1',
  DOMAIN_DOCUMENT: 'us360.domain.document.v1',
  DOMAIN_GRIEVANCE: 'us360.domain.grievance.v1',
  DOMAIN_INSPECTION: 'us360.domain.inspection.v1',
  DOMAIN_FEE: 'us360.domain.fee.v1',
  DOMAIN_CERTIFICATE: 'us360.domain.certificate.v1',
  DOMAIN_NOTIFICATION: 'us360.domain.notification.v1',
  DOMAIN_AUDIT: 'us360.domain.audit.v1',
  DOMAIN_SLA: 'us360.domain.sla.v1',
  INTEGRATION_DEPARTMENT: 'us360.integration.department.v1',
  INTEGRATION_CALLBACK: 'us360.integration.callback.v1',
  PROJECTION_UPDATE: 'us360.projection.update.v1',
  DEAD_LETTER: 'us360.dead-letter.v1'
});

const EVENT_TOPIC_VALUES = Object.freeze(Object.values(EVENT_TOPICS));

module.exports = { EVENT_TOPICS, EVENT_TOPIC_VALUES };
