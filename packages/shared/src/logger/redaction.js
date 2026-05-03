const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'otp',
  'secret',
  'apiKey',
  'clientSecret',
  'privateKey',
  's3Secret',
  'digilockerToken',
  'signedUrl',
  'documentPayload',
  'cardNumber',
  'cvv'
];

function shouldRedact(key = '') {
  const lower = String(key).toLowerCase();
  return SENSITIVE_KEYS.some((item) => lower.includes(item.toLowerCase()));
}

function redactValue(value) {
  if (Array.isArray(value)) return value.map((item) => redactSensitive(item));
  if (!value || typeof value !== 'object') return '[REDACTED]';
  return redactSensitive(value);
}

function redactSensitive(input) {
  if (!input || typeof input !== 'object') return input;
  const output = Array.isArray(input) ? [] : {};
  Object.entries(input).forEach(([key, value]) => {
    if (shouldRedact(key)) {
      output[key] = '[REDACTED]';
      return;
    }
    if (value && typeof value === 'object') {
      output[key] = redactValue(value);
      return;
    }
    output[key] = value;
  });
  return output;
}

module.exports = {
  redactSensitive,
  shouldRedact
};
