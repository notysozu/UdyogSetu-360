const test = require('node:test');
const assert = require('node:assert/strict');

test('grievance service exposes lifecycle methods', async () => {
  const service = require('../services/grievance.service');
  [
    'createGrievance',
    'acknowledgeGrievance',
    'assignGrievance',
    'addInternalComment',
    'addExternalReply',
    'resolveGrievance',
    'closeGrievance',
    'reopenGrievance',
    'escalateGrievance'
  ].forEach((method) => assert.equal(typeof service[method], 'function'));
});

test('grievance and SLA repositories are loadable', async () => {
  const grievanceRepository = require('../repositories/grievance.repository');
  const slaRepository = require('../repositories/sla-timer.repository');
  assert.equal(typeof grievanceRepository.listByUserScope, 'function');
  assert.equal(typeof slaRepository.findWarningCandidates, 'function');
});
