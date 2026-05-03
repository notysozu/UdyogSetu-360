function responseEnvelopeMiddleware(req, res, next) {
  res.locals.apiVersion = req.context?.apiVersion || 'v1';
  next();
}

module.exports = { responseEnvelopeMiddleware };
