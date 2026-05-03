const crypto = require('crypto');
const fs = require('fs');

function hashBuffer(buffer, algorithm = process.env.DOCUMENT_HASH_ALGORITHM || 'sha256') {
  return crypto.createHash(algorithm).update(buffer).digest('hex');
}

function hashStream(stream, algorithm = process.env.DOCUMENT_HASH_ALGORITHM || 'sha256') {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function hashFile(filePath, algorithm = process.env.DOCUMENT_HASH_ALGORITHM || 'sha256') {
  return hashStream(fs.createReadStream(filePath), algorithm);
}

function verifyChecksum(input, expectedChecksum, algorithm = process.env.DOCUMENT_HASH_ALGORITHM || 'sha256') {
  const actual = Buffer.isBuffer(input) ? hashBuffer(input, algorithm) : String(input);
  return actual === expectedChecksum;
}

module.exports = {
  hashBuffer,
  hashStream,
  hashFile,
  verifyChecksum
};
