const { statusLabel, statusBadgeClass, departmentLabel } = require('./status.helpers');

function formatDate(date, locale = 'en-IN') {
  if (!date) return 'Not available';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(date));
}

function formatDateTime(date, locale = 'en-IN') {
  if (!date) return 'Not available';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}

function formatCurrency(amount, locale = 'en-IN') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function percentage(completed, total) {
  if (!total) return 0;
  return Math.round((Number(completed || 0) / Number(total)) * 100);
}

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function safeValue(value, fallback = 'Not available') {
  return value == null || value === '' ? fallback : value;
}

module.exports = {
  formatDate,
  formatDateTime,
  formatCurrency,
  percentage,
  daysUntil,
  safeValue,
  statusLabel,
  statusBadgeClass,
  departmentLabel
};
