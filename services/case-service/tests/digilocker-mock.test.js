const test = require('node:test');
const assert = require('node:assert/strict');
const { listDocumentsMock, ensureConfigured } = require('../src/digilocker/digilocker.client');
const { mapDigiLockerDocument } = require('../src/digilocker/digilocker.mapper');

test('digilocker mock mode stays available when sandbox mock is allowed', async () => {
  process.env.DIGILOCKER_ENABLED = 'false';
  process.env.DIGILOCKER_ALLOW_SANDBOX_MOCK = 'true';

  const config = ensureConfigured();
  const documents = await listDocumentsMock();

  assert.equal(config.allowSandboxMock, true);
  assert.equal(documents.length >= 2, true);
});

test('digilocker mock documents map into importer-friendly metadata', () => {
  const mapped = mapDigiLockerDocument({
    documentType: 'pan_card',
    uri: 'digilocker://mock/pan/001',
    issuerName: 'Income Tax Department',
    digilockerDocumentId: 'DL-PAN-001'
  });

  assert.equal(mapped.documentType, 'pan_card');
  assert.equal(mapped.storageProvider, 'digilocker_reference');
  assert.equal(mapped.issuerName, 'Income Tax Department');
});
