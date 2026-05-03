const { DOCUMENT_STORAGE_PROVIDERS } = require('../../../../packages/shared/src');
const { S3StorageProvider } = require('./s3-storage.provider');
const { LocalStorageProvider } = require('./local-storage.provider');

let providerInstance = null;

async function createStorageProvider(config = {}) {
  const provider = config.provider || process.env.DOCUMENT_STORAGE_PROVIDER || DOCUMENT_STORAGE_PROVIDERS.S3;
  if (provider === DOCUMENT_STORAGE_PROVIDERS.LOCAL) {
    providerInstance = new LocalStorageProvider(config);
  } else {
    providerInstance = new S3StorageProvider(config);
  }
  await providerInstance.initialise();
  return providerInstance;
}

async function getStorageProvider(config = {}) {
  if (!providerInstance) {
    return createStorageProvider(config);
  }
  return providerInstance;
}

module.exports = { createStorageProvider, getStorageProvider };
