const test = require('node:test');
const assert = require('node:assert/strict');
const { requireInvestorAuth } = require('../src/middleware/investor-auth.middleware');

test('investor auth redirects anonymous users to login', () => {
  let redirectedTo = null;
  const req = {
    user: null,
    originalUrl: '/dashboard',
    flash() {}
  };
  const res = {
    redirect(url) {
      redirectedTo = url;
    }
  };
  requireInvestorAuth(req, res, () => {});
  assert.equal(redirectedTo.startsWith('/auth/login'), true);
});
