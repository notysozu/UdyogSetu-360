const IntegrationEndpoint = require('../models/IntegrationEndpoint');
const { createRepository } = require('./base.repository');

module.exports = createRepository(IntegrationEndpoint);
