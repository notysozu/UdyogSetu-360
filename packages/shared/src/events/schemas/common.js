const { z } = require('zod');

function isStrictMode() {
  return String(process.env.EVENT_SCHEMA_STRICT_MODE || 'true').toLowerCase() === 'true';
}

function object(shape) {
  return isStrictMode() ? z.object(shape).strict() : z.object(shape).passthrough();
}

const actorSchema = object({
  actorType: z.string().trim().min(1),
  actorId: z.string().trim().min(1),
  role: z.string().trim().min(1).optional()
});

const eventDataSchema = object({
  eventVersion: z.number().int().positive(),
  aggregateType: z.string().trim().min(1),
  aggregateId: z.string().trim().min(1),
  universalCaseId: z.string().trim().min(1).optional().nullable(),
  previousStatus: z.string().trim().min(1).optional().nullable(),
  nextStatus: z.string().trim().min(1).optional().nullable(),
  actor: actorSchema.optional().nullable(),
  payload: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({})
});

const envelopeSchema = object({
  id: z.string().trim().min(1),
  source: z.string().trim().min(1),
  specversion: z.literal('1.0'),
  type: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  time: z.string().datetime(),
  datacontenttype: z.literal('application/json'),
  dataschema: z.string().trim().min(1).optional(),
  correlationid: z.string().trim().min(1),
  causationid: z.string().trim().min(1).optional().nullable(),
  traceparent: z.string().trim().min(1).optional().nullable(),
  partitionkey: z.string().trim().min(1),
  data: eventDataSchema
});

module.exports = {
  z,
  object,
  actorSchema,
  eventDataSchema,
  envelopeSchema,
  isStrictMode
};
