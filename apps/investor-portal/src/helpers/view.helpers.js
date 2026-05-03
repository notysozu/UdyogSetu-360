const { statusLabel, statusBadgeClass, departmentLabel, priorityLabel } = require('./status.helpers');

function formatDate(date, locale = 'en-IN') {
  if (!date) return 'Not available';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
}

function formatDateTime(date, locale = 'en-IN') {
  if (!date) return 'Not available';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

function formatCurrency(amount, locale = 'en-IN', currency = 'INR') {
  const value = Number(amount || 0);
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function daysUntil(date) {
  if (!date) return null;
  const diffMs = new Date(date).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function isOverdue(date) {
  const days = daysUntil(date);
  return days != null && days < 0;
}

function truncateText(text, length = 120) {
  const value = String(text || '');
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}...`;
}

function safeValue(value, fallback = 'Not available') {
  return value == null || value === '' ? fallback : value;
}

function percentage(completed, total) {
  if (!total) return 0;
  return Math.round((Number(completed || 0) / Number(total)) * 100);
}

module.exports = {
  formatDate,
  formatDateTime,
  formatCurrency,
  statusLabel,
  statusBadgeClass,
  departmentLabel,
  priorityLabel,
  daysUntil,
  isOverdue,
  truncateText,
  safeValue,
  percentage
};
