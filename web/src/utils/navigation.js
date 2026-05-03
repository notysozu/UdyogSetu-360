function roleCanAccessPath(role, path) {
  if (!path) return true;
  if (role === 'admin') return true;
  if (role === 'auditor') return path.startsWith('/audit') || path.startsWith('/auth') || path === '/';
  if (role === 'nodal_officer') return path.startsWith('/nodal') || path.startsWith('/department') || path.startsWith('/auth') || path === '/';
  if (role === 'department_supervisor' || role === 'supervisor') return path.startsWith('/supervisor') || path.startsWith('/department') || path.startsWith('/auth') || path === '/';
  if (role === 'department_officer') return path.startsWith('/department') || path.startsWith('/auth') || path === '/';
  if (role === 'investor') return ['/dashboard', '/cases', '/grievances', '/notifications', '/auth'].some((prefix) => path.startsWith(prefix)) || path === '/';
  if (role === 'system') return path.startsWith('/internal');
  return false;
}

function redirectForRole(role) {
  if (role === 'investor') return '/dashboard';
  if (role === 'department_officer') return '/department';
  if (role === 'department_supervisor' || role === 'supervisor') return '/supervisor';
  if (role === 'nodal_officer') return '/nodal';
  if (role === 'auditor') return '/audit';
  if (role === 'admin') return '/admin';
  if (role === 'system') return '/internal/health';
  return '/dashboard';
}

function isSafeLocalPath(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !value.includes('://')
    && !value.includes('\\');
}

function safeNextPath(value, fallback = null) {
  return isSafeLocalPath(value) ? value : fallback;
}

function loginPathWithNext(nextPath) {
  const safeNext = safeNextPath(nextPath, '/');
  return `/auth/login?next=${encodeURIComponent(safeNext)}`;
}

module.exports = {
  isSafeLocalPath,
  loginPathWithNext,
  redirectForRole,
  safeNextPath,
  roleCanAccessPath
};
