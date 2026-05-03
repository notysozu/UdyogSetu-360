function getSecuritySchemes() {
  return {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    },
    serviceToken: {
      type: 'apiKey',
      in: 'header',
      name: 'x-internal-service-token'
    },
    webhookSignature: {
      type: 'apiKey',
      in: 'header',
      name: 'x-us360-signature'
    }
  };
}

module.exports = { getSecuritySchemes };
