function validateConsentRequest(input = {}) {
  if (!input.purpose) {
    const error = new Error('purpose is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(input.requestedDocumentTypes) || !input.requestedDocumentTypes.length) {
    const error = new Error('requestedDocumentTypes must be a non-empty array.');
    error.statusCode = 400;
    throw error;
  }
  return input;
}

function validateCallbackState(query = {}) {
  if (!query.state) {
    const error = new Error('state is required.');
    error.statusCode = 400;
    throw error;
  }
  return query;
}

module.exports = {
  validateConsentRequest,
  validateCallbackState
};
