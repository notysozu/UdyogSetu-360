const ApprovalTask = require('../models/ApprovalTask');

function createMany(tasks, session = null) {
  if (!tasks.length) return [];
  return ApprovalTask.insertMany(tasks, session ? { session } : undefined);
}

function findByCaseId(caseId) {
  return ApprovalTask.find({ caseId }).sort({ createdAt: 1 });
}

module.exports = { createMany, findByCaseId };
