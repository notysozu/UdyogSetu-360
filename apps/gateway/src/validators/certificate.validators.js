const { z, objectId } = require('./shared.validators');

const verifyCertificateBody = z
  .object({
    certificateNumber: z.string().trim().optional(),
    verificationToken: z.string().trim().optional(),
    universalCaseId: z.string().trim().optional(),
    checksum: z.string().trim().optional()
  })
  .refine(
    (value) =>
      Boolean(value.certificateNumber || value.verificationToken || (value.universalCaseId && value.checksum)),
    'Provide certificateNumber, verificationToken, or universalCaseId with checksum.'
  );

const certificateNumberParams = z.object({ certificateNumber: z.string().trim().min(1) });
const caseCertificatesParams = z.object({ caseId: z.union([objectId, z.string().trim()]) });

module.exports = {
  verifyCertificateBody,
  certificateNumberParams,
  caseCertificatesParams
};
