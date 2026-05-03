const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  WEBHOOK: 'webhook'
});

const NOTIFICATION_STATUSES = Object.freeze({
  DRAFT: 'draft',
  QUEUED: 'queued',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  READ: 'read',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
});

const NOTIFICATION_PRIORITIES = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
});

module.exports = {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_CHANNEL_VALUES: Object.freeze(Object.values(NOTIFICATION_CHANNELS)),
  NOTIFICATION_STATUSES,
  NOTIFICATION_STATUS_VALUES: Object.freeze(Object.values(NOTIFICATION_STATUSES)),
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_PRIORITY_VALUES: Object.freeze(Object.values(NOTIFICATION_PRIORITIES))
};
