const notificationService = require('../services/investor-notification.service');

async function listNotifications(req, res) {
  const notifications = await notificationService.getInvestorNotifications(req.user, req.query || {});
  res.render('notifications/notification-list', {
    title: 'Notifications',
    notifications,
    filters: req.query || {}
  });
}

async function markNotificationRead(req, res) {
  await notificationService.markRead(req.user, req.params.notificationId);
  if (req.xhr || req.get('accept')?.includes('application/json')) {
    return res.json({ ok: true });
  }
  res.redirect(req.get('referer') || '/notifications');
}

async function markAllRead(req, res) {
  await notificationService.markAllRead(req.user);
  if (req.xhr || req.get('accept')?.includes('application/json')) {
    return res.json({ ok: true });
  }
  res.redirect('/notifications');
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllRead
};
