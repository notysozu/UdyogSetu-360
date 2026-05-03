function normaliseDepartmentStatus(externalStatus, departmentCode) {
  const maps = {
    pollution: {
      received_for_scrutiny: 'under_review',
      query_raised: 'query_raised',
      inspection_required: 'inspection_required',
      approved: 'approved',
      rejected: 'rejected'
    },
    power: {
      application_registered: 'under_review',
      load_sanctioned: 'approved',
      payment_pending: 'fee_demanded',
      connection_released: 'certificate_issued',
      rejected: 'rejected'
    },
    fire: {
      inspection_to_be_scheduled: 'inspection_required',
      inspection_scheduled: 'inspection_scheduled',
      inspection_completed: 'inspection_completed',
      noc_issued: 'approved',
      rejected: 'rejected'
    },
    industrial_safety: {
      technical_scrutiny: 'under_review',
      inspection_required: 'inspection_required',
      fee_required: 'fee_demanded',
      license_approved: 'approved',
      rejected: 'rejected'
    },
    labour: {
      registration_under_review: 'under_review',
      clarification_required: 'query_raised',
      registration_approved: 'approved',
      rejected: 'rejected'
    }
  };
  return maps[departmentCode]?.[externalStatus] || externalStatus || 'unknown';
}

function normaliseDepartmentDecision(externalDecision, departmentCode) {
  return normaliseDepartmentStatus(externalDecision, departmentCode);
}

function normaliseDepartmentQuery(externalQuery) {
  return {
    queryType: externalQuery?.queryType || 'general',
    message: externalQuery?.message || externalQuery?.remarks || ''
  };
}

function normaliseDepartmentCertificate(externalCertificate) {
  return {
    certificateNumber: externalCertificate?.certificateNumber || externalCertificate?.referenceNumber || null,
    issuedAt: externalCertificate?.issuedAt || null
  };
}

module.exports = {
  normaliseDepartmentStatus,
  normaliseDepartmentDecision,
  normaliseDepartmentQuery,
  normaliseDepartmentCertificate
};
