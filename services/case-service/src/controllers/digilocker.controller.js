const consentService = require('../digilocker/digilocker-consent.service');
const digilockerService = require('../digilocker/digilocker.service');
const { validateConsentRequest, validateCallbackState } = require('../validators/digilocker.validators');

function contextFromRequest(req) {
  return {
    user: {
      _id: req.get('x-user-id') || null,
      id: req.get('x-user-id') || null,
      primaryRole: req.get('x-user-role') || null,
      organisationId: req.get('x-organisation-id') || null
    },
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    universalCaseId: req.body.universalCaseId || req.query.universalCaseId || null
  };
}

async function connect(_req, res) {
  res.json({ ok: true, data: { message: 'Use /api/v1/digilocker/consents to initiate consent.' } });
}

async function createConsent(req, res, next) {
  try {
    const result = await consentService.initiateConsent(validateConsentRequest(req.body || {}), contextFromRequest(req));
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function callback(req, res, next) {
  try {
    const result = await digilockerService.handleCallback(validateCallbackState(req.query || {}), contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getConsent(req, res, next) {
  try {
    const result = await digilockerService.getConsent(req.params.consentId);
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function revokeConsent(req, res, next) {
  try {
    const result = await digilockerService.revokeConsent(req.params.consentId, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function listDocuments(req, res, next) {
  try {
    const result = await digilockerService.listAvailableDocuments(req.query.consentId || req.body.consentId, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function retrieveDocument(req, res, next) {
  try {
    const result = await digilockerService.retrieveDocument(req.body.consentId, req.body, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function verifyDocument(req, res, next) {
  try {
    const result = await digilockerService.verifyDocument(req.body.consentId, req.body, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function importDocument(req, res, next) {
  try {
    const result = await digilockerService.importDocumentToCase(req.body.consentId, req.body, req.body.caseId, contextFromRequest(req));
    res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function webhook(req, res, next) {
  try {
    const result = await digilockerService.handleWebhook(req.body || {}, req.headers, contextFromRequest(req));
    res.json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  connect,
  createConsent,
  callback,
  getConsent,
  revokeConsent,
  listDocuments,
  retrieveDocument,
  verifyDocument,
  importDocument,
  webhook
};
