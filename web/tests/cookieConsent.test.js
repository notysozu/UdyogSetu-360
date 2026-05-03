const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildCookieConsent,
  parseCookieConsent
} = require('../src/utils/cookieConsent');

test('buildCookieConsent enables optional categories when accepting all cookies', () => {
  const consent = buildCookieConsent('accept_all');

  assert.equal(consent.necessary, true);
  assert.equal(consent.analytics, true);
  assert.equal(consent.preferences, true);
  assert.equal(consent.choice, 'accept_all');
});

test('buildCookieConsent disables optional categories when declining optional cookies', () => {
  const consent = buildCookieConsent('decline_optional');

  assert.equal(consent.necessary, true);
  assert.equal(consent.analytics, false);
  assert.equal(consent.preferences, false);
  assert.equal(consent.choice, 'decline_optional');
});

test('parseCookieConsent rejects malformed and outdated values', () => {
  assert.equal(parseCookieConsent('not-json'), null);
  assert.equal(parseCookieConsent(JSON.stringify({ version: 0, analytics: true })), null);
});

test('parseCookieConsent normalizes a saved customized consent value', () => {
  const saved = buildCookieConsent('customize', { analytics: 'on', preferences: false });
  const parsed = parseCookieConsent(JSON.stringify(saved));

  assert.equal(parsed.necessary, true);
  assert.equal(parsed.analytics, true);
  assert.equal(parsed.preferences, false);
  assert.equal(parsed.choice, 'customize');
});
