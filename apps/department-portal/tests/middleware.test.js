const test = require('node:test');
const assert = require('node:assert/strict');
const { requireDepartmentRoles } = require('../src/middleware/department-auth.middleware');

test('department auth redirects anonymous users to login', () => {
  let redirectedTo = null;
  const req = {
    user: null,
    originalUrl: '/department',
    flash() {}
  };
  const res = {
    redirect(url) {
      redirectedTo = url;
    }
  };
  requireDepartmentRoles('department_officer')(req, res, () => {});
  assert.equal(redirectedTo.startsWith('/auth/login'), true);
});

test('department auth redirects wrong role to their own dashboard', () => {
  let redirectedTo = null;
  const req = {
    user: { role: 'investor', primaryRole: 'investor' },
    originalUrl: '/department/tasks',
    flash() {}
  };
  const res = {
    redirect(url) {
      redirectedTo = url;
    }
  };
  requireDepartmentRoles('department_officer')(req, res, () => {});
  assert.equal(redirectedTo, '/dashboard');
});
