const Certificate = require('../models/Certificate');
const { createRepository } = require('./base.repository');

module.exports = createRepository(Certificate);
