const { ZodError } = require('zod');
const { sendError } = require('../utils/api-response');
const { AppError } = require('../utils/app-error');

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError(
      'VALIDATION_ERROR',
      'Request validation failed.',
      400,
      error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    );
  }

  if (error.name === 'ValidationError') {
    return new AppError(
      'VALIDATION_ERROR',
      'Mongoose validation failed.',
      400,
      Object.values(error.errors || {}).map((entry) => ({
        path: entry.path,
        message: entry.message
      }))
    );
  }

  if (error.name === 'CastError') {
    return new AppError('BAD_REQUEST', 'Invalid identifier format.', 400);
  }

  if (error.type === 'entity.too.large') {
    return new AppError('PAYLOAD_TOO_LARGE', 'Payload too large.', 413);
  }

  if (error.type === 'entity.parse.failed') {
    return new AppError('BAD_REQUEST', 'Request body could not be parsed.', 400);
  }

  if (error.name === 'JsonWebTokenError') {
    return new AppError('TOKEN_INVALID', 'Access token is invalid.', 401);
  }

  if (error.name === 'TokenExpiredError') {
    return new AppError('TOKEN_EXPIRED', 'Access token has expired.', 401);
  }

  return new AppError('INTERNAL_ERROR', error.message || 'Internal server error.', 500, []);
}

function errorMiddleware(error, req, res, _next) {
  const normalized = normalizeError(error);
  if (req.app.get('env') === 'development' && normalized.statusCode >= 500) {
    console.error(`[gateway:${req.context?.correlationId}]`, error.stack || error);
  }
  return sendError(res, normalized, normalized.statusCode);
}

module.exports = { errorMiddleware };
