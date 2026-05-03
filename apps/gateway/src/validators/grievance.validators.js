const { z, objectId, paginationQuery } = require('./shared.validators');

const createGrievanceBody = z.object({
  caseId: objectId.optional(),
  universalCaseId: z.string().trim().optional(),
  departmentCode: z.enum(['pollution', 'power', 'fire', 'industrial_safety', 'labour']).optional(),
  category: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  attachments: z.array(objectId).optional()
});

const grievanceIdParams = z.object({ grievanceId: objectId });
const grievanceMessageBody = z.object({
  message: z.string().trim().min(1),
  attachments: z.array(objectId).optional()
});
const grievanceStatusBody = z.object({
  status: z.enum(['open', 'acknowledged', 'in_review', 'awaiting_response', 'resolved', 'rejected', 'reopened', 'closed'])
});

module.exports = {
  createGrievanceBody,
  grievanceIdParams,
  grievanceMessageBody,
  grievanceStatusBody,
  listGrievancesQuery: paginationQuery
};
