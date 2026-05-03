const CASE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_SCRUTINY: 'under_scrutiny',
  QUERY_RAISED: 'query_raised',
  RESPONSE_SUBMITTED: 'response_submitted',
  INSPECTION_SCHEDULED: 'inspection_scheduled',
  INSPECTION_COMPLETED: 'inspection_completed',
  FEE_DEMANDED: 'fee_demanded',
  FEE_PAID: 'fee_paid',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CERTIFICATE_ISSUED: 'certificate_issued',
  AMENDMENT_REQUESTED: 'amendment_requested',
  AMENDED: 'amended',
  CLOSED: 'closed',
  REOPENED: 'reopened',
  WITHDRAWN: 'withdrawn'
});

const CASE_STATUS_VALUES = Object.freeze(Object.values(CASE_STATUSES));

module.exports = { CASE_STATUSES, CASE_STATUS_VALUES };
