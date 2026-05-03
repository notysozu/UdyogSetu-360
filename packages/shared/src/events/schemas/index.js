const { envelopeSchema } = require('./common');

const schemaModules = {
  'case.submitted.v1': require('./case.submitted.v1').schema,
  'case.status_changed.v1': require('./case.status_changed.v1').schema,
  'task.created.v1': require('./task.created.v1').schema,
  'task.status_changed.v1': require('./task.status_changed.v1').schema,
  'document.uploaded.v1': require('./document.uploaded.v1').schema,
  'grievance.created.v1': require('./grievance.created.v1').schema,
  'inspection.scheduled.v1': require('./inspection.scheduled.v1').schema,
  'fee.demanded.v1': require('./fee.demanded.v1').schema,
  'fee.paid.v1': require('./fee.paid.v1').schema,
  'certificate.issued.v1': require('./certificate.issued.v1').schema
};

function getEventSchema(eventName) {
  return schemaModules[eventName] || envelopeSchema;
}

function validateEventEnvelope(eventEnvelope) {
  return envelopeSchema.parse(eventEnvelope);
}

function validateEventByType(eventEnvelope) {
  return getEventSchema(eventEnvelope.type).parse(eventEnvelope);
}

module.exports = {
  envelopeSchema,
  getEventSchema,
  validateEventEnvelope,
  validateEventByType
};
