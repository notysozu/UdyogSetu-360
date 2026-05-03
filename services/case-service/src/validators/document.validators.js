const mongoose = require('mongoose');
const {
  DOCUMENT_TYPE_VALUES
} = require('../../../../packages/shared/src');

const dangerousExtensions = new Set(['.exe', '.sh', '.bat', '.cmd', '.js', '.msi', '.dll', '.scr', '.jar']);

function assert(condition, message, statusCode = 400) {
  if (!condition) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

function validateObjectId(value, fieldName = 'id') {
  assert(mongoose.Types.ObjectId.isValid(value), `${fieldName} must be a valid ObjectId.`);
  return value;
}

function validateDocumentType(value) {
  assert(DOCUMENT_TYPE_VALUES.includes(value), `Unsupported documentType: ${value}`);
  return value;
}

function validateTags(tags) {
  if (tags == null) return [];
  assert(Array.isArray(tags), 'tags must be an array.');
  return tags.map((tag) => String(tag).trim()).filter(Boolean);
}

function validateUploadInput(input = {}) {
  validateDocumentType(input.documentType);
  return {
    ...input,
    tags: validateTags(input.tags)
  };
}

function validateFile(file) {
  assert(file, 'file is required.');
  const maxSizeBytes = Number(process.env.DOCUMENT_MAX_FILE_SIZE_MB || 25) * 1024 * 1024;
  const allowedMimeTypes = String(process.env.DOCUMENT_ALLOWED_MIME_TYPES || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const extension = (file.originalname.match(/\.[^.]+$/) || [''])[0].toLowerCase();
  assert(file.size > 0, 'file.size must be positive.');
  assert(file.size <= maxSizeBytes, 'file exceeds the maximum allowed size.', 413);
  if (allowedMimeTypes.length) {
    assert(allowedMimeTypes.includes(file.mimetype), `Unsupported mime type: ${file.mimetype}`);
  }
  assert(!dangerousExtensions.has(extension), `Blocked file extension: ${extension}`);
  return file;
}

function validateMetadataPatch(patch = {}) {
  const allowed = ['title', 'description', 'tags', 'visibility', 'permissions', 'retention', 'metadata'];
  const invalid = Object.keys(patch).filter((key) => !allowed.includes(key));
  assert(!invalid.length, `Protected or unsupported fields in metadata patch: ${invalid.join(', ')}`);
  return patch;
}

module.exports = {
  validateObjectId,
  validateDocumentType,
  validateTags,
  validateUploadInput,
  validateFile,
  validateMetadataPatch
};
