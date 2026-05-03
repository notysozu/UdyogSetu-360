const TASK_STATUS = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  ACKNOWLEDGED: 'acknowledged',
  UNDER_SCRUTINY: 'under_scrutiny',
  QUERY_RAISED: 'query_raised',
  RESPONSE_SUBMITTED: 'response_submitted',
  INSPECTION_SCHEDULED: 'inspection_scheduled',
  INSPECTION_COMPLETED: 'inspection_completed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CERTIFICATE_ISSUED: 'certificate_issued',
  CLOSED: 'closed'
});

module.exports = { TASK_STATUS };
