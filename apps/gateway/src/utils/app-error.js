class AppError extends Error {
  constructor(code, message, statusCode = 500, details = [], isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
  }
}

module.exports = { AppError };
