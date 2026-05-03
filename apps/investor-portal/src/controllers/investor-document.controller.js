const documentService = require('../services/investor-document-view.service');

function ctx(req) {
  return {
    user: req.user,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function showDocumentCentre(req, res) {
  const documents = await documentService.getDocumentCentre(req.user, req.query || {}, ctx(req));
  res.render('documents/document-centre', {
    title: 'Documents',
    documents,
    filters: req.query || {}
  });
}

async function listCaseDocuments(req, res) {
  const documents = await documentService.getCaseDocuments(req.user, req.params.caseId, ctx(req));
  res.render('documents/case-documents', {
    title: 'Case Documents',
    documents,
    caseId: req.params.caseId
  });
}

async function showDocumentDetail(req, res) {
  const document = await documentService.getDocumentDetail(req.user, req.params.documentId, ctx(req));
  if (!document) {
    const error = new Error('Document not found.');
    error.status = 404;
    throw error;
  }
  res.render('documents/document-detail', {
    title: document.title || 'Document Detail',
    document
  });
}

async function downloadDocument(req, res) {
  const result = await documentService.getDocumentDownloadUrl(req.user, req.params.documentId, ctx(req));
  res.redirect(result.url);
}

async function uploadCaseDocument(req, res) {
  await documentService.uploadDocumentForCase(req.user, req.params.caseId, req.file, req.body || {}, ctx(req));
  req.flash('success', 'Document uploaded successfully.');
  res.redirect(`/cases/${req.params.caseId}/documents`);
}

async function createNewDocumentVersion(req, res) {
  await documentService.createDocumentVersion(req.user, req.params.documentId, req.file, ctx(req));
  req.flash('success', 'New document version uploaded.');
  res.redirect(`/documents/${req.params.documentId}`);
}

module.exports = {
  showDocumentCentre,
  listCaseDocuments,
  showDocumentDetail,
  downloadDocument,
  uploadCaseDocument,
  createNewDocumentVersion
};
