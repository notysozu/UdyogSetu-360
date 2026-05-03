const { z, objectId } = require('./shared.validators');

const ingestEventBody = z.object({
  id: z.string().trim().min(1),
  source: z.string().trim().min(1),
  specversion: z.string().trim().min(1),
  type: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  time: z.string().datetime(),
  datacontenttype: z.string().trim().min(1),
  data: z.record(z.any())
});

const eventIdParams = z.object({ eventId: z.string().trim().min(1) });
const caseEventsParams = z.object({ caseId: z.union([objectId, z.string().trim()]) });
const integrationCallbackParams = z.object({
  departmentCode: z.enum(['pollution', 'power', 'fire', 'industrial_safety', 'labour'])
});
const n8nWebhookParams = z.object({ workflowCode: z.string().trim().min(1) });
const replayEventsBody = z.object({
  universalCaseId: z.string().trim().min(1).optional(),
  aggregateType: z.string().trim().min(1).optional(),
  aggregateId: z.string().trim().min(1).optional(),
  eventName: z.string().trim().min(1).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  reason: z.string().trim().min(3),
  dryRun: z.boolean().optional(),
  republish: z.boolean().optional()
});

module.exports = {
  ingestEventBody,
  eventIdParams,
  caseEventsParams,
  integrationCallbackParams,
  n8nWebhookParams,
  replayEventsBody
};
