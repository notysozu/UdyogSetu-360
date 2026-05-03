const Case = require('../models/Case');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const { generateCaseId } = require('../utils/caseId');
const { addDays } = require('../utils/dates');
const { appendEvent } = require('./eventService');
const { recommendApprovals } = require('./aiClient');
const { PERMISSIONS } = require('../../../packages/shared/src');
const { hasPermission } = require('./permissionService');
const { assertCanAccessCase } = require('./abacService');

function normaliseActor(user) {
  if (!user) return null;
  return {
    id: user.id || user._id,
    role: user.role,
    name: user.name
  };
}

async function createCase({ payload, user, correlationId }) {
  if (user && !hasPermission(user, PERMISSIONS.CASE_CREATE)) {
    const error = new Error('You do not have permission to create cases.');
    error.status = 403;
    throw error;
  }
  const aiRecommendation = await recommendApprovals(payload);
  const codes = aiRecommendation.recommendedDepartments || ['KSPCB', 'BESCOM'];
  const departments = await Department.find({ code: { $in: codes }, active: true });

  if (!departments.length) {
    const error = new Error('No active departments found for this application. Run npm run seed first.');
    error.status = 422;
    throw error;
  }

  const now = new Date();
  const caseDoc = await Case.create({
    caseId: generateCaseId(now),
    createdBy: user?.id || user?._id,
    applicant: {
      name: payload.applicantName,
      email: payload.applicantEmail,
      mobile: payload.applicantMobile
    },
    enterprise: {
      name: payload.enterpriseName,
      industry: payload.industry,
      district: payload.district,
      investmentSize: payload.investmentSize,
      landArea: payload.landArea
    },
    status: 'SUBMITTED',
    currentStage: 'Routed to departments',
    approvals: departments.map((department) => ({
      department: department._id,
      status: 'PENDING',
      slaDueAt: addDays(now, department.slaDays),
      lastEventAt: now
    })),
    documents: [
      { label: 'Combined Application Form', fileName: 'caf-placeholder.pdf', status: 'pending' }
    ],
    ai: {
      routeConfidence: aiRecommendation.confidence || 0.5,
      summary: aiRecommendation.explanation || 'Initial route generated.',
      lastCheckedAt: now
    },
    correlationId
  });

  await appendEvent({
    type: 'case.submitted',
    caseId: caseDoc.caseId,
    actor: normaliseActor(user),
    correlationId,
    payload: {
      enterprise: caseDoc.enterprise,
      recommendedDepartments: departments.map((d) => d.code),
      aiConfidence: caseDoc.ai.routeConfidence
    }
  });

  return caseDoc.populate('approvals.department');
}

async function submitDepartmentAction({ caseId, departmentId, status, note, certificateRef, user, correlationId }) {
  const caseDoc = await Case.findOne({ caseId });
  if (!caseDoc) {
    const error = new Error('Case not found');
    error.status = 404;
    throw error;
  }

  assertCanAccessCase(user, caseDoc);

  const task = caseDoc.approvals.find((approval) => String(approval.department) === String(departmentId));
  if (!task) {
    const error = new Error('Approval task not found for this department');
    error.status = 404;
    throw error;
  }

  task.status = status;
  task.lastEventAt = new Date();
  if (certificateRef) task.certificateRef = certificateRef;
  if (note) task.notes.push({ by: user.id || user._id, text: note });

  const allFinal = caseDoc.approvals.every((approval) => ['APPROVED', 'REJECTED', 'CERTIFICATE_ISSUED'].includes(approval.status));
  const anyRejected = caseDoc.approvals.some((approval) => approval.status === 'REJECTED');

  caseDoc.status = anyRejected ? 'REJECTED' : allFinal ? 'COMPLETED' : status === 'QUERY_RAISED' ? 'QUERY_RAISED' : 'IN_PROGRESS';
  caseDoc.currentStage = allFinal ? 'Completed' : 'Department processing';
  await caseDoc.save();

  await appendEvent({
    type: `department.task.${status.toLowerCase()}`,
    caseId: caseDoc.caseId,
    actor: normaliseActor(user),
    correlationId,
    payload: { departmentId, status, note, certificateRef }
  });

  if (caseDoc.createdBy) {
    await Notification.create({
      user: caseDoc.createdBy,
      title: `Case ${caseDoc.caseId} updated`,
      message: `Department task moved to ${status.replaceAll('_', ' ')}.`,
      caseId: caseDoc.caseId
    });
  }

  return caseDoc.populate('approvals.department');
}

module.exports = { createCase, submitDepartmentAction };
