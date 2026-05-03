const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const {
  hashBuffer,
  hashFile,
  verifyChecksum
} = require('../src/documents/document-hash.service');

test('SHA256 hash is generated for buffers', () => {
  const checksum = hashBuffer(Buffer.from('udyogsetu'));
  assert.equal(checksum.length, 64);
  assert.equal(verifyChecksum(Buffer.from('udyogsetu'), checksum), true);
  assert.equal(verifyChecksum(Buffer.from('other'), checksum), false);
});

test('hashFile returns stable checksum for file contents', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'us360-doc-hash-'));
  const filePath = path.join(tempDir, 'sample.txt');
  await fs.writeFile(filePath, 'document body');

  const checksum = await hashFile(filePath);

  assert.equal(checksum, hashBuffer(Buffer.from('document body')));
});
