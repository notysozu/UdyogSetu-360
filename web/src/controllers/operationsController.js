const Case = require('../models/Case');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const { audit } = require('../services/auditLogService');
const { AUDIT_ACTIONS } = require('../../../packages/shared/src');

async function nodalDashboard(req, res) {
  const cases = await Case.find().sort({ updatedAt: -1 }).limit(20).populate('approvals.department');
  return res.render('pages/operations-dashboard', {
    title: 'Nodal Dashboard',
    heading: 'Nodal Dashboard',
    description: 'Cross-department coordination, escalations and SLA monitoring.',
    cases
  });
}

async function supervisorDashboard(req, res) {
  const cases = await Case.find().sort({ updatedAt: -1 }).limit(20).populate('approvals.department');
  return res.render('pages/operations-dashboard', {
    title: 'Supervisor Dashboard',
    heading: 'Supervisor Dashboard',
    description: 'Department assignments, workload balancing and review oversight.',
    cases
  });
}

async function internalHealth(_req, res) {
  return res.json({
    ok: true,
    service: 'udyogsetu-web-internal',
    time: new Date().toISOString()
  });
}

async function adminUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 }).limit(50).populate('department');
  return res.render('pages/admin-users', {
    title: 'User Management',
    users
  });
}

async function adminUserDetail(req, res, next) {
  const user = await User.findById(req.params.id).populate('department');
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    return next(error);
  }
  return res.render('pages/admin-user-detail', {
    title: `User ${user.name}`,
    managedUser: user
  });
}

async function updateUserRoles(req, res, next) {
  const user = await User.findById(req.params.id);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    return next(error);
  }
  const previousRole = user.primaryRole || user.role;
  const nextRole = String(req.body.primaryRole || '').trim();
  user.role = nextRole;
  user.primaryRole = nextRole;
  user.roles = [nextRole];
  user.permissions = [];
  await user.save();
  await audit(AUDIT_ACTIONS.USER_ROLE_CHANGED, 'user', user._id, {
    user: req.user,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  }, {
    before: { role: previousRole },
    after: { role: nextRole }
  });
  req.flash('success', 'User role updated.');
  return res.redirect(`/admin/users/${user.id}`);
}

async function updateUserStatus(req, res, next) {
  const user = await User.findById(req.params.id);
  if (!user) {
    const error = new Error('User not found.');
    error.status = 404;
    return next(error);
  }
  const previousStatus = user.status;
  user.status = String(req.body.status || user.status);
  await user.save();
  await audit(AUDIT_ACTIONS.UPDATED, 'user', user._id, {
    user: req.user,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  }, {
    before: { status: previousStatus },
    after: { status: user.status }
  });
  req.flash('success', 'User status updated.');
  return res.redirect(`/admin/users/${user.id}`);
}

async function adminOperations(req, res) {
  const activeSessions = await UserSession.countDocuments({ isActive: true });
  return res.render('pages/admin-operations', {
    title: 'Operations',
    activeSessions
  });
}

module.exports = {
  nodalDashboard,
  supervisorDashboard,
  internalHealth,
  adminUsers,
  adminUserDetail,
  updateUserRoles,
  updateUserStatus,
  adminOperations
};
