const { removeUndefinedFields } = require('./payload-transformers');

function buildCanonicalDepartmentPayload(caseDoc = {}, taskDoc = {}, documents = [], context = {}) {
  return removeUndefinedFields({
    universalCaseId: caseDoc.universalCaseId || taskDoc.universalCaseId || null,
    taskId: taskDoc._id?.toString?.() || taskDoc.id || null,
    departmentCode: taskDoc.departmentCode || context.departmentCode || null,
    application: {
      caseType: caseDoc.caseType || 'unknown',
      submittedAt: caseDoc.submittedAt?.toISOString?.() || caseDoc.submittedAt || new Date().toISOString()
    },
    enterprise: {
      legalName: caseDoc.title || caseDoc.organisationName || context.enterprise?.legalName || null,
      gstin: context.enterprise?.gstin || null,
      pan: context.enterprise?.pan || null,
      address: context.enterprise?.address || {}
    },
    project: {
      projectName: caseDoc.title || context.project?.projectName || null,
      sector: context.project?.sector || null,
      investmentAmount: context.project?.investmentAmount || null,
      employmentExpected: context.project?.employmentExpected || null,
      location: context.project?.location || {}
    },
    departmentSpecific: context.departmentSpecific || {},
    documents: documents.map((document) => ({
      documentId: document._id?.toString?.() || document.id || document.documentId || null,
      documentType: document.documentType || document.type || null,
      fileName: document.fileName || null,
      checksum: document.checksum || null,
      downloadUrl: document.downloadUrl || document.signedUrl || document.objectKey || null
    })),
    metadata: {
      correlationId: context.correlationId || null
    }
  });
}

module.exports = { buildCanonicalDepartmentPayload };
