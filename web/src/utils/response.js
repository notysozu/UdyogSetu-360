function success(res, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null,
    correlationId: res.locals.correlationId || res.req.correlationId || null
  });
}

function failure(res, status, code, message) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message
    },
    correlationId: res.locals.correlationId || res.req.correlationId || null
  });
}

module.exports = { success, failure };
