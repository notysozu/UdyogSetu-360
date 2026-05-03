const Inspection = require('../models/Inspection');
const { createRepository } = require('./base.repository');

module.exports = createRepository(Inspection);
