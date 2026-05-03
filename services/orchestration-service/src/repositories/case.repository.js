const Case = require('../../../case-service/src/models/Case');

module.exports = {
  findById(caseId) {
    return Case.findById(caseId);
  },
  findLeanById(caseId) {
    return Case.findById(caseId).lean();
  },
  save(caseDoc, options = {}) {
    return caseDoc.save(options.session ? { session: options.session } : undefined);
  },
  updateById(caseId, patch, options = {}) {
    return Case.findByIdAndUpdate(caseId, patch, {
      new: true,
      session: options.session
    });
  }
};
