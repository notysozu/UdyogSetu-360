const DomainEvent = require('../models/DomainEvent');

function now() {
  return new Date();
}

module.exports = {
  appendEvent(eventEnvelope, options = {}) {
    return DomainEvent.create([eventEnvelope], options.session ? { session: options.session } : {}).then(
      (rows) => rows[0]
    );
  },
  appendEvents(events, options = {}) {
    return DomainEvent.insertMany(events, options.session ? { session: options.session } : {});
  },
  findPendingForPublish(limit = 50, workerId = 'publisher') {
    return DomainEvent.find({
      publishStatus: { $in: ['pending', 'failed'] },
      nextPublishAt: { $lte: now() },
      $or: [{ lockedAt: null }, { lockedAt: { $exists: false } }]
    })
      .sort({ nextPublishAt: 1, createdAt: 1 })
      .limit(limit);
  },
  markPublishing(eventId, workerId) {
    return DomainEvent.findOneAndUpdate(
      {
        eventId,
        publishStatus: { $in: ['pending', 'failed'] }
      },
      {
        $set: {
          publishStatus: 'publishing',
          lockedAt: now(),
          lockedBy: workerId
        }
      },
      { new: true }
    );
  },
  markPublished(eventId, kafkaMetadata = {}) {
    return DomainEvent.findOneAndUpdate(
      { eventId },
      {
        $set: {
          publishStatus: 'published',
          publishedAt: now(),
          lockedAt: null,
          lockedBy: null,
          metadata: {
            kafka: kafkaMetadata
          }
        },
        $inc: { publishAttempts: 1 }
      },
      { new: true }
    );
  },
  markFailed(eventId, error, nextPublishAt) {
    return DomainEvent.findOneAndUpdate(
      { eventId },
      {
        $set: {
          publishStatus: 'failed',
          failureReason: error.message,
          lastError: {
            code: error.code || 'EVENT_PUBLISH_ERROR',
            message: error.message
          },
          nextPublishAt,
          lockedAt: null,
          lockedBy: null
        },
        $inc: { publishAttempts: 1 }
      },
      { new: true }
    );
  },
  markDeadLettered(eventId, reason) {
    return DomainEvent.findOneAndUpdate(
      { eventId },
      {
        $set: {
          publishStatus: 'dead_lettered',
          failureReason: reason,
          lockedAt: null,
          lockedBy: null
        }
      },
      { new: true }
    );
  },
  findByEventId(eventId) {
    return DomainEvent.findOne({ eventId });
  },
  findByAggregate(aggregateType, aggregateId) {
    return DomainEvent.find({ aggregateType, aggregateId }).sort({ createdAt: 1 });
  },
  findByCase(universalCaseId) {
    return DomainEvent.find({ universalCaseId }).sort({ createdAt: 1 });
  },
  findByFilter(filter = {}, options = {}) {
    return DomainEvent.find(filter)
      .sort(options.sort || { createdAt: 1 })
      .limit(options.limit || 100);
  },
  unlockStalePublishingLocks(timeoutMs = 30000) {
    const staleBefore = new Date(Date.now() - timeoutMs);
    return DomainEvent.updateMany(
      {
        publishStatus: 'publishing',
        lockedAt: { $lte: staleBefore }
      },
      {
        $set: {
          publishStatus: 'failed',
          lockedAt: null,
          lockedBy: null,
          nextPublishAt: now()
        }
      }
    );
  }
};
