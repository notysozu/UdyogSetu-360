const Notification = require('../../../../services/notification-service/src/models/Notification');
const mongoose = require('mongoose');
const { buildMockInvestorPortalData } = require('../mock/investor.mock');

async function getInvestorNotifications(user, filter = {}) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).notifications;
  }
  const query = { recipientUserId: user.id };
  if (filter.scope === 'unread') query.readAt = null;
  const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100).catch(() => []);
  if (!notifications.length && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).notifications;
  }
  return notifications;
}

async function markRead(user, notificationId) {
  if (mongoose.connection.readyState !== 1) return { _id: notificationId, readAt: new Date() };
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipientUserId: user.id },
    { $set: { readAt: new Date(), status: 'read' } },
    { new: true }
  ).catch(() => null);
}

async function markAllRead(user) {
  if (mongoose.connection.readyState !== 1) return { acknowledged: true };
  return Notification.updateMany({ recipientUserId: user.id, readAt: null }, { $set: { readAt: new Date(), status: 'read' } }).catch(() => null);
}

module.exports = {
  getInvestorNotifications,
  markRead,
  markAllRead
};
