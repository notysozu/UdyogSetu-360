const { z } = require('zod');
const { AppError } = require('../utils/app-error');

function formatIssues(issues = []) {
  return issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message
  }));
}

function validate(source, schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(
        new AppError(
          'VALIDATION_ERROR',
          'Request validation failed.',
          400,
          formatIssues(result.error.issues)
        )
      );
    }
    req[source] = result.data;
    next();
  };
}

const validateBody = (schema) => validate('body', schema);
const validateParams = (schema) => validate('params', schema);
const validateQuery = (schema) => validate('query', schema);
const validateHeaders = (schema) => validate('headers', schema);

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  validateHeaders,
  z
};
