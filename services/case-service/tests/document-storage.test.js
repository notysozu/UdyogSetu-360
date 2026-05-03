const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const {
  sanitizeFileName,
  buildDocumentObjectKey
} = require('../src/documents/document-object-key.util');
const {
  LocalStorageProvider,
  verifySignedLocalRequest
} = require('../src/storage/local-storage.provider');

test('object key sanitisation removes traversal and unsafe characters', () => {
  assert.equal(sanitizeFileName('../../Project Report (Final).pdf'), 'Project-Report-Final.pdf');
  assert.equal(
    buildDocumentObjectKey({
      universalCaseId: 'US360-KA-2026-000001',
      documentType: 'project_report',
      version: 2,
      documentId: 'abc123',
      fileName: '../../Project Report (Final).pdf'
    }),
    'cases/US360-KA-2026-000001/project_report/v2/abc123-Project-Report-Final.pdf'
  );
});

test('local provider generates verifiable signed upload and download urls', async () => {
  const provider = new LocalStorageProvider({ baseDir: path.join(os.tmpdir(), 'us360-doc-tests-signing') });
  const upload = await provider.createSignedUploadUrl({
    objectKey: 'cases/demo/project_report/v1/doc-file.pdf',
    contentType: 'application/pdf',
    expiresInSeconds: 60
  });
  const download = await provider.createSignedDownloadUrl({
    objectKey: 'cases/demo/project_report/v1/doc-file.pdf',
    expiresInSeconds: 60
  });

  const uploadUrl = new URL(upload.url, 'http://localhost');
  const downloadUrl = new URL(download.url, 'http://localhost');

  assert.equal(
    verifySignedLocalRequest({
      operation: 'upload',
      objectKey: uploadUrl.searchParams.get('objectKey'),
      expiresAt: uploadUrl.searchParams.get('expires'),
      signature: uploadUrl.searchParams.get('signature')
    }),
    true
  );
  assert.equal(
    verifySignedLocalRequest({
      operation: 'download',
      objectKey: downloadUrl.searchParams.get('objectKey'),
      expiresAt: downloadUrl.searchParams.get('expires'),
      signature: downloadUrl.searchParams.get('signature')
    }),
    true
  );
});

test('local provider fallback can round-trip a stored file', async () => {
  const baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'us360-doc-local-'));
  const provider = new LocalStorageProvider({ baseDir });
  await provider.initialise();
  await provider.putObject({
    objectKey: 'cases/US360-KA-2026-000001/project_report/v1/doc-file.txt',
    body: Buffer.from('hello world'),
    contentType: 'text/plain'
  });

  const exists = await provider.objectExists({
    objectKey: 'cases/US360-KA-2026-000001/project_report/v1/doc-file.txt'
  });
  const object = await provider.getObject({
    objectKey: 'cases/US360-KA-2026-000001/project_report/v1/doc-file.txt'
  });

  assert.equal(exists, true);
  assert.equal(object.Body.toString('utf8'), 'hello world');
});
