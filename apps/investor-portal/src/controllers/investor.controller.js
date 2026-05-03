const User = require('../../../../web/src/models/User');
const dashboardService = require('../services/investor-dashboard.service');

function requestContext(req) {
  return {
    user: req.user,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function showDashboard(req, res) {
  const [summary, recentCases, pendingActions, timelineHighlights, renewalReminders, notifications] = await Promise.all([
    dashboardService.getDashboardSummary(req.user, requestContext(req)),
    dashboardService.getRecentCases(req.user, requestContext(req)),
    dashboardService.getPendingActions(req.user, requestContext(req)),
    dashboardService.getTimelineHighlights(req.user, requestContext(req)),
    dashboardService.getRenewalReminders(req.user, requestContext(req)),
    dashboardService.getNotificationPreview(req.user, requestContext(req))
  ]);
  res.render('dashboard/investor-dashboard', {
    title: 'Dashboard',
    summary,
    recentCases,
    pendingActions,
    timelineHighlights,
    renewalReminders,
    notifications,
    today: new Date()
  });
}

function showProfile(req, res) {
  res.render('profile/profile', {
    title: 'Profile',
    profile: req.userDoc || req.user
  });
}

async function updateProfile(req, res) {
  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      name: req.body.name,
      phone: req.body.phone,
      organisation: req.body.organisation
    }
  }).catch(() => null);
  req.flash('success', 'Profile updated successfully.');
  res.redirect('/profile');
}

function showSettings(req, res) {
  res.render('profile/settings', {
    title: 'Settings',
    settings: req.userDoc?.preferences || {}
  });
}

async function updateLanguage(req, res) {
  const locale = ['en', 'kn', 'hi'].includes(req.body.language) ? req.body.language : 'en';
  res.cookie('us360_language', locale, { sameSite: 'lax', maxAge: 365 * 24 * 60 * 60 * 1000 });
  await User.findByIdAndUpdate(req.user.id, { $set: { locale } }).catch(() => null);
  req.flash('success', 'Language preference updated.');
  res.redirect(req.get('referer') || '/settings');
}

async function updateNotificationPreferences(req, res) {
  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      'preferences.notificationPreferences': {
        email: req.body.email === 'on',
        sms: req.body.sms === 'on',
        inApp: req.body.inApp === 'on'
      }
    }
  }).catch(() => null);
  req.flash('success', 'Notification preferences updated.');
  res.redirect('/settings');
}

module.exports = {
  showDashboard,
  showProfile,
  updateProfile,
  showSettings,
  updateLanguage,
  updateNotificationPreferences
};
