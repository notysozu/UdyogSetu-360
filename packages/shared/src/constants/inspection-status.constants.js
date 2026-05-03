const INSPECTION_STATUSES = Object.freeze({
  REQUESTED: 'requested',
  SCHEDULED: 'scheduled',
  RESCHEDULED: 'rescheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
});

const INSPECTION_STATUS_VALUES = Object.freeze(Object.values(INSPECTION_STATUSES));

module.exports = { INSPECTION_STATUSES, INSPECTION_STATUS_VALUES };
