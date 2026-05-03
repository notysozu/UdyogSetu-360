const ApprovalTask = require('../../../case-service/src/models/ApprovalTask');

module.exports = {
  findById(taskId) {
    return ApprovalTask.findById(taskId);
  },
  findByCaseId(caseId) {
    return ApprovalTask.find({ caseId, isDeleted: false }).sort({ createdAt: 1 });
  },
  save(taskDoc, options = {}) {
    return taskDoc.save(options.session ? { session: options.session } : undefined);
  },
  updateById(taskId, patch, options = {}) {
    return ApprovalTask.findByIdAndUpdate(taskId, patch, {
      new: true,
      session: options.session
    });
  }
};
