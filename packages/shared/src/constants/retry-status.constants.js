const RETRY_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  DEAD_LETTERED: 'dead_lettered',
  CANCELLED: 'cancelled'
});

module.exports = {
  RETRY_STATUSES,
  RETRY_STATUS_VALUES: Object.freeze(Object.values(RETRY_STATUSES))
};
