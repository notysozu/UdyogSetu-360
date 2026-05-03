const { createLogger } = require('../../../../packages/shared/src/logger');

const logger = createLogger('orchestration-service');

async function runAuditRetentionCheckJob() {
  logger.info('job_started', { job: 'audit-retention-check', note: 'placeholder' });
  logger.info('job_completed', { job: 'audit-retention-check', note: 'No retention deletion is performed from app routes.' });
  return { ok: true, placeholder: true };
}

module.exports = { runAuditRetentionCheckJob };
