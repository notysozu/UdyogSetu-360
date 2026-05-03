const USER_ROLES = Object.freeze({
  INVESTOR: 'investor',
  DEPARTMENT_OFFICER: 'department_officer',
  DEPARTMENT_SUPERVISOR: 'department_supervisor',
  NODAL_OFFICER: 'nodal_officer',
  ADMIN: 'admin',
  AUDITOR: 'auditor',
  SYSTEM: 'system'
});

const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));

module.exports = { USER_ROLES, USER_ROLE_VALUES };
