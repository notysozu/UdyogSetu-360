const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Document = require('../src/models/Document');
const DocumentAccessLog = require('../src/models/DocumentAccessLog');
const DigiLockerConsent = require('../src/models/DigiLockerConsent');
const DigiLockerReconciliationLog = require('../src/models/DigiLockerReconciliationLog');

test('document schema enforces version minimum and uploaded checksum', async () => {
  const doc = new Document({
    caseId: new mongoose.Types.ObjectId(),
    documentType: 'project_report',
    status: 'uploaded',
    visibility: 'private',
    version: 0,
    storage: {
      provider: 's3',
      objectKey: 'cases/demo/project_report/v1/demo-report.pdf'
    },
    file: {
      originalName: 'report.pdf',
      storedName: 'report.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10
    },
    hash: {
      algorithm: 'sha256'
    }
  });

  await assert.rejects(() => doc.validate(), /hash.checksum is required after upload|version must be at least 1/);
});

test('document schema exposes unique sparse indexes for storage and certificates', () => {
  const indexes = Document.schema.indexes();
  assert.ok(indexes.some(([fields, options]) => fields['storage.objectKey'] === 1 && options.unique));
  assert.ok(indexes.some(([fields, options]) => fields['certificate.certificateNumber'] === 1 && options.unique));
  assert.ok(indexes.some(([fields, options]) => fields['certificate.verificationToken'] === 1 && options.unique));
});

test('document soft-delete fields and access log indexes exist', () => {
  assert.equal(Document.schema.path('isDeleted').instance, 'Boolean');
  const accessIndexes = DocumentAccessLog.schema.indexes();
  assert.ok(accessIndexes.some(([fields]) => fields.documentId === 1 && fields.createdAt === -1));
});

test('digilocker consent and reconciliation schemas expose required identifiers', () => {
  const consentIndexes = DigiLockerConsent.schema.indexes();
  const reconciliationIndexes = DigiLockerReconciliationLog.schema.indexes();
  assert.ok(consentIndexes.some(([fields, options]) => fields.consentId === 1 && options.unique));
  assert.ok(reconciliationIndexes.some(([fields, options]) => fields.reconciliationId === 1 && options.unique));
});
