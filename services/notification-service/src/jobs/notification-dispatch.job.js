const notificationService = require('../services/notification.service');

async function runNotificationDispatchJob(context = {}) {
  return notificationService.dispatchQueuedNotifications(new Date(), context);
}

module.exports = { runNotificationDispatchJob };
