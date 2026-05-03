const { z, objectId } = require('./shared.validators');

const uploadDocumentBody = z.object({
  caseId: objectId.optional(),
  taskId: objectId.optional(),
  universalCaseId: z.string().trim().optional(),
  organisationId: objectId.optional(),
  documentType: z.string().trim().min(1),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  storageProvider: z.string().trim().optional(),
  bucket: z.string().trim().optional(),
  objectKey: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().optional(),
  fileSize: z.coerce.number().positive(),
  checksum: z.string().trim().min(1),
  metadata: z.record(z.any()).optional()
});

const documentIdParams = z.object({ documentId: objectId });
const caseDocumentParams = z.object({ caseId: z.union([objectId, z.string().trim()]) });
const updateDocumentBody = z.object({
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  metadata: z.record(z.any()).optional()
});
const verifyDocumentBody = z.object({
  method: z.string().trim().min(1),
  confidence: z.coerce.number().min(0).max(1).optional(),
  remarks: z.string().trim().optional()
});
const supersedeDocumentBody = z.object({ newDocumentId: objectId });

module.exports = {
  uploadDocumentBody,
  documentIdParams,
  caseDocumentParams,
  updateDocumentBody,
  verifyDocumentBody,
  supersedeDocumentBody
};
