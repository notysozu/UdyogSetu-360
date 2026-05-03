const { z } = require('zod');

const correlationParams = z.object({
  correlationId: z.string().min(8).max(128)
});

const caseParams = z.object({
  caseId: z.string().min(3).max(100)
});

module.exports = {
  correlationParams,
  caseParams
};
