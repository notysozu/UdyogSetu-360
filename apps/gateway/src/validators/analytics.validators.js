const { z } = require('zod');

const dateString = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional();

const analyticsQuery = z.object({
  fromDate: dateString,
  toDate: dateString,
  departmentCode: z.enum(['pollution', 'power', 'fire', 'industrial_safety', 'labour']).optional(),
  district: z.string().trim().max(120).optional(),
  sector: z.string().trim().max(120).optional(),
  caseType: z.string().trim().max(120).optional(),
  stage: z.string().trim().max(120).optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional(),
  includePii: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).max(100000).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  sort: z.string().trim().max(80).optional(),
  order: z.enum(['asc', 'desc']).optional()
});

const exportBody = z.object({
  exportType: z.enum([
    'overview',
    'bottlenecks',
    'document_defects',
    'department_turnaround',
    'rejection_reasons',
    'query_ageing',
    'officer_workload',
    'escalation_frequency',
    'investor_history',
    'review_pack'
  ]),
  format: z.enum(['csv', 'json', 'html_print', 'xlsx']).default('csv'),
  filters: analyticsQuery.optional(),
  includePii: z.boolean().optional()
});

const rebuildBody = z.object({
  projectionName: z
    .enum([
      'daily_rollup',
      'department_turnaround',
      'bottlenecks',
      'document_defects',
      'rejection_reasons',
      'query_ageing',
      'officer_workload',
      'escalation_frequency',
      'investor_history'
    ])
    .optional(),
  fromDate: dateString,
  toDate: dateString,
  reason: z.string().trim().min(3).max(500),
  dryRun: z.boolean().optional()
});

module.exports = { analyticsQuery, exportBody, rebuildBody };
