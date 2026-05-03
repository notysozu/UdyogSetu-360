const { AppError } = require('../utils/app-error');

function notFoundMiddleware(req, _res, next) {
  next(new AppError('NOT_FOUND', `Route not found: ${req.originalUrl}`, 404));
}

module.exports = { notFoundMiddleware };
