const SLA_TIMER_STATUSES = Object.freeze({
  RUNNING: 'running',
  PAUSED: 'paused',
  WARNING: 'warning',
  BREACHED: 'breached',
  ESCALATED: 'escalated',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

module.exports = {
  SLA_TIMER_STATUSES,
  SLA_TIMER_STATUS_VALUES: Object.freeze(Object.values(SLA_TIMER_STATUSES))
};
