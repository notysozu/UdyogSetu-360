const counterRepository = require('../repositories/counter.repository');
const { env } = require('../config/env');

async function generateUniversalCaseId(date = new Date(), session = null) {
  const prefix = env.CASE_ID_PREFIX || 'US360-KA';
  const year = date.getFullYear();
  const sequence = await counterRepository.getNextSequence(`universal_case_id:${year}`, session);
  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
}

module.exports = { generateUniversalCaseId };
