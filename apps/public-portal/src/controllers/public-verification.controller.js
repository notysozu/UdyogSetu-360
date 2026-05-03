const verificationService = require('../services/public-verification.service');

function contextFromRequest(req) {
  return {
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

function renderForm(res, values = {}, result = null, statusCode = 200) {
  return res.status(statusCode).render('verification/verify-form', {
    title: 'Verify Certificate or Approval',
    values,
    result
  });
}

async function showForm(_req, res) {
  return renderForm(res);
}

async function submitVerification(req, res) {
  try {
    const result = await verificationService.verifyCertificate(req.body || {}, contextFromRequest(req));
    res.setHeader('Cache-Control', 'no-store');
    if (!result.verified) {
      return res.status(result.status === 'not_found' ? 404 : 400).render('verification/verify-invalid', {
        title: 'Verification Result',
        result
      });
    }
    return res.render('verification/verify-result', { title: 'Verification Result', result });
  } catch (error) {
    return renderForm(res, req.body || {}, { status: 'invalid', publicMessage: error.message }, 400);
  }
}

async function verifyByToken(req, res) {
  const result = await verificationService.verifyByToken(req.params.verificationToken, contextFromRequest(req));
  res.setHeader('Cache-Control', 'no-store');
  if (!result.verified) {
    return res.status(result.status === 'not_found' ? 404 : 400).render('verification/verify-invalid', {
      title: 'Verification Result',
      result
    });
  }
  return res.render('verification/verify-result', { title: 'Verification Result', result });
}

async function showVerificationResult(req, res) {
  const result = await verificationService.getVerificationResult(req.params.verificationId);
  if (!result) {
    return res.status(404).render('verification/verify-invalid', {
      title: 'Verification Result Not Found',
      result: { status: 'not_found', publicMessage: 'No matching public verification result was found.' }
    });
  }
  if (!result.verified) {
    return res.status(result.status === 'not_found' ? 404 : 400).render('verification/verify-invalid', { title: 'Verification Result', result });
  }
  return res.render('verification/verify-result', { title: 'Verification Result', result });
}

async function apiVerify(req, res) {
  const result = await verificationService.verifyCertificate(req.body || {}, contextFromRequest(req));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.verified ? 200 : result.status === 'not_found' ? 404 : 400).json({
    success: true,
    data: result,
    error: null,
    meta: { correlationId: req.correlationId, timestamp: new Date().toISOString() }
  });
}

async function apiVerifyByToken(req, res) {
  const result = await verificationService.verifyByToken(req.params.verificationToken, contextFromRequest(req));
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.verified ? 200 : result.status === 'not_found' ? 404 : 400).json({
    success: true,
    data: result,
    error: null,
    meta: { correlationId: req.correlationId, timestamp: new Date().toISOString() }
  });
}

module.exports = {
  showForm,
  submitVerification,
  verifyByToken,
  showVerificationResult,
  apiVerify,
  apiVerifyByToken
};
