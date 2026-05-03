const ApprovalTask = require('../models/ApprovalTask');
const { createRepository } = require('./base.repository');

const repository = createRepository(ApprovalTask);

repository.findByCaseId = function findByCaseId(caseId) {
  return ApprovalTask.find({ caseId, isDeleted: false }).sort({ createdAt: 1 });
};

module.exports = repository;
