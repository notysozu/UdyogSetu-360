const test = require('node:test');
const assert = require('node:assert/strict');
const { roleCanAccessPath, redirectForRole } = require('../src/utils/navigation');
const { signAccessToken, verifyAccessToken, signServiceToken, verifyServiceToken } = require('../src/services/tokenService');
const { createPasswordReset } = require('../src/services/verificationService');
const { hashToken } = require('../src/services/passwordService');
const { canAccessTask } = require('../src/services/abacService');
const { hasPermission } = require('../src/services/permissionService');

test('investor redirect points to dashboard', () => {
  assert.equal(redirectForRole('investor'), '/dashboard');
});

test('investor cannot access admin next path', () => {
  assert.equal(roleCanAccessPath('investor', '/admin'), false);
});

test('department officer can access own department task', () => {
  assert.equal(
    canAccessTask(
      { role: 'department_officer', department: 'dep-1' },
      { department: 'dep-1' }
    ),
    true
  );
});

test('department officer cannot access another department task', () => {
  assert.equal(
    canAccessTask(
      { role: 'department_officer', department: 'dep-1' },
      { department: 'dep-2' }
    ),
    false
  );
});

test('admin has user.read permission through role mapping', () => {
  assert.equal(hasPermission({ role: 'admin', permissions: [] }, 'user.read'), true);
});

test('access token roundtrip works', () => {
  const token = signAccessToken(
    {
      _id: '507f1f77bcf86cd799439011',
      email: 'investor@udyogsetu.local',
      role: 'investor',
      roles: ['investor'],
      primaryRole: 'investor',
      permissions: ['case.read_own']
    },
    { sessionId: 'session-123' }
  );
  const payload = verifyAccessToken(token);
  assert.equal(payload.primaryRole, 'investor');
  assert.equal(payload.sessionId, 'session-123');
});

test('service token roundtrip works', () => {
  const token = signServiceToken('gateway');
  const payload = verifyServiceToken(token);
  assert.equal(payload.serviceName, 'gateway');
  assert.equal(payload.tokenType, 'service');
});

test('password reset token is hashed on user object', () => {
  const user = {};
  const token = createPasswordReset(user);
  assert.equal(typeof token, 'string');
  assert.equal(user.passwordResetTokenHash, hashToken(token));
});
