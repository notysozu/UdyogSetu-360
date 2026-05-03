const { getCookieConsent } = require('../utils/cookieConsent');

function attachLocals(req, res, next) {
  const cookieConsent = getCookieConsent(req);
  const shouldReadFlash = req.accepts(['html', 'json']) !== 'json';
  const currentUser = req.session.user || null;

  req.user = currentUser;
  res.locals.user = currentUser;
  res.locals.currentUser = currentUser;
  res.locals.isAuthenticated = Boolean(currentUser);
  res.locals.currentRole = currentUser?.primaryRole || currentUser?.role || null;
  res.locals.permissions = currentUser?.permissions || [];
  res.locals.success = shouldReadFlash ? req.flash('success') : [];
  res.locals.error = shouldReadFlash ? req.flash('error') : [];
  res.locals.correlationId = req.correlationId;
  res.locals.title = 'UdyogSetu 360';
  res.locals.cookieConsent = cookieConsent;
  res.locals.hasCookieConsent = Boolean(cookieConsent);
  res.locals.selectedLanguage = req.cookies?.us360_language || 'en';
  res.locals.accessibilityEnabled = true;
  res.locals.currentPath = req.path;
  next();
}

module.exports = { attachLocals };
