const { z } = require('zod');
const { DEPARTMENT_CODE_VALUES } = require('../constants/department.constants');
const {
  RABBITMQ_ALLOWED_ROUTING_KEYS,
  RABBITMQ_MESSAGE_TYPES,
  RABBITMQ_DELIVERY_JOB_TYPES
} = require('../constants/rabbitmq.constants');

const universalCaseIdSchema = z
  .string()
  .regex(/^US360-[A-Z]{2}-\d{4}-\d{6}$/, 'Invalid universalCaseId format')
  .optional()
  .nullable();

const entitySchema = z
  .object({
    entityType: z.string().min(1).optional().nullable(),
    entityId: z.string().min(1).optional().nullable(),
    universalCaseId: universalCaseIdSchema
  })
  .optional()
  .nullable();

const queueMessageEnvelopeSchema = z.object({
  messageId: z.string().min(1),
  messageType: z.enum(Object.values(RABBITMQ_MESSAGE_TYPES)),
  source: z.string().min(1),
  correlationId: z.string().min(1),
  causationId: z.string().nullable().optional(),
  idempotencyKey: z.string().min(1),
  createdAt: z.string().datetime(),
  notBefore: z.string().datetime().nullable().optional(),
  attempt: z.number().int().min(0),
  maxAttempts: z.number().int().min(1).max(50),
  departmentCode: z.enum(DEPARTMENT_CODE_VALUES).nullable().optional(),
  routingKey: z.enum(RABBITMQ_ALLOWED_ROUTING_KEYS),
  entity: entitySchema,
  payload: z.record(z.any()).or(z.array(z.any())).or(z.object({}).passthrough()),
  metadata: z.record(z.any()).optional().default({})
});

const departmentDeliveryJobSchema = z.object({
  jobType: z.enum(Object.values(RABBITMQ_DELIVERY_JOB_TYPES)),
  departmentCode: z.enum(DEPARTMENT_CODE_VALUES),
  caseId: z.string().min(1).optional().nullable(),
  taskId: z.string().min(1).optional().nullable(),
  universalCaseId: universalCaseIdSchema,
  canonicalPayload: z.object({}).passthrough()
});

const callbackReconciliationJobSchema = z.object({
  departmentCode: z.enum(DEPARTMENT_CODE_VALUES),
  externalReferenceId: z.string().min(1).optional().nullable(),
  universalCaseId: universalCaseIdSchema,
  taskId: z.string().min(1).optional().nullable(),
  callbackType: z.string().min(1),
  status: z.string().min(1),
  remarks: z.string().optional().nullable(),
  documents: z.array(z.object({}).passthrough()).optional().default([]),
  receivedAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional().default({})
});

const requeueRequestSchema = z.object({
  reason: z.string().min(3),
  force: z.boolean().optional().default(false)
});

const publishTestDeliverySchema = z.object({
  department: z.enum(DEPARTMENT_CODE_VALUES),
  case: z.string().min(1),
  jobType: z.enum(Object.values(RABBITMQ_DELIVERY_JOB_TYPES)).optional().default('submit')
});

const publishTestCallbackSchema = z.object({
  department: z.enum(DEPARTMENT_CODE_VALUES),
  case: z.string().min(1),
  type: z.string().min(1)
});

function validateSchema(schema, payload) {
  return schema.parse(payload);
}

module.exports = {
  queueMessageEnvelopeSchema,
  departmentDeliveryJobSchema,
  callbackReconciliationJobSchema,
  requeueRequestSchema,
  publishTestDeliverySchema,
  publishTestCallbackSchema,
  validateSchema
};
