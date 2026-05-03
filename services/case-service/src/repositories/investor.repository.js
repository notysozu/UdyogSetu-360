const InvestorProfile = require('../models/InvestorProfile');
const { createRepository } = require('./base.repository');

module.exports = createRepository(InvestorProfile);
