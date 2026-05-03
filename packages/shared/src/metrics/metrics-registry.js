const counters = new Map();
const gauges = new Map();
const histograms = new Map();

function incCounter(name, value = 1, labels = {}) {
  const key = `${name}:${JSON.stringify(labels)}`;
  counters.set(key, (counters.get(key) || 0) + value);
}

function setGauge(name, value, labels = {}) {
  const key = `${name}:${JSON.stringify(labels)}`;
  gauges.set(key, value);
}

function observeHistogram(name, value, labels = {}) {
  const key = `${name}:${JSON.stringify(labels)}`;
  const entry = histograms.get(key) || { count: 0, sum: 0, min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY };
  entry.count += 1;
  entry.sum += Number(value) || 0;
  entry.min = Math.min(entry.min, Number(value) || 0);
  entry.max = Math.max(entry.max, Number(value) || 0);
  histograms.set(key, entry);
}

function snapshot() {
  return {
    counters: Object.fromEntries(counters.entries()),
    gauges: Object.fromEntries(gauges.entries()),
    histograms: Object.fromEntries(histograms.entries()),
    timestamp: new Date().toISOString()
  };
}

function toPrometheusText() {
  const lines = [];
  for (const [key, value] of counters.entries()) lines.push(`${key.replace(':', '_total ')} ${value}`);
  for (const [key, value] of gauges.entries()) lines.push(`${key.replace(':', '_gauge ')} ${value}`);
  for (const [key, value] of histograms.entries()) lines.push(`${key.replace(':', '_count ')} ${value.count}`);
  return `${lines.join('\n')}\n`;
}

module.exports = {
  incCounter,
  setGauge,
  observeHistogram,
  snapshot,
  toPrometheusText
};
