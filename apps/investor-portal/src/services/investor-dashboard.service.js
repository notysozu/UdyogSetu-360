const Case = require('../../../../web/src/models/Case');
const ApprovalTask = require('../../../../web/src/models/ApprovalTask');
const Notification = require('../../../../web/src/models/Notification');
const Grievance = require('../../../../web/src/models/Grievance');
const Certificate = require('../../../../web/src/models/Certificate');
const EventLog = require('../../../../web/src/models/EventLog');
const mongoose = require('mongoose');
const { buildMockInvestorPortalData } = require('../mock/investor.mock');

function investorFilter(user) {
  return {
    $or: [
      { createdBy: user.id },
      { applicantUserId: user.id },
      { organisationId: user.organisationId || null }
    ]
  };
}

async function loadData(user) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user);
  }
  const filter = investorFilter(user);
  const [cases, tasks, notifications, grievances, certificates, timeline] = await Promise.all([
    Case.find(filter).sort({ lastActivityAt: -1 }).limit(50),
    ApprovalTask.find({ caseId: { $in: (await Case.find(filter).select('caseId')).map((item) => item.caseId) } }).limit(100),
    Notification.find({ user: user.id }).sort({ createdAt: -1 }).limit(20),
    Grievance.find({ raisedBy: user.id }).sort({ createdAt: -1 }).limit(20),
    Certificate.find({ $or: [{ holderName: user.name }, { enterpriseName: user.organisation || '' }] }).sort({ expiresAt: 1 }).limit(20),
    EventLog.find({ 'actor.userId': user.id }).sort({ occurredAt: -1 }).limit(20)
  ]).catch(() => [[], [], [], [], [], []]);

  if (!cases.length && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user);
  }

  return { cases, tasks, notifications, grievances, certificates, timeline };
}

async function getDashboardSummary(user) {
  const { cases, tasks, grievances, certificates } = await loadData(user);
  const activeCases = cases.filter((item) => !['approved', 'rejected', 'closed'].includes(item.status)).length;
  const pendingActions = tasks.filter((item) => ['query_raised', 'fee_demanded', 'inspection_required'].includes(item.status)).length;
  const upcomingRenewals = certificates.filter((item) => item.expiresAt && new Date(item.expiresAt) > new Date()).length;
  return {
    totalCases: cases.length,
    activeCases,
    pendingActions,
    certificatesIssued: certificates.length,
    openGrievances: grievances.filter((item) => ['open', 'in_review'].includes(item.status)).length,
    upcomingRenewals
  };
}

async function getRecentCases(user) {
  const { cases } = await loadData(user);
  return cases.slice(0, 8);
}

async function getPendingActions(user) {
  const { tasks } = await loadData(user);
  return tasks
    .filter((item) => ['query_raised', 'fee_demanded', 'inspection_required'].includes(item.status))
    .slice(0, 6)
    .map((task) => ({
      id: task._id,
      caseId: task.caseId,
      departmentCode: task.departmentCode,
      title: task.title,
      status: task.status,
      dueAt: task.dueAt,
      actionLabel:
        task.status === 'query_raised'
          ? 'Respond to query'
          : task.status === 'fee_demanded'
            ? 'Review fee demand'
            : 'Review inspection step'
    }));
}

async function getTimelineHighlights(user) {
  const { timeline, cases, tasks, notifications } = await loadData(user);
  if (timeline?.length) return timeline.slice(0, 6);
  return [
    ...tasks.slice(0, 3).map((task) => ({
      occurredAt: task.updatedAt || task.createdAt || new Date(),
      type: task.status,
      payload: { title: task.title, departmentCode: task.departmentCode },
      caseId: task.caseId
    })),
    ...notifications.slice(0, 2).map((item) => ({
      occurredAt: item.createdAt,
      type: 'notification.created',
      payload: { title: item.title, message: item.message },
      caseId: item.caseId
    })),
    ...cases.slice(0, 1).map((item) => ({
      occurredAt: item.lastActivityAt,
      type: 'case.updated',
      payload: { title: item.title, status: item.status },
      caseId: item.caseId
    }))
  ].slice(0, 6);
}

async function getRenewalReminders(user) {
  const { certificates } = await loadData(user);
  return certificates
    .filter((item) => item.expiresAt)
    .map((item) => ({
      ...item,
      daysRemaining: Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / 86400000)
    }))
    .filter((item) => item.daysRemaining <= 90)
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 6);
}

async function getNotificationPreview(user) {
  const { notifications } = await loadData(user);
  return {
    unreadCount: notifications.filter((item) => !item.readAt).length,
    items: notifications.slice(0, 5)
  };
}

module.exports = {
  getDashboardSummary,
  getRecentCases,
  getPendingActions,
  getTimelineHighlights,
  getRenewalReminders,
  getNotificationPreview
};
