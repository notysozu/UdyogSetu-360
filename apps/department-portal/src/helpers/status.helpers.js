const departmentLabels = {
  pollution: 'Pollution Control',
  power: 'Power Utility',
  fire: 'Fire Services',
  industrial_safety: 'Industrial Safety',
  labour: 'Labour Department'
};

const statusLabels = {
  pending: 'Pending',
  assigned: 'Assigned',
  under_review: 'Under Review',
  query_raised: 'Query Raised',
  response_received: 'Response Received',
  inspection_required: 'Inspection Required',
  inspection_scheduled: 'Inspection Scheduled',
  inspection_completed: 'Inspection Completed',
  fee_demanded: 'Fee Demanded',
  fee_paid: 'Fee Paid',
  approved: 'Approved',
  rejected: 'Rejected',
  returned: 'Returned for correction',
  certificate_issued: 'Certificate Issued',
  running: 'Running',
  paused: 'Paused',
  warning: 'Warning',
  breached: 'Breached',
  completed: 'Completed'
};

const statusClasses = {
  approved: 'status-badge status-badge--success',
  certificate_issued: 'status-badge status-badge--success',
  rejected: 'status-badge status-badge--danger',
  breached: 'status-badge status-badge--danger',
  query_raised: 'status-badge status-badge--warning',
  inspection_required: 'status-badge status-badge--warning',
  inspection_scheduled: 'status-badge status-badge--warning',
  fee_demanded: 'status-badge status-badge--warning',
  warning: 'status-badge status-badge--warning',
  under_review: 'status-badge status-badge--info',
  assigned: 'status-badge status-badge--info',
  fee_paid: 'status-badge status-badge--accent',
  inspection_completed: 'status-badge status-badge--accent',
  response_received: 'status-badge status-badge--accent',
  pending: 'status-badge status-badge--muted',
  paused: 'status-badge status-badge--muted',
  completed: 'status-badge status-badge--muted'
};

function statusLabel(status) {
  return statusLabels[status] || String(status || 'unknown').replace(/_/g, ' ');
}

function statusBadgeClass(status) {
  return statusClasses[status] || 'status-badge status-badge--muted';
}

function departmentLabel(code) {
  return departmentLabels[code] || (code ? String(code).replace(/_/g, ' ') : 'Department');
}

module.exports = { statusLabel, statusBadgeClass, departmentLabel };
