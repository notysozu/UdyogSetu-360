const departmentLabels = {
  pollution: 'Pollution Control',
  power: 'Power Utility',
  fire: 'Karnataka State Fire and Emergency Services',
  industrial_safety: 'Industrial Safety',
  labour: 'Labour Department'
};

function formatDate(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function departmentLabel(code) {
  return departmentLabels[code] || (code ? String(code).replace(/_/g, ' ') : 'All departments');
}

function safeValue(value, fallback = '-') {
  return value === null || value === undefined || value === '' ? fallback : value;
}

function verificationStatusLabel(status) {
  return {
    valid: 'Valid',
    revoked: 'Revoked',
    expired: 'Expired',
    invalid: 'Invalid',
    not_found: 'Not found',
    superseded: 'Superseded'
  }[status] || 'Unknown';
}

module.exports = {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  departmentLabel,
  safeValue,
  verificationStatusLabel
};
