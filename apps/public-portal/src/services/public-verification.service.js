const { createHash, timingSafeEqual, randomUUID } = require('crypto');
const mongoose = require('mongoose');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { appendDomainEvent } = require('../../../../services/case-service/src/services/event-outbox.service');
const { recordAuditEvent } = require('../../../../services/audit-service/src/services/audit.service');
const repository = require('../repositories/public-verification.repository');
const mock = require('../mock/public.mock');
const { validateVerificationInput } = require('../validators/public-verification.validators');
const { departmentLabel } = require('../helpers/view.helpers');

function hashValue(value) {
  return createHash('sha256').update(String(value || '')).digest('hex');
}

function safeEqual(a, b) {
  const aBuffer = Buffer.from(String(a || ''));
  const bBuffer = Buffer.from(String(b || ''));
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

function useMockVerification() {
  return process.env.NODE_ENV !== 'production';
}

function normalizeStatus(record) {
  if (!record) return 'not_found';
  if (record.status === 'superseded') return 'superseded';
  if (record.status === 'revoked' || record.status === 'rejected') return 'revoked';
  if (record.validUntil && new Date(record.validUntil) < new Date()) return 'expired';
  if (record.status === 'issued' || record.status === 'verified') return 'valid';
  return 'invalid';
}

function buildPublicVerificationResult(record, checksumInput) {
  const status = normalizeStatus(record);
  const checksumMatch = checksumInput ? safeEqual(record?.checksum || '', checksumInput) : null;
  const verified = status === 'valid' && (checksumInput ? checksumMatch : true);
  return {
    verified,
    status: verified ? 'valid' : checksumInput && !checksumMatch ? 'invalid' : status,
    certificateNumber: record?.certificateNumber || null,
    universalCaseId: record?.universalCaseId || null,
    issuingDepartment: record ? departmentLabel(record.departmentCode) : null,
    certificateType: record?.certificateType || null,
    issuedAt: record?.issuedAt || null,
    validFrom: record?.validFrom || null,
    validUntil: record?.validUntil || null,
    revokedAt: record?.revokedAt || null,
    revocationStatus: record?.revokedAt ? 'revoked' : null,
    checksumMatch,
    verificationTimestamp: new Date().toISOString(),
    verificationId: randomUUID(),
    publicMessage:
      verified ? 'The certificate details match our public verification records.' :
      status === 'revoked' ? 'The certificate record exists but is no longer valid.' :
      status === 'expired' ? 'The certificate record exists but has expired.' :
      status === 'superseded' ? 'This certificate has been superseded by a newer record.' :
      'No valid public verification record was found.'
  };
}

async function recordVerificationAttempt(input, result, context = {}) {
  const payload = {
    verificationId: result.verificationId,
    inputHash: hashValue(JSON.stringify(input)),
    lookupType: input.verificationToken
      ? 'verification_token'
      : input.universalCaseId
      ? 'certificate_case'
      : 'certificate_checksum',
    certificateNumberHash: input.certificateNumber ? hashValue(input.certificateNumber) : null,
    universalCaseId: input.universalCaseId || null,
    verificationTokenHash: input.verificationToken ? hashValue(input.verificationToken) : null,
    ipAddressHash: hashValue(context.ipAddress || ''),
    userAgentHash: hashValue(context.userAgent || ''),
    success: Boolean(result.verified),
    resultStatus: result.status,
    failureReason: result.verified ? null : result.status,
    correlationId: context.correlationId || null,
    metadata: {
      publicResult: {
        verified: result.verified,
        status: result.status,
        certificateNumber: result.certificateNumber,
        universalCaseId: result.universalCaseId,
        issuingDepartment: result.issuingDepartment,
        certificateType: result.certificateType,
        issuedAt: result.issuedAt,
        validFrom: result.validFrom,
        validUntil: result.validUntil,
        revokedAt: result.revokedAt,
        revocationStatus: result.revocationStatus,
        checksumMatch: result.checksumMatch,
        verificationTimestamp: result.verificationTimestamp,
        verificationId: result.verificationId,
        publicMessage: result.publicMessage
      }
    }
  };
  await repository.createAttempt(payload).catch(() => null);
}

async function emitVerificationEvent(result, context = {}) {
  if (mongoose.connection.readyState !== 1) return;
  const eventName = result.verified
    ? EVENT_NAMES.CERTIFICATE_PUBLIC_VERIFICATION_SUCCEEDED
    : EVENT_NAMES.CERTIFICATE_PUBLIC_VERIFICATION_FAILED;
  await appendDomainEvent({
    eventName,
    aggregateType: 'public_verification',
    aggregateId: result.verificationId,
    universalCaseId: result.universalCaseId || null,
    payload: {
      verificationId: result.verificationId,
      status: result.status,
      certificateNumber: result.certificateNumber || null
    }
  }, context).catch(() => {});
  if (result.verified) {
    await recordAuditEvent({
      actor: { actorType: 'public', actorId: 'public-verifier', role: 'public' },
      action: 'certificate.public_verified',
      resourceType: 'certificate',
      resourceId: result.certificateNumber || result.verificationId,
      universalCaseId: result.universalCaseId || null,
      correlationId: context.correlationId || null,
      metadata: { verificationId: result.verificationId, status: result.status }
    }).catch(() => {});
  }
}

async function verifyByToken(verificationToken, context = {}) {
  const input = validateVerificationInput({ verificationToken });
  const record = await repository.findByToken(input.verificationToken) || (useMockVerification() && safeEqual(input.verificationToken, mock.sampleCertificate.verificationToken) ? mock.sampleCertificate : null);
  const result = buildPublicVerificationResult(record, null);
  await recordVerificationAttempt(input, result, context);
  await emitVerificationEvent(result, context);
  return result;
}

async function verifyByReferenceAndCase(input, context = {}) {
  const cleaned = validateVerificationInput(input);
  const record = await repository.findByCertificateNumberAndCase(cleaned.certificateNumber, cleaned.universalCaseId) ||
    (useMockVerification() &&
      safeEqual(cleaned.certificateNumber, mock.sampleCertificate.certificateNumber) &&
      safeEqual(cleaned.universalCaseId, mock.sampleCertificate.universalCaseId)
      ? mock.sampleCertificate
      : null);
  const result = buildPublicVerificationResult(record, null);
  await recordVerificationAttempt(cleaned, result, context);
  await emitVerificationEvent(result, context);
  return result;
}

async function verifyByChecksum(input, context = {}) {
  const cleaned = validateVerificationInput(input);
  const record = await repository.findByCertificateNumber(cleaned.certificateNumber) ||
    (useMockVerification() && safeEqual(cleaned.certificateNumber, mock.sampleCertificate.certificateNumber) ? mock.sampleCertificate : null);
  const result = buildPublicVerificationResult(record, cleaned.checksum);
  await recordVerificationAttempt(cleaned, result, context);
  await emitVerificationEvent(result, context);
  return result;
}

async function verifyCertificate(input, context = {}) {
  if (mongoose.connection.readyState === 1) {
    await appendDomainEvent({
      eventName: EVENT_NAMES.CERTIFICATE_PUBLIC_VERIFICATION_REQUESTED,
      aggregateType: 'public_verification',
      aggregateId: randomUUID(),
      payload: { lookup: input.verificationToken ? 'token' : input.universalCaseId ? 'case' : 'checksum' }
    }, context).catch(() => {});
  }
  const cleaned = validateVerificationInput(input);
  if (cleaned.verificationToken) return verifyByToken(cleaned.verificationToken, context);
  if (cleaned.certificateNumber && cleaned.universalCaseId) return verifyByReferenceAndCase(cleaned, context);
  return verifyByChecksum(cleaned, context);
}

async function getVerificationResult(verificationId) {
  const attempt = await repository.findAttemptByVerificationId(verificationId);
  return attempt?.metadata?.publicResult || null;
}

module.exports = {
  validateVerificationInput,
  buildPublicVerificationResult,
  recordVerificationAttempt,
  verifyByToken,
  verifyByReferenceAndCase,
  verifyByChecksum,
  verifyCertificate,
  getVerificationResult
};
