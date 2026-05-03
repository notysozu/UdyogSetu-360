const fs = require('fs/promises');
const path = require('path');
const { createHmac, timingSafeEqual } = require('crypto');
const { StorageProviderInterface } = require('./storage-provider.interface');

function getSigningSecret() {
  return (
    process.env.DOCUMENT_LOCAL_SIGNING_SECRET ||
    process.env.JWT_SECRET ||
    process.env.COOKIE_SECRET ||
    'us360-local-document-secret'
  );
}

function buildSignature(operation, objectKey, expiresAt) {
  return createHmac('sha256', getSigningSecret())
    .update(`${operation}:${objectKey}:${expiresAt}`)
    .digest('hex');
}

function createSignedLocalRequest(operation, objectKey, expiresInSeconds) {
  const expiresAt = String(Date.now() + expiresInSeconds * 1000);
  const signature = buildSignature(operation, objectKey, expiresAt);
  return { expiresAt, signature };
}

function verifySignedLocalRequest({ operation, objectKey, expiresAt, signature }) {
  if (!objectKey || !expiresAt || !signature) {
    const error = new Error('Signed local storage request is missing required fields.');
    error.statusCode = 400;
    throw error;
  }
  if (Number(expiresAt) < Date.now()) {
    const error = new Error('Signed local storage request has expired.');
    error.statusCode = 403;
    throw error;
  }
  const expected = buildSignature(operation, objectKey, expiresAt);
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    const error = new Error('Signed local storage request signature is invalid.');
    error.statusCode = 403;
    throw error;
  }
  return true;
}

class LocalStorageProvider extends StorageProviderInterface {
  constructor(config = {}) {
    super();
    this.baseDir = config.baseDir || path.join(process.cwd(), 'storage', 'documents');
  }

  resolve(objectKey) {
    return path.join(this.baseDir, objectKey);
  }

  async initialise() {
    await fs.mkdir(this.baseDir, { recursive: true });
    return this;
  }

  async healthCheck() {
    await this.initialise();
    return { ok: true, provider: 'local', baseDir: this.baseDir };
  }

  async putObject({ objectKey, body }) {
    const filePath = this.resolve(objectKey);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
    return { objectKey };
  }

  async getObject({ objectKey }) {
    const filePath = this.resolve(objectKey);
    const body = await fs.readFile(filePath);
    return { Body: body };
  }

  async deleteObject({ objectKey }) {
    const filePath = this.resolve(objectKey);
    await fs.rm(filePath, { force: true });
    return { deleted: true };
  }

  async objectExists({ objectKey }) {
    try {
      await fs.access(this.resolve(objectKey));
      return true;
    } catch (_error) {
      return false;
    }
  }

  async createSignedUploadUrl({ objectKey, contentType, expiresInSeconds, metadata = {} }) {
    const signed = createSignedLocalRequest('upload', objectKey, expiresInSeconds);
    return {
      url: `/api/v1/documents/local-upload?objectKey=${encodeURIComponent(objectKey)}&expires=${signed.expiresAt}&signature=${signed.signature}`,
      method: 'PUT',
      objectKey,
      contentType,
      metadata,
      expiresInSeconds
    };
  }

  async createSignedDownloadUrl({ objectKey, expiresInSeconds }) {
    const signed = createSignedLocalRequest('download', objectKey, expiresInSeconds);
    return {
      url: `/api/v1/documents/local-download?objectKey=${encodeURIComponent(objectKey)}&expires=${signed.expiresAt}&signature=${signed.signature}`,
      method: 'GET',
      objectKey,
      expiresInSeconds
    };
  }

  async copyObject({ sourceKey, destinationKey }) {
    const source = this.resolve(sourceKey);
    const destination = this.resolve(destinationKey);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    return { copied: true };
  }

  async getObjectMetadata({ objectKey }) {
    const stat = await fs.stat(this.resolve(objectKey));
    return {
      size: stat.size,
      modifiedAt: stat.mtime.toISOString()
    };
  }
}

module.exports = {
  LocalStorageProvider,
  createSignedLocalRequest,
  verifySignedLocalRequest
};
