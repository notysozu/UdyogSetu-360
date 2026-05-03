const Case = require('../models/Case');
const { createRepository } = require('./base.repository');

const repository = createRepository(Case);

repository.findTimelineCase = function findTimelineCase(caseId) {
  return Case.findById(caseId).lean();
};

module.exports = repository;
