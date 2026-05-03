const { isAdminLike } = require('./permissionService');

function getRole(user) {
  return user?.primaryRole || user?.role || null;
}

function canAccessOrganisation(user, organisation) {
  if (!user) return false;
  if (isAdminLike(user) || getRole(user) === 'admin') return true;
  const organisationId = organisation?._id?.toString?.() || organisation?.organisationId?.toString?.() || organisation?.toString?.();
  return Boolean(organisationId && user.organisationId && String(user.organisationId) === String(organisationId));
}

function canAccessCase(user, caseDoc) {
  if (!user || !caseDoc) return false;
  const role = getRole(user);
  if (['admin', 'auditor', 'nodal_officer'].includes(role)) return true;
  if (role === 'investor') {
    return String(caseDoc.applicantUserId || caseDoc.createdBy) === String(user.id || user._id)
      || (user.organisationId && String(caseDoc.organisationId) === String(user.organisationId))
      || (user.investorId && String(caseDoc.investorId) === String(user.investorId));
  }
  if (['department_officer', 'department_supervisor'].includes(role)) {
    const departmentId = user.departmentId || user.department;
    return Array.isArray(caseDoc.approvals)
      ? caseDoc.approvals.some((approval) => String(approval.department) === String(departmentId))
      : caseDoc.requiredDepartments?.some((department) => department.departmentCode === user.departmentCode);
  }
  return false;
}

function canModifyCase(user, caseDoc) {
  const role = getRole(user);
  if (role === 'admin') return true;
  if (role === 'investor') return canAccessCase(user, caseDoc);
  return ['department_officer', 'department_supervisor', 'nodal_officer'].includes(role) && canAccessCase(user, caseDoc);
}

function canAccessTask(user, taskDoc) {
  if (!user || !taskDoc) return false;
  const role = getRole(user);
  if (['admin', 'auditor', 'nodal_officer'].includes(role)) return true;
  if (role === 'investor') return false;
  const userDepartmentId = user.departmentId || user.department;
  const taskDepartmentId = taskDoc.departmentId || taskDoc.department;
  const departmentIdMatch = Boolean(userDepartmentId && taskDepartmentId)
    && String(taskDepartmentId) === String(userDepartmentId);
  const departmentCodeMatch = Boolean(taskDoc.departmentCode && user.departmentCode)
    && taskDoc.departmentCode === user.departmentCode;
  return departmentIdMatch || departmentCodeMatch;
}

function canAssignTask(user, taskDoc) {
  const role = getRole(user);
  if (role === 'admin') return true;
  if (role !== 'department_supervisor') return false;
  return canAccessTask(user, taskDoc);
}

function canViewAudit(user) {
  return Boolean(user && ['admin', 'auditor'].includes(getRole(user)));
}

function canManageIntegration(user) {
  return Boolean(user && getRole(user) === 'admin');
}

function assertCanAccessCase(user, caseDoc) {
  if (!canAccessCase(user, caseDoc)) {
    const error = new Error('Access denied for case.');
    error.status = 403;
    throw error;
  }
}

function assertCanAccessTask(user, taskDoc) {
  if (!canAccessTask(user, taskDoc)) {
    const error = new Error('Access denied for task.');
    error.status = 403;
    throw error;
  }
}

module.exports = {
  canAccessCase,
  canModifyCase,
  canAccessTask,
  canAssignTask,
  canViewAudit,
  canManageIntegration,
  canAccessOrganisation,
  assertCanAccessCase,
  assertCanAccessTask
};
