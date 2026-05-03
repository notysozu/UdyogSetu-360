const GRIEVANCE_STATUSES = Object.freeze({
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  IN_REVIEW: 'in_review',
  AWAITING_RESPONSE: 'awaiting_response',
  AWAITING_INVESTOR_RESPONSE: 'awaiting_investor_response',
  AWAITING_DEPARTMENT_RESPONSE: 'awaiting_department_response',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  REOPENED: 'reopened',
  CLOSED: 'closed'
});

const GRIEVANCE_STATUS_VALUES = Object.freeze(Object.values(GRIEVANCE_STATUSES));

module.exports = { GRIEVANCE_STATUSES, GRIEVANCE_STATUS_VALUES };
