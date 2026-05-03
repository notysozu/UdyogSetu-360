const mongoose = require('mongoose');
const grievanceService = require('../../../../services/case-service/src/services/grievance.service');
const Case = require('../../../../web/src/models/Case');
const { buildMockInvestorPortalData } = require('../mock/investor.mock');

function contextForUser(user) {
  return {
    user,
    userId: user.id || user._id || null,
    role: user.primaryRole || user.role || 'investor',
    organisationId: user.organisationId || null
  };
}

async function getInvestorGrievances(user) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).grievances;
  }
  const data = await grievanceService.listGrievances({
    ...user,
    primaryRole: user.primaryRole || user.role || 'investor'
  }, {}, { page: 1, limit: 100 }, contextForUser(user));
  if (!data.items.length && process.env.NODE_ENV !== 'production') {
    return buildMockInvestorPortalData(user).grievances;
  }
  return data.items;
}

async function createInvestorGrievance(user, input) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return {
      _id: `mock-grievance-${Date.now()}`,
      caseId: input.caseId || null,
      raisedBy: user.id,
      subject: input.subject,
      description: input.description,
      status: 'open',
      createdAt: new Date(),
      messages: []
    };
  }

  if (input.caseId) {
    const caseDoc = await Case.findOne({
      caseId: input.caseId,
      $or: [{ createdBy: user.id }, { applicantUserId: user.id }, { organisationId: user.organisationId || null }]
    }).catch(() => null);
    if (!caseDoc) {
      const error = new Error('Selected case does not belong to your organisation.');
      error.status = 400;
      throw error;
    }
  }

  return grievanceService.createGrievance({
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    organisationId: user.organisationId || null,
    raisedBy: user.id,
    raisedByRole: 'investor',
    category: input.category,
    subject: input.subject,
    description: input.description,
    priority: input.priority || 'normal',
    departmentCode: input.departmentCode || null,
    source: 'investor_portal'
  }, contextForUser(user));
}

async function addMessage(user, grievanceId, input) {
  if (mongoose.connection.readyState !== 1 && process.env.NODE_ENV !== 'production') {
    return { _id: grievanceId, messages: [{ body: input.message || input.body, createdAt: new Date() }] };
  }
  return grievanceService.addExternalReply(grievanceId, { body: input.message || input.body }, contextForUser(user));
}

module.exports = {
  getInvestorGrievances,
  createInvestorGrievance,
  addMessage
};
