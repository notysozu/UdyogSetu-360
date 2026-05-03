function removeUndefinedFields(input) {
  if (Array.isArray(input)) {
    return input.map((entry) => removeUndefinedFields(entry)).filter((entry) => entry !== undefined);
  }
  if (!input || typeof input !== 'object') {
    return input;
  }
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, removeUndefinedFields(value)])
  );
}

function maskSensitiveFields(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const masked = Array.isArray(payload) ? [] : {};
  for (const [key, value] of Object.entries(payload)) {
    if (/secret|token|password|signature|authorization|api.?key/i.test(key)) {
      masked[key] = '***';
    } else if (value && typeof value === 'object') {
      masked[key] = maskSensitiveFields(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

function flattenObject(input, prefix = '', target = {}) {
  for (const [key, value] of Object.entries(input || {})) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value, path, target);
    } else {
      target[path] = value;
    }
  }
  return target;
}

function unflattenObject(input = {}) {
  const target = {};
  for (const [key, value] of Object.entries(input)) {
    const segments = key.split('.');
    let current = target;
    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      current[segment] = current[segment] || {};
      current = current[segment];
    }
    current[segments[segments.length - 1]] = value;
  }
  return target;
}

module.exports = {
  maskSensitiveFields,
  removeUndefinedFields,
  flattenObject,
  unflattenObject
};
