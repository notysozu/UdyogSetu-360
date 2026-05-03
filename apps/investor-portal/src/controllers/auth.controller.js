const authService = require('../../../../web/src/services/authService');
const { safeNextPath, redirectForRole, roleCanAccessPath } = require('../../../../web/src/utils/navigation');

const ACCESS_COOKIE = 'us360_access_token';
const REFRESH_COOKIE = 'us360_refresh_token';

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: process.env.AUTH_COOKIE_SAME_SITE || 'lax',
    secure: String(process.env.AUTH_COOKIE_SECURE || 'false') === 'true',
    maxAge: Number(process.env.AUTH_SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 8),
    path: '/'
  };
}

function requestContext(req) {
  return {
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
    existingSessionId: req.sessionID,
    user: req.user || null
  };
}

function showLogin(req, res) {
  if (req.user) return res.redirect(redirectForRole(req.user.primaryRole || req.user.role));
  return res.render('auth/login', {
    title: 'Investor Sign In',
    next: safeNextPath(req.query.next, ''),
    values: { email: '' }
  });
}

async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) {
    req.flash('error', 'Email and password are required.');
    return res.redirect('/auth/login');
  }
  try {
    const result = await authService.authenticateLocalUser(email, password, requestContext(req));
    req.session.user = result.sessionUser;
    res.cookie(ACCESS_COOKIE, result.accessToken, authCookieOptions());
    res.cookie(REFRESH_COOKIE, result.refreshToken, authCookieOptions());
    const requestedNext = safeNextPath(req.body.next, null);
    const role = result.sessionUser.primaryRole || result.sessionUser.role;
    const next = requestedNext && roleCanAccessPath(role, requestedNext) ? requestedNext : redirectForRole(role);
    return res.redirect(next);
  } catch (error) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/auth/login');
  }
}

async function logout(req, res) {
  const sessionId = req.user?.sessionId || req.session?.user?.sessionId || null;
  await authService.logout(req.user || req.session?.user || null, sessionId, requestContext(req)).catch(() => {});
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}

module.exports = {
  showLogin,
  login,
  logout
};
