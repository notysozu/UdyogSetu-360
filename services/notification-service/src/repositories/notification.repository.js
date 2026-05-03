const Notification = require('../models/Notification');
const { createRepository, buildPagination } = require('../../../case-service/src/repositories/base.repository');

const repository = createRepository(Notification);

repository.findUnreadForUser = function findUnreadForUser(recipientUserId, limit = 50) {
  return Notification.find({
    recipientUserId,
    status: { $ne: 'read' },
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

repository.findQueued = function findQueued(now = new Date(), limit = 100) {
  return Notification.find({
    status: 'queued',
    isDeleted: false,
    $or: [{ scheduledFor: null }, { scheduledFor: { $lte: now } }]
  })
    .sort({ priority: -1, createdAt: 1 })
    .limit(limit);
};

repository.listUserNotifications = async function listUserNotifications(user, filters = {}, pagination = {}) {
  const { skip, limit, page } = buildPagination(pagination);
  const role = user.primaryRole || user.role;
  const query = { isDeleted: false, ...filters };
  if (role === 'investor') query.recipientUserId = user.id || user._id;
  else if (role === 'department_officer' || role === 'department_supervisor') {
    query.$or = [{ recipientUserId: user.id || user._id }, { recipientDepartmentCode: user.departmentCode }];
  } else if (role === 'auditor') query.recipientRole = 'auditor';
  const [items, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query)
  ]);
  return { items, total, page, limit };
};

repository.markAllReadForUser = function markAllReadForUser(user) {
  return Notification.updateMany(
    {
      recipientUserId: user.id || user._id,
      status: { $ne: 'read' },
      isDeleted: false
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      }
    }
  );
};

module.exports = repository;
