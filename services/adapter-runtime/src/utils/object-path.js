function getByPath(source, path) {
  if (!path) return undefined;
  return String(path)
    .split('.')
    .reduce((value, segment) => (value == null ? undefined : value[segment]), source);
}

function setByPath(target, path, value) {
  if (!path) return target;
  const segments = String(path).split('.');
  let current = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!current[segment] || typeof current[segment] !== 'object') {
      current[segment] = {};
    }
    current = current[segment];
  }
  current[segments[segments.length - 1]] = value;
  return target;
}

module.exports = { getByPath, setByPath };
