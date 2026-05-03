const crypto = require('crypto');
const { env } = require('../config/env');

function buildAcknowledgementNumber(caseDoc) {
  const prefix = env.ACK_PREFIX || 'ACK-US360-KA';
  const fallback = caseDoc.universalCaseId || caseDoc.caseId;
  const sequence = fallback.split('-').slice(-2).join('-');
  return `${prefix}-${sequence}`;
}

function renderAcknowledgementData(caseDoc, tasks = []) {
  return {
    acknowledgementNumber: buildAcknowledgementNumber(caseDoc),
    universalCaseId: caseDoc.universalCaseId,
    submittedAt: caseDoc.submittedAt,
    applicantName:
      caseDoc.cafData?.enterprise?.authorisedSignatoryName || caseDoc.applicant?.name || '',
    organisationName: caseDoc.cafData?.enterprise?.legalName || caseDoc.enterprise?.name || '',
    projectName: caseDoc.cafData?.project?.projectName || caseDoc.title || '',
    requiredDepartments: caseDoc.requiredDepartments || [],
    taskCount: tasks.length,
    attachmentCount: caseDoc.metadata?.attachmentCount || 0,
    status: caseDoc.status,
    verificationNote:
      'This acknowledgement confirms receipt of the Combined Application Form for downstream scrutiny.',
    generatedBy: 'system'
  };
}

function generateAcknowledgement(caseDoc, tasks = [], context = {}) {
  const base = renderAcknowledgementData(caseDoc, tasks);
  const checksum = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        acknowledgementNumber: base.acknowledgementNumber,
        universalCaseId: base.universalCaseId,
        correlationId: context.correlationId || caseDoc.correlationId || null
      })
    )
    .digest('hex')
    .slice(0, 16);

  return {
    ...base,
    checksum
  };
}

module.exports = {
  buildAcknowledgementNumber,
  renderAcknowledgementData,
  generateAcknowledgement
};
