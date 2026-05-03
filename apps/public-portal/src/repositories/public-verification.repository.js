const Certificate = require('../../../../services/case-service/src/models/Certificate');
const Document = require('../../../../services/case-service/src/models/Document');
const PublicVerificationAttempt = require('../../../../services/case-service/src/models/PublicVerificationAttempt');
const mongoose = require('mongoose');

function normalizeCertificateRecord(record) {
  if (!record) return null;
  if (record.certificateNumber || record.certificateType) {
    return {
      source: 'certificate',
      certificateNumber: record.certificateNumber,
      universalCaseId: record.universalCaseId,
      departmentCode: record.departmentCode,
      certificateType: record.certificateType,
      status: record.status,
      checksum: record.checksum,
      verificationToken: record.verificationToken,
      issuedAt: record.issuedAt,
      validFrom: record.validFrom,
      validUntil: record.validUntil,
      revokedAt: record.revokedAt,
      revokeReason: record.revokeReason,
      documentId: record.documentId
    };
  }
  return {
    source: 'document',
    certificateNumber: record.certificate?.certificateNumber,
    universalCaseId: record.universalCaseId,
    departmentCode: record.certificate?.issuerDepartmentCode || record.departmentCode,
    certificateType: record.documentType,
    status: record.status === 'verified' ? 'issued' : record.status,
    checksum: record.certificate?.checksum || record.hash?.checksum,
    verificationToken: record.certificate?.verificationToken,
    issuedAt: record.certificate?.issuedAt,
    validFrom: record.certificate?.validFrom,
    validUntil: record.certificate?.validUntil,
    revokedAt: record.metadata?.revocation?.revokedAt || null,
    revokeReason: record.metadata?.revocation?.reason || null,
    documentId: record._id
  };
}

async function findByToken(verificationToken) {
  if (mongoose.connection.readyState !== 1) return null;
  const certificate = await Certificate.findOne({ verificationToken, isDeleted: false }).lean();
  if (certificate) return normalizeCertificateRecord(certificate);
  const document = await Document.findOne({ 'certificate.verificationToken': verificationToken, isDeleted: false }).lean();
  return normalizeCertificateRecord(document);
}

async function findByCertificateNumber(certificateNumber) {
  if (mongoose.connection.readyState !== 1) return null;
  const certificate = await Certificate.findOne({ certificateNumber, isDeleted: false }).lean();
  if (certificate) return normalizeCertificateRecord(certificate);
  const document = await Document.findOne({ 'certificate.certificateNumber': certificateNumber, isDeleted: false }).lean();
  return normalizeCertificateRecord(document);
}

async function findByCertificateNumberAndCase(certificateNumber, universalCaseId) {
  if (mongoose.connection.readyState !== 1) return null;
  const certificate = await Certificate.findOne({ certificateNumber, universalCaseId, isDeleted: false }).lean();
  if (certificate) return normalizeCertificateRecord(certificate);
  const document = await Document.findOne({
    'certificate.certificateNumber': certificateNumber,
    universalCaseId,
    isDeleted: false
  }).lean();
  return normalizeCertificateRecord(document);
}

function createAttempt(data) {
  if (mongoose.connection.readyState !== 1) return Promise.resolve({ ...data, _id: null });
  return PublicVerificationAttempt.create(data);
}

function findAttemptByVerificationId(verificationId) {
  if (mongoose.connection.readyState !== 1) return Promise.resolve(null);
  return PublicVerificationAttempt.findOne({ verificationId }).lean();
}

function countRecentFailedAttemptsByIpHash(ipAddressHash, windowMs) {
  if (mongoose.connection.readyState !== 1) return Promise.resolve(0);
  return PublicVerificationAttempt.countDocuments({
    ipAddressHash,
    success: false,
    createdAt: { $gte: new Date(Date.now() - windowMs) }
  });
}

module.exports = {
  findByToken,
  findByCertificateNumber,
  findByCertificateNumberAndCase,
  createAttempt,
  findAttemptByVerificationId,
  countRecentFailedAttemptsByIpHash
};
