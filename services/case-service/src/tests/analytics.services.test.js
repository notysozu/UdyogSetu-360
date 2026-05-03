const test = require('node:test');
const assert = require('node:assert/strict');

const cache = require('../services/analytics-cache.service');
const bottleneck = require('../services/bottleneck-detection.service');
const defects = require('../services/document-defect-analytics.service');

test('analytics cache key includes role and pii scope', () => {
  const a = cache.getCacheKey('overview', {}, { role: 'admin', includePii: true });
  const b = cache.getCacheKey('overview', {}, { role: 'auditor', includePii: false });
  assert.notEqual(a, b);
});

test('bottleneck score computed in 0-100 range', () => {
  const score = bottleneck.buildScore({
    averageWaitHours: 500,
    queueDepth: 400,
    slaBreachCount: 50,
    trendDirection: 'up',
    severity: 'critical'
  });
  assert.ok(score >= 0 && score <= 100);
});

test('document defect normalizer maps unknown to other', () => {
  assert.equal(defects.normalizeCategory('unexpected defect text'), 'other');
});
