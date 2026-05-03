const test = require('node:test');
const assert = require('node:assert/strict');
const { mapCanonicalToDepartment } = require('../src/mappings/mapping-engine');
const {
  POLLUTION_OUTBOUND_PROFILE,
  POWER_OUTBOUND_PROFILE,
  FIRE_OUTBOUND_PROFILE
} = require('../src/mappings/mock-mapping-profiles');
const { AdapterMappingError } = require('../src/errors/adapter.errors');

const canonicalPayload = {
  application: { caseType: 'new_industrial_unit' },
  enterprise: { legalName: 'Setu Manufacturing Private Limited', address: { city: 'Bengaluru' } },
  project: { waterRequirementKld: 12, projectName: 'Setu Manufacturing Unit', location: { district: 'Bengaluru Urban' } },
  departmentSpecific: {
    pollutionCategory: 'orange',
    connectedLoadKw: 250,
    contractDemandKva: 300,
    buildingHeightM: 18,
    occupancyType: 'industrial',
    flammableStorage: true
  },
  documents: []
};

test('canonical payload maps to pollution request', () => {
  const mapped = mapCanonicalToDepartment(canonicalPayload, POLLUTION_OUTBOUND_PROFILE);
  assert.equal(mapped.industryName, 'Setu Manufacturing Private Limited');
  assert.equal(mapped.waterConsumptionKld, 12);
});

test('power mapping carries connected load', () => {
  const mapped = mapCanonicalToDepartment(canonicalPayload, POWER_OUTBOUND_PROFILE);
  assert.equal(mapped.connectedLoadKw, 250);
  assert.equal(mapped.contractDemandKva, 300);
});

test('fire mapping carries building height and occupancy', () => {
  const mapped = mapCanonicalToDepartment(canonicalPayload, FIRE_OUTBOUND_PROFILE);
  assert.equal(mapped.buildingHeightM, 18);
  assert.equal(mapped.occupancyType, 'industrial');
});

test('required mapped fields are validated', () => {
  assert.throws(
    () => mapCanonicalToDepartment({ enterprise: {}, project: {}, application: {}, departmentSpecific: {}, documents: [] }, POLLUTION_OUTBOUND_PROFILE),
    AdapterMappingError
  );
});
