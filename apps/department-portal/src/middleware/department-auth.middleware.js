const { redirectForRole, loginPathWithNext } = require('../../../../web/src/utils/navigation');

function requireDepartmentRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      req.flash('error', 'Please sign in to continue.');
      return res.redirect(loginPathWithNext(req.originalUrl));
    }
    const role = req.user.primaryRole || req.user.role;
    if (!roles.includes(role) && role !== 'admin') {
      req.flash('error', 'Your account has been redirected to the correct workspace.');
      return res.redirect(redirectForRole(role));
    }
    return next();
  };
}

module.exports = { requireDepartmentRoles };
