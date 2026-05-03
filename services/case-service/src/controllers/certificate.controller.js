const certificateService = require('../services/certificate.service');

function contextFromRequest(req) {
  return {
    user: {
      _id: req.get('x-user-id') || null,
      id: req.get('x-user-id') || null,
      primaryRole: req.get('x-user-role') || null,
      role: req.get('x-user-role') || null
    },
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function create(req, res, next) {
  try {
    const result = await certificateService.storeCertificate(req.body || {}, req.file, contextFromRequest(req));
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getByNumber(req, res, next) {
  try {
    const result = await certificateService.getCertificateByNumber(req.params.certificateNumber, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function revoke(req, res, next) {
  try {
    const result = await certificateService.revokeCertificate(req.params.certificateNumber, req.body.reason, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function verifyPublic(req, res, next) {
  try {
    const result = await certificateService.verifyCertificate({ verificationToken: req.params.verificationToken }, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  getByNumber,
  revoke,
  verifyPublic
};
