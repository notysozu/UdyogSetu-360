const { createLogger } = require('../../../../packages/shared/src/logger');
const stuckCaseService = require('../stuck-case/stuck-case-detector.service');

const logger = createLogger('orchestration-service');

async function runStuckCaseScanJob() {
  logger.info('job_started', { job: 'stuck-case-scan' });
  try {
    const result = await stuckCaseService.scanForStuckCases({ manualTrigger: false });
    logger.info('job_completed', { job: 'stuck-case-scan', scannedCases: result.scannedCases, findings: result.findings.length });
    return result;
  } catch (error) {
    logger.error('job_failed', { job: 'stuck-case-scan', message: error.message });
    throw error;
  }
}

module.exports = { runStuckCaseScanJob };
