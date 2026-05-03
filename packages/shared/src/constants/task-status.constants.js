const TASK_STATUSES = Object.freeze({
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  UNDER_REVIEW: 'under_review',
  QUERY_RAISED: 'query_raised',
  RESPONSE_RECEIVED: 'response_received',
  INSPECTION_REQUIRED: 'inspection_required',
  INSPECTION_SCHEDULED: 'inspection_scheduled',
  INSPECTION_COMPLETED: 'inspection_completed',
  FEE_DEMANDED: 'fee_demanded',
  FEE_PAID: 'fee_paid',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RETURNED: 'returned',
  CERTIFICATE_ISSUED: 'certificate_issued',
  CANCELLED: 'cancelled',
  CLOSED: 'closed'
});

const TASK_STATUS_VALUES = Object.freeze(Object.values(TASK_STATUSES));

module.exports = { TASK_STATUSES, TASK_STATUS_VALUES };
