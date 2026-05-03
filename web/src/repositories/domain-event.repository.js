const DomainEvent = require('../models/DomainEvent');
const EventLog = require('../models/EventLog');

async function append(event, session = null) {
  const [created] = await DomainEvent.create([event], session ? { session } : undefined);
  await EventLog.create(
    [
      {
        eventId: created.eventId,
        type: created.eventName,
        source: created.source,
        caseId: created.aggregateId,
        correlationId: created.correlationId,
        payload: created.payload
      }
    ],
    session ? { session } : undefined
  );
  return created;
}

async function appendMany(events, session = null) {
  if (!events.length) return [];
  const created = await DomainEvent.insertMany(events, session ? { session } : undefined);
  const timelineEvents = created.map((event) => ({
    eventId: event.eventId,
    type: event.eventName,
    source: event.source,
    caseId: event.aggregateId,
    correlationId: event.correlationId,
    payload: event.payload
  }));
  await EventLog.insertMany(timelineEvents, session ? { session } : undefined);
  return created;
}

module.exports = { append, appendMany };
