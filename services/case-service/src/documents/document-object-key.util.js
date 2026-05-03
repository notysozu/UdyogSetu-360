const path = require('path');

function sanitizeFileName(fileName = 'document.bin') {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path
    .basename(fileName, extension)
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${baseName || 'document'}${extension}`;
}

function buildDocumentObjectKey({
  universalCaseId,
  organisationId,
  documentType,
  version,
  documentId,
  fileName
}) {
  const safeName = sanitizeFileName(fileName);
  if (universalCaseId) {
    return `cases/${universalCaseId}/${documentType}/v${version}/${documentId}-${safeName}`;
  }
  return `organisations/${organisationId}/${documentType}/v${version}/${documentId}-${safeName}`;
}

module.exports = {
  sanitizeFileName,
  buildDocumentObjectKey
};
