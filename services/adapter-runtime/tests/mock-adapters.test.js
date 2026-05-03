const test = require('node:test');
const assert = require('node:assert/strict');
const { PollutionMockAdapter } = require('../src/adapters/pollution/PollutionMockAdapter');
const { PowerMockAdapter } = require('../src/adapters/power/PowerMockAdapter');
const { FireMockAdapter } = require('../src/adapters/fire/FireMockAdapter');
const { IndustrialSafetyMockAdapter } = require('../src/adapters/industrial-safety/IndustrialSafetyMockAdapter');
const { LabourMockAdapter } = require('../src/adapters/labour/LabourMockAdapter');

const sampleCanonicalPayload = {
  application: { caseType: 'new_industrial_unit' },
  enterprise: { legalName: 'Setu Manufacturing Private Limited', address: {} },
  project: { projectName: 'Demo Factory Approval', waterRequirementKld: 12, employmentExpected: 120, location: {} },
  departmentSpecific: {
    pollutionCategory: 'orange',
    connectedLoadKw: 250,
    contractDemandKva: 300,
    buildingHeightM: 18,
    occupancyType: 'industrial',
    flammableStorage: true,
    machineryInstalled: true,
    boilersInstalled: true,
    hazardousProcess: false,
    contractLabourCount: 30,
    interstateMigrantWorkers: false
  },
  documents: []
};

test('pollution submit returns KSPCB acknowledgement', async () => {
  const adapter = new PollutionMockAdapter({ adapterCode: 'pollution_mock_v1', departmentCode: 'pollution', adapterType: 'rest_api', capabilities: ['submit_application', 'status_check', 'document_push', 'callback_receive', 'health_check'], metadata: { mock: true } });
  const result = await adapter.submitApplication(sampleCanonicalPayload, {});
  assert.equal(result.externalReferenceId, 'KSPCB-CTE-2026-000123');
  assert.equal(result.acknowledgement.acknowledgementNumber, 'KSPCB-ACK-2026-000123');
});

test('power submit returns BESCOM acknowledgement', async () => {
  const adapter = new PowerMockAdapter({ adapterCode: 'power_mock_v1', departmentCode: 'power', adapterType: 'rest_api', capabilities: ['submit_application'], metadata: { mock: true } });
  const result = await adapter.submitApplication(sampleCanonicalPayload, {});
  assert.equal(result.externalReferenceId, 'BESCOM-HT-2026-000456');
});

test('fire submit returns inspection required', async () => {
  const adapter = new FireMockAdapter({ adapterCode: 'fire_mock_v1', departmentCode: 'fire', adapterType: 'rest_api', capabilities: ['submit_application'], metadata: { mock: true } });
  const result = await adapter.submitApplication(sampleCanonicalPayload, {});
  assert.equal(result.status.canonicalStatus, 'inspection_required');
});

test('industrial safety submit returns technical scrutiny', async () => {
  const adapter = new IndustrialSafetyMockAdapter({ adapterCode: 'industrial_safety_mock_v1', departmentCode: 'industrial_safety', adapterType: 'rest_api', capabilities: ['submit_application'], metadata: { mock: true } });
  const result = await adapter.submitApplication(sampleCanonicalPayload, {});
  assert.equal(result.status.externalStatus, 'technical_scrutiny');
});

test('labour submit returns registration under review', async () => {
  const adapter = new LabourMockAdapter({ adapterCode: 'labour_mock_v1', departmentCode: 'labour', adapterType: 'rest_api', capabilities: ['submit_application'], metadata: { mock: true } });
  const result = await adapter.submitApplication(sampleCanonicalPayload, {});
  assert.equal(result.status.canonicalStatus, 'under_review');
});
