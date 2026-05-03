const { getDigiLockerConfig } = require('./digilocker.config');
const { DigiLockerError } = require('./digilocker.errors');

async function listDocumentsMock() {
  return [
    {
      documentType: 'pan_card',
      uri: 'digilocker://mock/pan/001',
      issuerName: 'Income Tax Department',
      digilockerDocumentId: 'DL-PAN-001'
    },
    {
      documentType: 'udyam_certificate',
      uri: 'digilocker://mock/udyam/001',
      issuerName: 'MSME',
      digilockerDocumentId: 'DL-UDYAM-001'
    }
  ];
}

function ensureConfigured() {
  const config = getDigiLockerConfig();
  if (!config.enabled && !config.allowSandboxMock) {
    throw new DigiLockerError('DigiLocker is not configured.', 'DIGILOCKER_DISABLED', 503);
  }
  return config;
}

module.exports = {
  ensureConfigured,
  listDocumentsMock
};
