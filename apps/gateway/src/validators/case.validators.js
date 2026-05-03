const { z, objectId, universalCaseId, paginationQuery } = require('./shared.validators');

const createCaseBody = z.object({
  organisationId: objectId.optional(),
  caseType: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  sourceSystem: z.string().trim().optional(),
  sourceReferenceId: z.string().trim().optional(),
  requiredDepartments: z
    .array(
      z.object({
        departmentCode: z.string().trim(),
        reason: z.string().trim().optional(),
        requiredApprovalType: z.string().trim().optional(),
        isMandatory: z.boolean().optional()
      })
    )
    .optional(),
  applicantDetails: z.record(z.any()).optional(),
  enterpriseDetails: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional()
});

const caseIdParams = z.object({
  caseId: z.union([objectId, universalCaseId])
});

const updateCaseBody = z
  .object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    metadata: z.record(z.any()).optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional()
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided.');

const amendCaseBody = z.object({
  amendmentReason: z.string().trim().min(1),
  patch: z.record(z.any()),
  supportingDocumentIds: z.array(objectId).optional()
});

module.exports = {
  createCaseBody,
  caseIdParams,
  updateCaseBody,
  amendCaseBody,
  listCasesQuery: paginationQuery
};
