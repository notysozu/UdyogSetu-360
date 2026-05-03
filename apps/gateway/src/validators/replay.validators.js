const { z } = require('zod');

const replayBody = z.object({
  reason: z.string().min(3).max(500),
  mode: z.enum(['dry_run', 'republish', 'reprocess_handlers', 'rebuild_projection']).optional(),
  dryRun: z.boolean().optional(),
  confirmProductionReplay: z.boolean().optional(),
  filter: z.record(z.any()).optional()
});

module.exports = { replayBody };
