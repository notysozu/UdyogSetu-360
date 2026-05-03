const service = require('../services/notification.service');
const { validateCreateNotificationBody } = require('../validators/notification.validators');

function contextFromRequest(req) {
  return {
    userId: req.get('x-user-id') || null,
    role: req.get('x-user-role') || null,
    correlationId: req.correlationId || null,
    requestId: req.requestId || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
    user: {
      actorType: 'user',
      actorId: req.get('x-user-id') || null,
      role: req.get('x-user-role') || null
    }
  };
}

async function list(req, res, next) {
  try {
    const user = {
      id: req.get('x-user-id') || null,
      _id: req.get('x-user-id') || null,
      role: req.get('x-user-role') || null,
      primaryRole: req.get('x-user-role') || null,
      departmentCode: req.get('x-department-code') || null
    };
    const data = await service.listUserNotifications(user, req.query || {}, {
      page: req.query.page || 1,
      limit: req.query.limit || 25
    }, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const errors = validateCreateNotificationBody(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, error: { message: errors[0] }, data: null });
    const data = await service.queueNotification(req.body, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function send(req, res, next) {
  try {
    const data = req.body?.notificationId
      ? await service.sendNotification(req.body.notificationId, contextFromRequest(req))
      : await service.sendBulkNotifications(req.body?.notifications || [], contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function read(req, res, next) {
  try {
    const user = {
      id: req.get('x-user-id') || null,
      _id: req.get('x-user-id') || null,
      role: req.get('x-user-role') || null,
      primaryRole: req.get('x-user-role') || null
    };
    const data = await service.markRead(req.params.notificationId || req.params.id, user, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    const user = {
      id: req.get('x-user-id') || null,
      _id: req.get('x-user-id') || null,
      role: req.get('x-user-role') || null,
      primaryRole: req.get('x-user-role') || null
    };
    const data = await service.markAllRead(user, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function retry(req, res, next) {
  try {
    const data = await service.retryFailedNotification(req.params.notificationId, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const data = await service.cancelNotification(req.params.notificationId, req.body?.reason, contextFromRequest(req));
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  create,
  send,
  read,
  markAllRead,
  retry,
  cancel
};
