const test = require('node:test');
const assert = require('node:assert/strict');
const permissionService = require('../src/services/document-permission.service');

const baseDocument = {
  organisationId: 'org-1',
  ownerUserId: 'user-1',
  departmentCode: 'fire',
  visibility: 'private',
  status: 'uploaded',
  isDeleted: false,
  scan: { status: 'clean' },
  permissions: {
    isDownloadAllowed: true,
    allowedUserIds: [],
    allowedRoleCodes: [],
    allowedDepartmentCodes: ['fire']
  },
  certificate: {
    isCertificate: true,
    verificationToken: 'verify-token'
  }
};

test('investor can access own organisation document but not another organisation document', () => {
  const investor = { id: 'user-1', primaryRole: 'investor', organisationId: 'org-1' };
  const outsider = { id: 'user-2', primaryRole: 'investor', organisationId: 'org-2' };

  assert.equal(permissionService.canViewDocument(investor, baseDocument), true);
  assert.equal(permissionService.canViewDocument(outsider, baseDocument), false);
});

test('department officer can access own department task document', () => {
  const officer = { id: 'dept-1', primaryRole: 'department_officer', departmentCode: 'fire' };
  const otherOfficer = { id: 'dept-2', primaryRole: 'department_officer', departmentCode: 'power' };

  assert.equal(permissionService.canViewDocument(officer, baseDocument), true);
  assert.equal(permissionService.canViewDocument(otherOfficer, baseDocument), false);
});

test('auditor can view but not mutate verification state', () => {
  const auditor = { id: 'aud-1', primaryRole: 'auditor' };

  assert.equal(permissionService.canViewDocument(auditor, baseDocument), true);
  assert.equal(permissionService.canVerifyDocument(auditor, baseDocument), false);
});

test('public certificate verification requires valid token and verified status', () => {
  assert.equal(
    permissionService.canAccessCertificatePublic(
      { ...baseDocument, status: 'verified' },
      'verify-token'
    ),
    true
  );
  assert.equal(permissionService.canAccessCertificatePublic(baseDocument, 'wrong-token'), false);
});
