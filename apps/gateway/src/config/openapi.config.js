const { getGatewayConfig } = require('./gateway.config');

function getOpenApiConfig() {
  const config = getGatewayConfig();
  return {
    title: 'UdyogSetu 360 API',
    version: '1.0.0',
    description:
      'Versioned gateway API for the UdyogSetu 360 interoperability backbone.',
    serverUrl: `/api/${config.apiVersion}`
  };
}

module.exports = { getOpenApiConfig };
