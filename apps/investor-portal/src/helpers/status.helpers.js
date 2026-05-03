const DEPARTMENT_LABELS = {
  pollution: 'Pollution Control',
  power: 'Power Utility',
  fire: 'Fire Services',
  industrial_safety: 'Industrial Safety',
  labour: 'Labour Department'
};

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_scrutiny: 'Under Scrutiny',
  under_review: 'Under Review',
  query_raised: 'Query Raised',
  response_submitted: 'Response Submitted',
  response_received: 'Response Received',
  inspection_required: 'Inspection Required',
  inspection_scheduled: 'Inspection Scheduled',
  inspection_completed: 'Inspection Completed',
  fee_demanded: 'Fee Demanded',
  fee_paid: 'Fee Paid',
  approved: 'Approved',
  rejected: 'Rejected',
  certificate_issued: 'Certificate Issued',
  closed: 'Closed',
  uploaded: 'Uploaded',
  verified: 'Verified',
  pending_verification: 'Pending Verification',
  pending: 'Pending',
  active: 'Active',
  open: 'Open',
  in_review: 'In Review',
  resolved: 'Resolved',
  valid: 'Valid',
  expired: 'Expired',
  revoked: 'Revoked'
};

const STATUS_CLASSES = {
  draft: 'status-badge status-badge--muted',
  submitted: 'status-badge status-badge--info',
  under_scrutiny: 'status-badge status-badge--info',
  under_review: 'status-badge status-badge--info',
  query_raised: 'status-badge status-badge--warning',
  response_submitted: 'status-badge status-badge--accent',
  response_received: 'status-badge status-badge--accent',
  inspection_required: 'status-badge status-badge--warning',
  inspection_scheduled: 'status-badge status-badge--warning',
  inspection_completed: 'status-badge status-badge--accent',
  fee_demanded: 'status-badge status-badge--warning',
  fee_paid: 'status-badge status-badge--accent',
  approved: 'status-badge status-badge--success',
  certificate_issued: 'status-badge status-badge--success',
  verified: 'status-badge status-badge--success',
  rejected: 'status-badge status-badge--danger',
  expired: 'status-badge status-badge--danger',
  revoked: 'status-badge status-badge--danger',
  open: 'status-badge status-badge--warning'
};

function statusLabel(status) {
  return STATUS_LABELS[status] || String(status || 'unknown').replace(/_/g, ' ');
}

function statusBadgeClass(status) {
  return STATUS_CLASSES[status] || 'status-badge status-badge--muted';
}

function departmentLabel(code) {
  return DEPARTMENT_LABELS[code] || (code ? String(code).replace(/_/g, ' ') : 'General');
}

function priorityLabel(priority) {
  if (!priority) return 'Normal';
  return String(priority).charAt(0).toUpperCase() + String(priority).slice(1);
}

module.exports = {
  statusLabel,
  statusBadgeClass,
  departmentLabel,
  priorityLabel
};
