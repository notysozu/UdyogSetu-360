const { z } = require('zod');

const exportBody = z.object({
  format: z.enum(['json', 'csv', 'html_print']).default('json'),
  filter: z.record(z.any()).optional()
});

module.exports = { exportBody };
