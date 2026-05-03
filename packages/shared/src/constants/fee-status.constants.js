const FEE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  DEMANDED: 'demanded',
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  WAIVED: 'waived'
});

const FEE_STATUS_VALUES = Object.freeze(Object.values(FEE_STATUSES));

module.exports = { FEE_STATUSES, FEE_STATUS_VALUES };
