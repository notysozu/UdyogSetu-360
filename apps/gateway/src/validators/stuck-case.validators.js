const { z } = require('zod');

const resolveBody = z.object({
  reason: z.string().min(3).max(500)
});

module.exports = { resolveBody };
