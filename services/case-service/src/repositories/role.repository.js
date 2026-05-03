const Role = require('../models/Role');
const { createRepository } = require('./base.repository');

module.exports = createRepository(Role);
