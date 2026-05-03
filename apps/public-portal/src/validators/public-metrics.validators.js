const { DEPARTMENT_CODE_VALUES } = require('../../../../packages/shared/src/constants/department.constants');

function parseMetricsFilters(query = {}) {
  const fromDate = query.fromDate ? new Date(query.fromDate) : null;
  const toDate = query.toDate ? new Date(query.toDate) : null;
  const filters = {
    fromDate: fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : null,
    toDate: toDate && !Number.isNaN(toDate.getTime()) ? toDate : null,
    departmentCode: DEPARTMENT_CODE_VALUES.includes(query.departmentCode) ? query.departmentCode : null,
    stage: query.stage ? String(query.stage).trim() : null,
    metricType: query.metricType ? String(query.metricType).trim() : null,
    district: query.district ? String(query.district).trim() : null
  };
  return filters;
}

function validateMetricsFilters(query = {}) {
  const filters = parseMetricsFilters(query);
  const errors = [];
  const maxDays = Number(process.env.PUBLIC_METRICS_MAX_DATE_RANGE_DAYS || 366);

  if ((query.fromDate && !filters.fromDate) || (query.toDate && !filters.toDate)) {
    errors.push('Invalid date filter.');
  }
  if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
    errors.push('fromDate must be earlier than toDate.');
  }
  if (filters.fromDate && filters.toDate) {
    const span = (filters.toDate.getTime() - filters.fromDate.getTime()) / 86400000;
    if (span > maxDays) errors.push(`Date range cannot exceed ${maxDays} days.`);
  }
  if (filters.stage && /<|>|script/i.test(filters.stage)) {
    errors.push('Invalid stage filter.');
  }
  return { value: filters, errors };
}

module.exports = {
  parseMetricsFilters,
  validateMetricsFilters
};
