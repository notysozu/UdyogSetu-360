function getSchemas() {
  return {
    ResponseEnvelope: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {},
        error: {
          type: ['object', 'null'],
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } }
          }
        },
        meta: {
          type: 'object',
          properties: {
            correlationId: { type: 'string' },
            requestId: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            apiVersion: { type: 'string' }
          }
        }
      }
    },
    PaginationMeta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' }
      }
    }
  };
}

module.exports = { getSchemas };
