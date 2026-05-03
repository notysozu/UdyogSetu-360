const { sendSuccess } = require('../utils/api-response');

function stub(action, req, extra = {}) {
  return {
    resource: 'certificate',
    action,
    todo: `Wire certificate.${action} to certificate verification services.`,
    correlationId: req.context.correlationId,
    ...extra
  };
}

async function verifyCertificate(req, res) {
  return sendSuccess(res, stub('verifyCertificate', req, { verified: false, criteria: req.body }));
}
async function getCertificate(req, res) {
  return sendSuccess(res, stub('getCertificate', req, { certificateNumber: req.params.certificateNumber }));
}
async function listCaseCertificates(req, res) {
  return sendSuccess(res, stub('listCaseCertificates', req, { caseId: req.params.caseId }));
}

module.exports = { verifyCertificate, getCertificate, listCaseCertificates };
