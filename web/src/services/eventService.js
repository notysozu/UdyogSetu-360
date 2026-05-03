const EventLog = require('../models/EventLog');

async function appendEvent({ type, caseId, actor, correlationId, payload = {}, source = 'udyogsetu-web' }) {
  return EventLog.create({
    type,
    source,
    caseId,
    actor: actor ? {
      userId: actor.id || actor._id,
      role: actor.role,
      name: actor.name
    } : undefined,
    correlationId,
    payload
  });
}

module.exports = { appendEvent };
