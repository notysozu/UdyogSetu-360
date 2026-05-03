const { z, objectId, paginationQuery } = require('./shared.validators');

const taskIdParams = z.object({ taskId: objectId });
const listTasksQuery = paginationQuery.extend({
  assignedOfficerId: objectId.optional()
});
const updateTaskBody = z.object({
  status: z.string().trim().optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  metadata: z.record(z.any()).optional()
});
const assignTaskBody = z.object({ officerId: objectId });
const raiseQueryBody = z.object({ message: z.string().trim().min(1) });
const respondQueryBody = z.object({
  message: z.string().trim().min(1),
  attachments: z.array(objectId).optional()
});
const scheduleInspectionBody = z.object({
  scheduledAt: z.string().datetime(),
  location: z.string().trim().min(1)
});
const decisionBody = z.object({ reason: z.string().trim().min(1) });

module.exports = {
  taskIdParams,
  listTasksQuery,
  updateTaskBody,
  assignTaskBody,
  raiseQueryBody,
  respondQueryBody,
  scheduleInspectionBody,
  decisionBody
};
