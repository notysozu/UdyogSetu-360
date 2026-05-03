const { getOpenApiConfig } = require('../config/openapi.config');
const { buildOpenApiDocument } = require('../docs/openapi.base');

function getOpenApiDocument() {
  return buildOpenApiDocument(getOpenApiConfig());
}

module.exports = { getOpenApiDocument };
