const documentService = require('../../../../services/case-service/src/services/document.service');
const Document = require('../../../../services/case-service/src/models/Document');
const mongoose = require('mongoose');
const { buildMockInvestorPortalData } = require('../mock/investor.mock');

async function getDocumentCentre(user, filters = {}, context = {}) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).cases.map((item) => ({
      _id: `mock-doc-${item.caseId}`,
      caseId: item.caseId,
      title: 'Project Report',
      documentType: 'project_report',
      status: 'verified',
      tags: ['mock'],
      version: 1,
      file: { originalName: 'project-report.pdf', sizeBytes: 102400, mimeType: 'application/pdf' },
      verification: { status: 'verified' }
    }));
  }
  const query = {
    organisationId: user.organisationId || null,
    isDeleted: false
  };
  if (filters.documentType) query.documentType = filters.documentType;
  if (filters.status) query.status = filters.status;
  const documents = await Document.find(query).sort({ createdAt: -1 }).limit(100).catch(() => []);
  if (!documents.length && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).cases.map((item) => ({
      _id: `mock-doc-${item.caseId}`,
      caseId: item.caseId,
      title: 'Project Report',
      documentType: 'project_report',
      status: 'verified',
      tags: ['mock'],
      version: 1,
      file: { originalName: 'project-report.pdf', sizeBytes: 102400, mimeType: 'application/pdf' },
      verification: { status: 'verified' }
    }));
  }
  return documents;
}

async function getCaseDocuments(user, caseId, context = {}) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return getDocumentCentre(user, {}, context);
  }
  return documentService.listCaseDocuments(caseId, {}, { ...context, user }).catch(() => []);
}

async function getDocumentDetail(user, documentId, context = {}) {
  return documentService.getDocumentMetadata(documentId, { ...context, user }).catch(() => null);
}

async function getDocumentDownloadUrl(user, documentId, context = {}) {
  return documentService.generateSignedDownloadUrl(documentId, { ...context, user });
}

async function uploadDocumentForCase(user, caseId, file, input, context = {}) {
  return documentService.uploadDocument(file, { ...input, caseId }, { ...context, user });
}

async function createDocumentVersion(user, documentId, file, context = {}) {
  return documentService.createNewVersion(documentId, file, { ...context, user });
}

module.exports = {
  getDocumentCentre,
  getCaseDocuments,
  getDocumentDetail,
  getDocumentDownloadUrl,
  uploadDocumentForCase,
  createDocumentVersion
};
