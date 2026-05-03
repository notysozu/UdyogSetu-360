const DOCUMENT_STATUSES = Object.freeze({
  DRAFT: 'draft',
  UPLOADED: 'uploaded',
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  SUPERSEDED: 'superseded',
  QUARANTINED: 'quarantined',
  DELETED: 'deleted'
});

const DOCUMENT_STATUS_VALUES = Object.freeze(Object.values(DOCUMENT_STATUSES));

module.exports = { DOCUMENT_STATUSES, DOCUMENT_STATUS_VALUES };
