const { z } = require('../middleware/validation.middleware');

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ObjectId.');
const universalCaseId = z
  .string()
  .min(6)
  .max(64)
  .regex(/^[A-Za-z0-9-]+$/, 'Invalid universalCaseId format.');
const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().trim().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().trim().optional(),
  departmentCode: z.string().trim().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});

module.exports = { z, objectId, universalCaseId, paginationQuery };
