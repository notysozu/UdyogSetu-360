class DigiLockerError extends Error {
  constructor(message, code = 'DIGILOCKER_ERROR', statusCode = 400) {
    super(message);
    this.name = 'DigiLockerError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

module.exports = { DigiLockerError };
