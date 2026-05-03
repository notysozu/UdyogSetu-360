const EVENT_NAMES = Object.freeze({
  CASE_SUBMITTED: 'case.submitted.v1',
  CASE_AMENDED: 'case.amended.v1',
  TASK_CREATED: 'task.created.v1',
  TASK_ASSIGNED: 'task.assigned.v1',
  TASK_QUERY_RAISED: 'task.query_raised.v1',
  TASK_RESPONSE_SUBMITTED: 'task.response_submitted.v1',
  TASK_APPROVED: 'task.approved.v1',
  TASK_REJECTED: 'task.rejected.v1',
  DOCUMENT_UPLOADED: 'document.uploaded.v1',
  GRIEVANCE_CREATED: 'grievance.created.v1',
  CERTIFICATE_ISSUED: 'certificate.issued.v1',
  NOTIFICATION_SENT: 'notification.sent.v1',
  AUDIT_RECORDED: 'audit.recorded.v1'
});

module.exports = { EVENT_NAMES };
