const { redirectForRole, loginPathWithNext } = require('../../../../web/src/utils/navigation');

function requireInvestorAuth(req, res, next) {
  const currentRole = req.user?.primaryRole || req.user?.role;
  if (!req.user) {
    req.flash('error', 'Please sign in to continue.');
    return res.redirect(loginPathWithNext(req.originalUrl));
  }
  if (currentRole !== 'investor') {
    req.flash('error', 'Your account has been redirected to the appropriate workspace.');
    return res.redirect(redirectForRole(currentRole));
  }
  return next();
}

module.exports = { requireInvestorAuth };
