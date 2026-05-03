const { ROLES } = require('../constants/roles');

function hasRole(user, roles = []) {
  if (!user) {
    return false;
  }
  return roles.includes(user.role);
}

function isInternalOperator(user) {
  return hasRole(user, [
    ROLES.DEPARTMENT_OFFICER,
    ROLES.NODAL_OFFICER,
    ROLES.SUPERVISOR,
    ROLES.ADMIN,
    ROLES.AUDITOR
  ]);
}

module.exports = { hasRole, isInternalOperator };
