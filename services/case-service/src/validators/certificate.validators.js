function validateCertificateInput(input = {}) {
  if (!input.certificateNumber && !input.title) {
    const error = new Error('certificateNumber or title is required.');
    error.statusCode = 400;
    throw error;
  }
  return input;
}

function validateVerificationToken(token) {
  if (!token) {
    const error = new Error('verificationToken is required.');
    error.statusCode = 400;
    throw error;
  }
  return token;
}

module.exports = {
  validateCertificateInput,
  validateVerificationToken
};
