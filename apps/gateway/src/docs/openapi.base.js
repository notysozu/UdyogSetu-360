const { getSchemas } = require('./openapi.schemas');
const { getSecuritySchemes } = require('./openapi.security');
const { getPaths } = require('./openapi.paths');

function buildOpenApiDocument(config) {
  return {
    openapi: '3.1.0',
    info: {
      title: config.title,
      version: config.version,
      description: config.description
    },
    servers: [{ url: config.serverUrl }],
    components: {
      securitySchemes: getSecuritySchemes(),
      schemas: getSchemas()
    },
    security: [{ bearerAuth: [] }],
    paths: getPaths()
  };
}

module.exports = { buildOpenApiDocument };
