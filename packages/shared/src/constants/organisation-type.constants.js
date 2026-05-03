const ORGANISATION_TYPES = Object.freeze({
  PROPRIETORSHIP: 'proprietorship',
  PARTNERSHIP: 'partnership',
  LLP: 'llp',
  PRIVATE_LIMITED: 'private_limited',
  PUBLIC_LIMITED: 'public_limited',
  TRUST: 'trust',
  SOCIETY: 'society',
  GOVERNMENT: 'government',
  OTHER: 'other'
});

const ORGANISATION_TYPE_VALUES = Object.freeze(Object.values(ORGANISATION_TYPES));

module.exports = { ORGANISATION_TYPES, ORGANISATION_TYPE_VALUES };
