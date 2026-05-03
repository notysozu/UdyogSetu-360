const Organisation = require('../models/Organisation');
const { createRepository } = require('./base.repository');

module.exports = createRepository(Organisation);
