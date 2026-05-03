const DEFAULT_TTL_SECONDS = Number(process.env.ANALYTICS_CACHE_TTL_SECONDS || 300);
const ENABLED = String(process.env.ANALYTICS_CACHE_ENABLED || 'true') === 'true';

const cacheStore = new Map();

function pruneExpired() {
  const now = Date.now();
  for (const [key, value] of cacheStore.entries()) {
    if (value.expiresAt <= now) cacheStore.delete(key);
  }
}

function getCacheKey(reportName, filters = {}, userScope = {}) {
  return JSON.stringify({
    reportName,
    filters,
    role: userScope.role || 'anonymous',
    departmentCode: userScope.departmentCode || null,
    includePii: Boolean(userScope.includePii)
  });
}

function get(reportName, filters = {}, userScope = {}) {
  if (!ENABLED) return null;
  pruneExpired();
  const key = getCacheKey(reportName, filters, userScope);
  const item = cacheStore.get(key);
  if (!item) return null;
  return item.value;
}

function set(reportName, filters = {}, userScope = {}, data, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!ENABLED) return data;
  const key = getCacheKey(reportName, filters, userScope);
  cacheStore.set(key, {
    value: data,
    expiresAt: Date.now() + Number(ttlSeconds || DEFAULT_TTL_SECONDS) * 1000
  });
  return data;
}

function invalidate(pattern = '') {
  if (!pattern) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.includes(pattern)) cacheStore.delete(key);
  }
}

async function getOrSet(reportName, filters = {}, userScope = {}, loader, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const cached = get(reportName, filters, userScope);
  if (cached !== null) return { data: cached, hit: true, ttlSeconds: Number(ttlSeconds || DEFAULT_TTL_SECONDS) };
  const data = await loader();
  set(reportName, filters, userScope, data, ttlSeconds);
  return { data, hit: false, ttlSeconds: Number(ttlSeconds || DEFAULT_TTL_SECONDS) };
}

module.exports = {
  getCacheKey,
  get,
  set,
  invalidate,
  getOrSet
};
