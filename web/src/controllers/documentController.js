const Case = require('../models/Case');
const documentService = require('../../../services/case-service/src/services/document.service');
const certificateService = require('../../../services/case-service/src/services/certificate.service');
const digilockerConsentService = require('../../../services/case-service/src/digilocker/digilocker-consent.service');
const digilockerService = require('../../../services/case-service/src/digilocker/digilocker.service');

function contextFromRequest(req) {
  return {
    user: req.user || req.session.user || null,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function uploadForm(req, res) {
  const caseDoc = await Case.findOne({ caseId: req.params.caseId }).lean();
  return res.render('documents/upload', {
    title: 'Upload Document',
    caseDoc
  });
}

async function list(req, res) {
  const caseDoc = await Case.findOne({ caseId: req.params.caseId }).lean();
  const documents = await documentService.listCaseDocuments(caseDoc?._id, {}, contextFromRequest(req));
  return res.render('documents/list', {
    title: 'Documents',
    caseDoc,
    documents
  });
}

async function detail(req, res) {
  const document = await documentService.getDocumentMetadata(req.params.documentId, contextFromRequest(req));
  return res.render('documents/detail', {
    title: document.title || 'Document Detail',
    document
  });
}

async function versions(req, res) {
  const document = await documentService.getDocumentMetadata(req.params.documentId, contextFromRequest(req));
  const versions = await documentService.getDocumentVersions(req.params.documentId);
  return res.render('documents/versions', {
    title: 'Document Versions',
    document,
    versions
  });
}

async function certificateDetail(req, res) {
  const certificate = await certificateService.getCertificateByNumber(req.params.certificateNumber, contextFromRequest(req));
  return res.render('documents/certificate-detail', {
    title: 'Certificate',
    certificate
  });
}

async function digilockerConsent(req, res) {
  return res.render('documents/digilocker-consent', {
    title: 'DigiLocker Consent'
  });
}

async function digilockerDocuments(req, res) {
  const consent = req.query.consentId ? await digilockerService.getConsent(req.query.consentId) : null;
  const documents = consent ? await digilockerService.listAvailableDocuments(consent.consentId, contextFromRequest(req)) : [];
  return res.render('documents/digilocker-documents', {
    title: 'DigiLocker Documents',
    consent,
    documents
  });
}

module.exports = {
  uploadForm,
  list,
  detail,
  versions,
  certificateDetail,
  digilockerConsent,
  digilockerDocuments
};
