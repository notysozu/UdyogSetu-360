function baseMeta(res, extra = {}) {
  return {
    correlationId: res.getHeader('x-correlation-id') || res.req.context?.correlationId || null,
    requestId: res.getHeader('x-request-id') || res.req.context?.requestId || null,
    timestamp: new Date().toISOString(),
    apiVersion: res.req.context?.apiVersion || 'v1',
    ...extra
  };
}

function sendSuccess(res, data = {}, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    meta: baseMeta(res, meta)
  });
}

function sendCreated(res, data = {}, meta = {}) {
  return sendSuccess(res, data, meta, 201);
}

function sendAccepted(res, data = {}, meta = {}) {
  return sendSuccess(res, data, meta, 202);
}

function sendNoContent(res) {
  res.status(204).end();
}

function sendError(res, error, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
      details: error.details || []
    },
    meta: baseMeta(res)
  });
}

function paginatedResponse(items, pagination) {
  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit) || 1
    }
  };
}

module.exports = {
  sendSuccess,
  sendCreated,
  sendAccepted,
  sendNoContent,
  sendError,
  paginatedResponse
};
