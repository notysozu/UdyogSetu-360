const User = require('../models/User');
const { verifyAccessToken } = require('../services/tokenService');

async function attachCurrentUser(req, res, next) {
  const cookieToken = req.cookies?.us360_access_token || null;
  const bearer = req.get('authorization') || '';
  const bearerToken = bearer.startsWith('Bearer ') ? bearer.slice(7) : null;
  const token = bearerToken || cookieToken;

  let sessionUser = req.session.user || null;
  let hydratedUser = null;

  try {
    if (token) {
      const payload = verifyAccessToken(token);
      hydratedUser = await User.findById(payload.sub).populate('department');
      if (hydratedUser) {
        sessionUser = {
          id: hydratedUser._id.toString(),
          name: hydratedUser.name,
          email: hydratedUser.email,
          role: hydratedUser.role,
          roles: hydratedUser.roles,
          primaryRole: hydratedUser.primaryRole,
          permissions: hydratedUser.permissions,
          organisation: hydratedUser.organisation,
          organisationId: hydratedUser.organisationId?.toString?.() || null,
          department: hydratedUser.department?._id?.toString?.() || hydratedUser.department?.toString?.() || null,
          departmentId: hydratedUser.departmentId?.toString?.() || hydratedUser.department?.toString?.() || null,
          departmentCode: hydratedUser.department?.code || null,
          investorId: hydratedUser.investorId?.toString?.() || null,
          sessionId: payload.sessionId || req.session.user?.sessionId || null
        };
      }
    }
  } catch (_error) {
    hydratedUser = null;
  }

  if (!hydratedUser && sessionUser?.id) {
    hydratedUser = await User.findById(sessionUser.id).populate('department');
  }

  req.user = sessionUser || null;
  req.userDoc = hydratedUser || null;
  if (req.session) {
    req.session.user = sessionUser || req.session.user || null;
  }
  next();
}

module.exports = { attachCurrentUser };
