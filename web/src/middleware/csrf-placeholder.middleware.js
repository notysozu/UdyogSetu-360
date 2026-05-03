function csrfPlaceholder(req, res, next) {
  const token = req.session?.id || req.correlationId;
  res.locals.csrfToken = token;
  next();
}

module.exports = { csrfPlaceholder };
