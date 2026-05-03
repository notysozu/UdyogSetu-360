const Case = require('../../../../web/src/models/Case');
const ApprovalTask = require('../../../../web/src/models/ApprovalTask');
const EventLog = require('../../../../web/src/models/EventLog');
const Notification = require('../../../../web/src/models/Notification');
const mongoose = require('mongoose');
const { buildMockInvestorPortalData } = require('../mock/investor.mock');

function investorCaseQuery(user) {
  return {
    $or: [
      { createdBy: user.id },
      { applicantUserId: user.id },
      { organisationId: user.organisationId || null }
    ]
  };
}

async function getInvestorCases(user, filters = {}) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).cases;
  }
  const query = investorCaseQuery(user);
  if (filters.search) {
    query.$and = [{
      $or: [
        { universalCaseId: new RegExp(filters.search, 'i') },
        { caseId: new RegExp(filters.search, 'i') },
        { title: new RegExp(filters.search, 'i') }
      ]
    }];
  }
  if (filters.status) query.status = filters.status;
  const cases = await Case.find(query).sort({ lastActivityAt: -1 }).limit(100).catch(() => []);
  if (!cases.length && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).cases;
  }
  return cases;
}

async function getInvestorCaseDetail(user, caseId) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).cases.find((item) => item.caseId === caseId) || null;
  }
  const caseDoc = await Case.findOne({
    $and: [
      investorCaseQuery(user),
      { $or: [{ caseId }, { universalCaseId: caseId }, { _id: caseId }] }
    ]
  }).catch(() => null);
  if (caseDoc) return caseDoc;
  if (process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).cases.find((item) => item.caseId === caseId) || null;
  }
  return null;
}

async function getInvestorCaseTimeline(user, caseId) {
  const caseDoc = await getInvestorCaseDetail(user, caseId);
  if (!caseDoc) return [];
  const timeline = await EventLog.find({ caseId: caseDoc.caseId }).sort({ occurredAt: -1 }).limit(50).catch(() => []);
  if (timeline.length) return timeline;
  return [
    {
      occurredAt: caseDoc.submittedAt || caseDoc.createdAt,
      type: 'case.submitted',
      payload: { title: 'Application submitted', description: 'The application was submitted successfully.' },
      actor: { role: 'investor', name: caseDoc.applicant?.name || user.name }
    }
  ];
}

async function getTaskWiseProgress(user, caseId) {
  const caseDoc = await getInvestorCaseDetail(user, caseId);
  if (!caseDoc) return [];
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).tasks.filter((item) => item.caseId === caseDoc.caseId);
  }
  const tasks = await ApprovalTask.find({ caseId: caseDoc.caseId }).sort({ createdAt: 1 }).catch(() => []);
  if (tasks.length) return tasks;
  return buildMockInvestorPortalData(user).tasks.filter((item) => item.caseId === caseDoc.caseId);
}

async function getRaisedQueries(user, caseId) {
  const tasks = await getTaskWiseProgress(user, caseId);
  return tasks
    .filter((item) => item.status === 'query_raised')
    .map((item) => ({
      _id: String(item._id),
      caseId: item.caseId,
      departmentCode: item.departmentCode,
      title: item.title,
      message: item.metadata?.queryMessage || 'Please provide the requested clarification.',
      dueAt: item.dueAt,
      status: item.status
    }));
}

async function submitQueryResponse(user, queryId, input, context = {}) {
  const payload = {
    queryId,
    message: input.message,
    attachments: input.attachments || []
  };
  await EventLog.create({
    type: 'query.response_submitted',
    source: 'investor-portal',
    caseId: input.caseId,
    actor: {
      userId: user.id,
      role: user.primaryRole || user.role,
      name: user.name
    },
    correlationId: context.correlationId,
    payload
  }).catch(() => null);
  return {
    success: true,
    submittedAt: new Date(),
    ...payload
  };
}

async function getSubmittedResponses(user, caseId) {
  const caseDoc = await getInvestorCaseDetail(user, caseId);
  if (!caseDoc) return [];
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return [];
  }
  return EventLog.find({ caseId: caseDoc.caseId, type: 'query.response_submitted' })
    .sort({ occurredAt: -1 })
    .limit(20)
    .catch(() => []);
}

async function getCaseNotifications(user, caseId) {
  const caseDoc = await getInvestorCaseDetail(user, caseId);
  if (!caseDoc) return [];
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).notifications;
  }
  return Notification.find({ user: user.id, caseId: caseDoc.caseId }).sort({ createdAt: -1 }).limit(10).catch(() => []);
}

module.exports = {
  getInvestorCases,
  getInvestorCaseDetail,
  getInvestorCaseTimeline,
  getTaskWiseProgress,
  getRaisedQueries,
  submitQueryResponse,
  getSubmittedResponses,
  getCaseNotifications
};
