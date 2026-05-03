const User = require('../models/User');
const { env } = require('../config/env');
const authService = require('../services/authService');
const sessionService = require('../services/sessionService');
const { buildSsoStartUrl, isOidcEnabled, mapOidcClaimsToLocalUser } = require('../services/oidcService');
const { safeNextPath, redirectForRole, roleCanAccessPath } = require('../utils/navigation');
const { validateLogin, validateRegistration } = require('../middleware/validation.middleware');
const { success, failure } = require('../utils/response');
const { audit } = require('../services/auditLogService');
const { AUDIT_ACTIONS } = require('../../../packages/shared/src');

const ACCESS_COOKIE = 'us360_access_token';
const REFRESH_COOKIE = 'us360_refresh_token';

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: env.AUTH_COOKIE_SAME_SITE,
    secure: env.AUTH_COOKIE_SECURE,
    maxAge: env.AUTH_SESSION_MAX_AGE_MS,
    path: '/'
  };
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { path: '/' });
  res.clearCookie(REFRESH_COOKIE, { path: '/' });
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
  return res.render('pages/login', {
    title: 'Sign in',
    next: safeNextPath(req.query.next, ''),
    values: { email: '' }
  });
}

function showRegister(req, res) {
  if (req.user) return res.redirect(redirectForRole(req.user.primaryRole || req.user.role));
  return res.render('pages/register', { title: 'Create Investor Account', values: {}, errors: [] });
}

function showForgotPassword(req, res) {
  return res.render('pages/forgot-password', {
    title: 'Forgot Password',
    values: { email: '' },
    errors: []
  });
}

function showResetPassword(req, res) {
  return res.render('pages/reset-password', {
    title: 'Reset Password',
    token: req.params.token,
    errors: []
  });
}

async function registerInvestor(req, res) {
  const { errors, values } = validateRegistration(req.body);
  const existingUser = values.email ? await User.findOne({ email: values.email }) : null;
  if (existingUser) errors.push('An account already exists for this email.');

  if (errors.length) {
    return res.status(400).render('pages/register', {
      title: 'Create Investor Account',
      values,
      errors
    });
  }

  await authService.registerInvestor(values, requestContext(req));
  req.flash('success', 'Investor account created. Please sign in to continue.');
  return res.redirect('/auth/login');
}

async function login(req, res) {
  const { errors, values } = validateLogin(req.body);
  if (errors.length) {
    req.flash('error', errors.join(' '));
    return res.redirect('/auth/login');
  }

  try {
    const result = await authService.authenticateLocalUser(values.email, values.password, requestContext(req));
    if ((result.sessionUser.primaryRole || result.sessionUser.role) === 'system') {
      req.flash('error', 'System accounts cannot use web login.');
      return res.redirect('/auth/login');
    }

    req.session.user = result.sessionUser;
    res.cookie(ACCESS_COOKIE, result.accessToken, authCookieOptions());
    res.cookie(REFRESH_COOKIE, result.refreshToken, authCookieOptions());
    req.flash('success', `Welcome back, ${result.user.name}.`);
    const requestedNext = safeNextPath(req.body.next, null);
    const role = result.sessionUser.primaryRole || result.sessionUser.role;
    const next = requestedNext && roleCanAccessPath(role, requestedNext)
      ? requestedNext
      : redirectForRole(role);
    return res.redirect(next);
  } catch (error) {
    req.flash('error', error.message === 'Invalid credentials.' ? 'Invalid email or password.' : error.message);
    const next = safeNextPath(req.body.next, '');
    return res.redirect(next ? `/auth/login?next=${encodeURIComponent(next)}` : '/auth/login');
  }
}

async function logout(req, res) {
  const sessionId = req.user?.sessionId || req.session?.user?.sessionId || null;
  await authService.logout(req.user || req.session?.user || null, sessionId, requestContext(req));
  clearAuthCookies(res);
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}

async function apiToken(req, res) {
  try {
    const { errors, values } = validateLogin(req.body);
    if (errors.length) {
      return failure(res, 400, 'INVALID_CREDENTIALS', errors.join(' '));
    }
    const result = await authService.authenticateLocalUser(values.email, values.password, requestContext(req));
    return success(res, {
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.sessionUser
    });
  } catch (error) {
    return failure(res, error.status || 401, error.code || 'INVALID_CREDENTIALS', error.message);
  }
}

async function refreshToken(req, res) {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
    if (!refreshToken) {
      return failure(res, 401, 'TOKEN_INVALID', 'Refresh token is required.');
    }
    const result = await authService.refreshSession(refreshToken, requestContext(req));
    req.session.user = result.sessionUser;
    res.cookie(ACCESS_COOKIE, result.accessToken, authCookieOptions());
    res.cookie(REFRESH_COOKIE, result.refreshToken, authCookieOptions());
    return success(res, { user: result.sessionUser });
  } catch (error) {
    return failure(res, error.status || 401, error.code || 'TOKEN_INVALID', error.message);
  }
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const result = await authService.requestPasswordReset(email, requestContext(req));
  const resetUrl = result.token ? `/auth/reset-password/${result.token}` : null;
  if (env.NODE_ENV !== 'production' && resetUrl) {
    console.log(`Password reset URL for ${email}: ${resetUrl}`);
  }
  req.flash('success', 'If the account exists, a password reset link has been generated.');
  if (req.originalUrl.startsWith('/api/')) {
    return success(res, env.NODE_ENV !== 'production' && resetUrl ? { resetUrl } : {});
  }
  return res.redirect('/auth/forgot-password');
}

async function resetPassword(req, res) {
  try {
    await authService.resetPassword(req.params.token, String(req.body.password || ''), requestContext(req));
    req.flash('success', 'Password changed successfully. Please sign in.');
    return res.redirect('/auth/login');
  } catch (error) {
    return res.status(400).render('pages/reset-password', {
      title: 'Reset Password',
      token: req.params.token,
      errors: [error.message]
    });
  }
}

async function sendEmailVerification(req, res) {
  const userId = req.user?.id || req.body.userId;
  const result = await authService.sendEmailVerification(userId, requestContext(req));
  const verifyUrl = `/auth/verify-email/${result.token}`;
  if (env.NODE_ENV !== 'production') {
    console.log(`Email verification URL for ${result.user.email}: ${verifyUrl}`);
  }
  req.flash('success', 'Verification instructions have been generated.');
  if (req.originalUrl.startsWith('/api/')) {
    return success(res, env.NODE_ENV !== 'production' ? { verifyUrl } : {});
  }
  return res.redirect(req.get('referer') || '/dashboard');
}

async function verifyEmail(req, res) {
  try {
    await authService.verifyEmailToken(req.params.token, requestContext(req));
    req.flash('success', 'Email verified successfully.');
  } catch (error) {
    req.flash('error', error.message);
  }
  return res.redirect('/auth/login');
}

async function sendOtp(req, res) {
  const userId = req.user?.id || req.body.userId;
  const result = await authService.sendOtp(userId, requestContext(req));
  if (env.NODE_ENV !== 'production') {
    console.log(`OTP for ${result.user.email}: ${result.otp}`);
  }
  return success(res, env.NODE_ENV !== 'production' ? { otp: result.otp } : {});
}

async function verifyOtp(req, res) {
  try {
    await authService.verifyOtp(req.user?.id || req.body.userId, String(req.body.otp || ''), requestContext(req));
    req.flash('success', 'OTP verified successfully.');
    return success(res, {});
  } catch (error) {
    return failure(res, error.status || 400, error.code || 'OTP_INVALID', error.message);
  }
}

async function showSessions(req, res) {
  const sessions = await sessionService.listSessionsForUser(req.user.id);
  return res.render('pages/sessions', {
    title: 'Active Sessions',
    sessions
  });
}

async function revokeSession(req, res) {
  await sessionService.revokeSession(req.params.sessionId, 'user_revoked');
  await audit(AUDIT_ACTIONS.AUTH_SESSION_REVOKED, 'session', req.params.sessionId, requestContext(req), {
    metadata: { owner: req.user.id }
  });
  req.flash('success', 'Session revoked.');
  return res.redirect('/auth/sessions');
}

async function logoutAll(req, res) {
  await sessionService.revokeAllSessions(req.user.id, 'logout_all');
  await audit(AUDIT_ACTIONS.AUTH_LOGOUT, 'user', req.user.id, requestContext(req), {
    metadata: { scope: 'all_sessions' }
  });
  clearAuthCookies(res);
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
}

async function ssoStart(req, res) {
  await audit(AUDIT_ACTIONS.AUTH_SSO_STARTED, 'auth', 'sso', requestContext(req));
  if (!isOidcEnabled()) {
    req.flash('error', 'SSO not configured.');
    return res.redirect('/auth/login');
  }
  return res.redirect(buildSsoStartUrl(safeNextPath(req.query.next, '/')));
}

async function ssoCallback(req, res) {
  if (!isOidcEnabled()) {
    return failure(res, 503, 'SSO_NOT_CONFIGURED', 'SSO not configured.');
  }
  const localUser = mapOidcClaimsToLocalUser(req.query);
  await audit(AUDIT_ACTIONS.AUTH_SSO_COMPLETED, 'auth', 'sso', requestContext(req), {
    metadata: localUser
  });
  req.flash('success', 'SSO callback received. Complete provider integration to finish login.');
  return res.redirect('/auth/login');
}

module.exports = {
  showLogin,
  showRegister,
  login,
  register: registerInvestor,
  registerInvestor,
  logout,
  apiToken,
  refreshToken,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  sendOtp,
  verifyOtp,
  showSessions,
  revokeSession,
  logoutAll,
  ssoStart,
  ssoCallback,
  redirectForRole
};
