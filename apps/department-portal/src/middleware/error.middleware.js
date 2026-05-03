function notFound(_req, res) {
  res.status(404).render('errors/404', { title: 'Page not found' });
}

function errorHandler(error, req, res, _next) {
  const status = error.status || error.statusCode || 500;
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({
      success: false,
      error: { message: error.message, code: error.code || 'ERROR' },
      meta: { correlationId: req.correlationId }
    });
  }
  if (status === 403) {
    return res.status(403).render('errors/403', { title: 'Access denied', error });
  }
  return res.status(status).render('errors/500', {
    title: 'Something went wrong',
    error,
    correlationId: req.correlationId
  });
}

module.exports = { notFound, errorHandler };
