const { getCookieConsent } = require('../../../../web/src/utils/cookieConsent');
const viewHelpers = require('../helpers/view.helpers');
const { buildTranslator, getCurrentLocale } = require('../helpers/i18n.helpers');

function portalLocals(req, res, next) {
  const locale = getCurrentLocale(req);
  const t = buildTranslator(locale);
  req.locale = locale;
  req.t = t;
  req.user = req.user || req.session?.user || null;
  res.locals.user = req.user;
  res.locals.currentUser = req.user;
  res.locals.isAuthenticated = Boolean(req.user);
  res.locals.currentRole = req.user?.primaryRole || req.user?.role || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  res.locals.currentLocale = locale;
  res.locals.selectedLanguage = locale;
  res.locals.t = t;
  res.locals.view = viewHelpers;
  res.locals.cookieConsent = getCookieConsent(req);
  res.locals.accessibilityEnabled = true;
  res.locals.year = new Date().getFullYear();
  next();
}

module.exports = { portalLocals };
