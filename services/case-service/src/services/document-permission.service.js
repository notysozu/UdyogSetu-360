const { PERMISSIONS } = require('../../../../packages/shared/src');

function roles(user) {
  return user?.roles || [user?.primaryRole || user?.role].filter(Boolean);
}

function canViewDocument(user, documentDoc) {
  if (!user || !documentDoc || documentDoc.isDeleted) return false;
  const userRoles = roles(user);
  if (userRoles.includes('admin')) return true;
  if (userRoles.includes('auditor')) return true;
  if (documentDoc.visibility === 'public_verification') return true;
  if (documentDoc.ownerUserId && String(documentDoc.ownerUserId) === String(user.id || user._id)) return true;
  if (documentDoc.permissions?.allowedUserIds?.some((id) => String(id) === String(user.id || user._id))) return true;
  if (documentDoc.organisationId && String(documentDoc.organisationId) === String(user.organisationId)) return true;
  if (userRoles.includes('department_officer') || userRoles.includes('department_supervisor')) {
    return String(documentDoc.departmentCode || '') === String(user.departmentCode || user.departmentId || '');
  }
  if (userRoles.includes('nodal_officer')) return true;
  return false;
}

function canDownloadDocument(user, documentDoc) {
  return canViewDocument(user, documentDoc) && documentDoc.permissions?.isDownloadAllowed !== false && documentDoc.scan?.status !== 'infected';
}

function canUploadDocument(user, caseDoc, taskDoc) {
  const userRoles = roles(user);
  if (userRoles.includes('admin')) return true;
  if (userRoles.includes('investor')) {
    return String(caseDoc?.organisationId || '') === String(user.organisationId || '');
  }
  if (userRoles.includes('department_officer') || userRoles.includes('department_supervisor')) {
    return String(taskDoc?.departmentCode || '') === String(user.departmentCode || user.departmentId || '');
  }
  if (userRoles.includes('nodal_officer')) return true;
  return false;
}

function canVerifyDocument(user, documentDoc) {
  const userRoles = roles(user);
  if (userRoles.includes('admin')) return true;
  if (userRoles.includes('auditor')) return false;
  if (userRoles.includes('department_officer') || userRoles.includes('department_supervisor')) {
    return String(documentDoc.departmentCode || '') === String(user.departmentCode || user.departmentId || '');
  }
  if (userRoles.includes('nodal_officer')) return true;
  return false;
}

function canDeleteDocument(user, documentDoc) {
  const userRoles = roles(user);
  if (userRoles.includes('admin')) return true;
  if (userRoles.includes('investor')) {
    return String(documentDoc.ownerUserId || '') === String(user.id || user._id);
  }
  return false;
}

function canAccessCertificatePublic(documentDoc, token) {
  return Boolean(
    documentDoc?.certificate?.isCertificate &&
      documentDoc?.certificate?.verificationToken &&
      documentDoc.certificate.verificationToken === token &&
      documentDoc.status === 'verified'
  );
}

function assertCanViewDocument(user, documentDoc) {
  if (!canViewDocument(user, documentDoc)) {
    const error = new Error('You do not have permission to view this document.');
    error.statusCode = 403;
    throw error;
  }
}

function assertCanDownloadDocument(user, documentDoc) {
  if (!canDownloadDocument(user, documentDoc)) {
    const error = new Error('You do not have permission to download this document.');
    error.statusCode = 403;
    throw error;
  }
}

function assertCanUploadDocument(user, caseDoc, taskDoc) {
  if (!canUploadDocument(user, caseDoc, taskDoc)) {
    const error = new Error('You do not have permission to upload this document.');
    error.statusCode = 403;
    throw error;
  }
}

function assertCanVerifyDocument(user, documentDoc) {
  if (!canVerifyDocument(user, documentDoc)) {
    const error = new Error('You do not have permission to verify this document.');
    error.statusCode = 403;
    throw error;
  }
}

module.exports = {
  PERMISSIONS,
  canViewDocument,
  canDownloadDocument,
  canUploadDocument,
  canVerifyDocument,
  canDeleteDocument,
  canAccessCertificatePublic,
  assertCanViewDocument,
  assertCanDownloadDocument,
  assertCanUploadDocument,
  assertCanVerifyDocument
};
