const CERTIFICATE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  ISSUED: 'issued',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
  SUPERSEDED: 'superseded'
});

const CERTIFICATE_STATUS_VALUES = Object.freeze(Object.values(CERTIFICATE_STATUSES));

module.exports = { CERTIFICATE_STATUSES, CERTIFICATE_STATUS_VALUES };
