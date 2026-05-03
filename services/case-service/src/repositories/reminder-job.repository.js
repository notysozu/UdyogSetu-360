const ReminderJob = require('../models/ReminderJob');
const { createRepository } = require('./base.repository');

const repository = createRepository(ReminderJob);

repository.findDueJobs = function findDueJobs(now = new Date(), limit = 100) {
  return ReminderJob.find({
    status: 'scheduled',
    scheduledFor: { $lte: now },
    isDeleted: false
  })
    .sort({ scheduledFor: 1 })
    .limit(limit);
};

repository.cancelByEntity = function cancelByEntity(entityType, entityId, reason = 'cancelled') {
  return ReminderJob.updateMany(
    { entityType, entityId, status: { $in: ['scheduled', 'processing'] }, isDeleted: false },
    {
      $set: {
        status: 'cancelled',
        cancelledAt: new Date(),
        failureReason: reason
      }
    }
  );
};

module.exports = repository;
