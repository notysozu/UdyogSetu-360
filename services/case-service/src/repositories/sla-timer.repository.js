const SlaTimer = require('../models/SlaTimer');
const { createRepository } = require('./base.repository');

const repository = createRepository(SlaTimer);

repository.findActiveByEntity = function findActiveByEntity(entityType, entityId) {
  return SlaTimer.findOne({
    entityType,
    entityId,
    status: { $in: ['running', 'paused', 'warning', 'breached', 'escalated'] },
    isDeleted: false
  }).sort({ createdAt: -1 });
};

repository.findWarningCandidates = function findWarningCandidates(now = new Date(), limit = 200) {
  return SlaTimer.find({
    status: 'running',
    warningAt: { $lte: now },
    warningSentAt: null,
    isDeleted: false
  })
    .sort({ warningAt: 1 })
    .limit(limit);
};

repository.findBreached = function findBreached(now = new Date()) {
  return SlaTimer.find({
    status: { $in: ['running', 'warning', 'escalated'] },
    dueAt: { $lte: now },
    isDeleted: false
  }).lean();
};

repository.findBreachCandidates = function findBreachCandidates(now = new Date(), limit = 200) {
  return SlaTimer.find({
    status: { $in: ['running', 'warning', 'escalated'] },
    dueAt: { $lt: now },
    breachedAt: null,
    isDeleted: false
  })
    .sort({ dueAt: 1 })
    .limit(limit);
};

repository.findApprovalAgeingRows = function findApprovalAgeingRows(filter = {}) {
  return SlaTimer.find({
    timerType: 'approval',
    status: { $in: ['running', 'warning', 'breached', 'escalated', 'paused'] },
    isDeleted: false,
    ...filter
  }).lean();
};

repository.findGrievanceAgeingRows = function findGrievanceAgeingRows(filter = {}) {
  return SlaTimer.find({
    timerType: 'grievance_resolution',
    status: { $in: ['running', 'warning', 'breached', 'escalated', 'paused'] },
    isDeleted: false,
    ...filter
  }).lean();
};

module.exports = repository;
