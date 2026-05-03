const Department = require('../models/Department');
const { createRepository } = require('./base.repository');

const repository = createRepository(Department);

repository.findActiveByCodes = function findActiveByCodes(codes) {
  return Department.find({ code: { $in: codes }, isActive: true, isDeleted: false });
};

module.exports = repository;
