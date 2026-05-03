const EscalationPolicy = require('../models/EscalationPolicy');
const { createRepository } = require('./base.repository');

const repository = createRepository(EscalationPolicy);

repository.findPolicy = function findPolicy(entityType, departmentCode, priority, category) {
  return EscalationPolicy.findOne({
    entityType,
    isActive: true,
    isDeleted: false,
    $or: [{ departmentCode }, { departmentCode: null }],
    $and: [
      { $or: [{ priority }, { priority: 'normal' }] },
      { $or: [{ category }, { category: null }] }
    ]
  }).sort({ departmentCode: -1, priority: -1 });
};

module.exports = repository;
