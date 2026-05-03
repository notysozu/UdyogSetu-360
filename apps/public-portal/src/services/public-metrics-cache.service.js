const cache = new Map();

function isEnabled() {
  return String(process.env.PUBLIC_METRICS_CACHE_ENABLED || 'true') === 'true';
}

function getCacheKey(metricName, filters = {}) {
  return `${metricName}:${JSON.stringify(filters)}`;
}

function get(metricName, filters = {}) {
  if (!isEnabled()) return null;
  const key = getCacheKey(metricName, filters);
  const value = cache.get(key);
  if (!value) return null;
  if (value.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return value.data;
}

function set(metricName, filters = {}, data, ttlSeconds = Number(process.env.PUBLIC_METRICS_CACHE_TTL_SECONDS || 300)) {
  if (!isEnabled()) return data;
  cache.set(getCacheKey(metricName, filters), {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
  return data;
}

function invalidate(pattern = '') {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

async function getOrSet(metricName, filters, loader, ttlSeconds) {
  const existing = get(metricName, filters);
  if (existing) return { data: existing, hit: true };
  const data = await loader();
  set(metricName, filters, data, ttlSeconds);
  return { data, hit: false };
}

module.exports = { getCacheKey, get, set, invalidate, getOrSet };
