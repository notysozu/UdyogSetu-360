const RetryJob = require('../models/RetryJob');
const { createRepository } = require('./base.repository');

const repository = createRepository(RetryJob);

repository.findReady = function findReady(now = new Date(), limit = 50) {
  return RetryJob.find({
    status: 'pending',
    nextRunAt: { $lte: now },
    isDeleted: false
  })
    .sort({ nextRunAt: 1 })
    .limit(limit)
    .lean();
};

module.exports = repository;
