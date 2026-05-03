const aggregationService = require('./analytics-aggregation.service');

const CATEGORY_MAP = Object.freeze({
  missing: 'missing_document',
  unreadable: 'unreadable_document',
  expired: 'expired_document',
  mismatch: 'mismatch',
  format: 'invalid_format',
  incomplete: 'incomplete_details',
  unsigned: 'unsigned',
  wrong: 'wrong_document_type',
  duplicate: 'duplicate_document'
});

function normalizeCategory(reason = '') {
  const value = String(reason || '').toLowerCase();
  for (const [needle, category] of Object.entries(CATEGORY_MAP)) {
    if (value.includes(needle)) return category;
  }
  return 'other';
}

async function computeDocumentDefectInsights(dateRange = {}, filters = {}, context = {}) {
  const rows = await aggregationService.aggregateDocumentDefects(dateRange, filters, context);
  return rows.map((row) => ({
    ...row,
    defectCategory: row.defectCategory === 'other' ? normalizeCategory(row.defectReason) : row.defectCategory
  }));
}

module.exports = {
  computeDocumentDefectInsights,
  normalizeCategory
};
