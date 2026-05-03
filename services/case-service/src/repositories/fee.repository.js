const Fee = require('../models/Fee');
const { createRepository } = require('./base.repository');

module.exports = createRepository(Fee);
