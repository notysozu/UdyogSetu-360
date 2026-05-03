const ApprovalTask = require('../../../../services/case-service/src/models/ApprovalTask');
const Inspection = require('../../../../services/case-service/src/models/Inspection');
const Fee = require('../../../../services/case-service/src/models/Fee');
const Certificate = require('../../../../services/case-service/src/models/Certificate');
const documentService = require('../../../../services/case-service/src/services/document.service');
const certificateService = require('../../../../services/case-service/src/services/certificate.service');
const taskLifecycle = require('../../../../services/orchestration-service/src/services/task-lifecycle.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { emitAndAudit } = require('./department-action-event.service');
const commentService = require('./department-comment.service');
const { getTaskDetail, assertTaskAccess, useMockData } = require('./department-task-view.service');

async function loadTaskForAction(context, taskId) {
  const task = await getTaskDetail(context.user, taskId);
  if (!task) {
    const error = new Error('Task not found.');
    error.status = 404;
    throw error;
  }
  assertTaskAccess(context.user, task);
  return task;
}

function ensureOverrideIfNeeded(context) {
  if ((context.user?.primaryRole || context.user?.role) === 'admin' && !context.overrideReason) {
    const error = new Error('Admin override reason is required.');
    error.status = 400;
    throw error;
  }
}

async function startReview(taskId, input, context = {}) {
  ensureOverrideIfNeeded(context);
  const task = await loadTaskForAction(context, taskId);
  const before = { status: task.status };
  if (!useMockData()) {
    await taskLifecycle.startReview(task._id, context);
  }
  await emitAndAudit(EVENT_NAMES.TASK_REVIEW_STARTED, 'task.review_started', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode,
    before,
    after: { status: 'under_review' }
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId
  }, context);
  return { success: true };
}

async function updateChecklist(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  const checklist = task.checklist || [];
  const item = checklist.find((entry) => entry.code === input.itemCode);
  if (!item) {
    const error = new Error('Checklist item not found.');
    error.status = 404;
    throw error;
  }
  const before = { status: item.status, remarks: item.remarks };
  item.status = input.status;
  item.remarks = input.remarks || '';
  item.reviewedBy = context.user?.id || context.user?._id || null;
  item.reviewedAt = new Date();
  if (!useMockData()) {
    await task.save();
  }
  await emitAndAudit(EVENT_NAMES.TASK_CHECKLIST_UPDATED, 'task.checklist_updated', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode,
    before,
    after: { status: item.status, remarks: item.remarks }
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId,
    checklistItem: input.itemCode,
    status: input.status
  }, context);
  return task;
}

async function reviewDocument(taskId, documentId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  let document;
  if (input.decision === 'verify') {
    document = await documentService.verifyDocument(documentId, { remarks: input.reason || 'Verified by department reviewer.' }, { ...context, user: context.user });
    await emitAndAudit(EVENT_NAMES.DOCUMENT_VERIFIED, 'document.reviewed', {
      resourceType: 'document',
      resourceId: documentId,
      caseId: task.caseId,
      taskId: task._id,
      universalCaseId: task.universalCaseId,
      departmentCode: task.departmentCode
    }, {
      aggregateType: 'document',
      resourceId: documentId,
      taskId: String(task._id),
      caseId: String(task.caseId),
      universalCaseId: task.universalCaseId
    }, context);
  } else {
    document = await documentService.rejectDocument(documentId, { remarks: input.reason, failureReason: input.reason }, { ...context, user: context.user });
    await emitAndAudit(EVENT_NAMES.DOCUMENT_REJECTED, 'document.reviewed', {
      resourceType: 'document',
      resourceId: documentId,
      caseId: task.caseId,
      taskId: task._id,
      universalCaseId: task.universalCaseId,
      departmentCode: task.departmentCode
    }, {
      aggregateType: 'document',
      resourceId: documentId,
      taskId: String(task._id),
      caseId: String(task.caseId),
      universalCaseId: task.universalCaseId,
      reason: input.reason
    }, context);
  }
  return document;
}

async function raiseQuery(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  if (!useMockData()) {
    task.queryThread.push({
      message: input.message,
      raisedBy: context.user?.id || context.user?._id || null,
      attachments: input.attachments || [],
      status: 'open'
    });
    await task.save();
    await taskLifecycle.raiseQuery(task._id, input, context);
  }
  if (input.internalNote) {
    await commentService.addTaskComment(task._id, {
      caseId: task.caseId,
      universalCaseId: task.universalCaseId,
      body: input.internalNote,
      visibility: 'internal'
    }, context);
  }
  await emitAndAudit(EVENT_NAMES.TASK_QUERY_RAISED, 'task.query_raised', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId,
    subject: input.subject
  }, context);
  return { success: true };
}

async function scheduleInspection(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  if (new Date(input.scheduledAt) < new Date() && (context.user.primaryRole || context.user.role) !== 'admin') {
    const error = new Error('Inspection cannot be scheduled in the past without admin override.');
    error.status = 400;
    throw error;
  }
  let inspection = null;
  if (!useMockData()) {
    inspection = await Inspection.create({
      caseId: task.caseId,
      universalCaseId: task.universalCaseId,
      taskId: task._id,
      departmentCode: task.departmentCode,
      inspectionType: input.inspectionType,
      status: 'scheduled',
      scheduledAt: input.scheduledAt,
      scheduledEndAt: input.scheduledEndAt || null,
      location: input.location,
      assignedInspectorIds: input.inspectorIds || []
    });
    await taskLifecycle.scheduleInspection(task._id, { inspectionId: inspection.id }, context);
  }
  await emitAndAudit(EVENT_NAMES.INSPECTION_SCHEDULED, 'inspection.scheduled', {
    resourceType: 'inspection',
    resourceId: inspection?.id || `mock-inspection-${taskId}`,
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    aggregateType: 'inspection',
    resourceId: inspection?.id || `mock-inspection-${taskId}`,
    taskId: String(task._id),
    caseId: String(task.caseId),
    universalCaseId: task.universalCaseId,
    scheduledAt: input.scheduledAt
  }, context);
  return inspection || { status: 'scheduled' };
}

async function completeInspection(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  let inspection = null;
  if (!useMockData()) {
    inspection = await Inspection.findOneAndUpdate(
      { taskId: task._id },
      {
        $set: {
          status: 'completed',
          result: input.result,
          findings: [input.findings].filter(Boolean),
          completedAt: input.completedAt || new Date(),
          reportDocumentId: input.reportDocumentId || null
        }
      },
      { new: true }
    );
    await taskLifecycle.completeInspection(task._id, input, context);
  }
  await emitAndAudit(EVENT_NAMES.INSPECTION_COMPLETED, 'inspection.completed', {
    resourceType: 'inspection',
    resourceId: inspection?.id || `mock-inspection-${taskId}`,
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    aggregateType: 'inspection',
    resourceId: inspection?.id || `mock-inspection-${taskId}`,
    taskId: String(task._id),
    caseId: String(task.caseId),
    universalCaseId: task.universalCaseId,
    result: input.result
  }, context);
  return inspection || { status: 'completed' };
}

async function createFeeDemand(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  let fee = null;
  if (!useMockData()) {
    fee = await Fee.create({
      caseId: task.caseId,
      universalCaseId: task.universalCaseId,
      taskId: task._id,
      departmentCode: task.departmentCode,
      feeType: input.feeType,
      status: 'demanded',
      currency: input.currency || 'INR',
      amount: Number(input.amount),
      taxAmount: Number(input.taxAmount || 0),
      totalAmount: Number(input.totalAmount || input.amount),
      demandReference: input.demandReference || null,
      demandedAt: new Date(),
      dueAt: input.dueAt
    });
    await taskLifecycle.demandFee(task._id, { feeId: fee.id }, context);
  }
  await emitAndAudit(EVENT_NAMES.FEE_DEMANDED, 'fee.demanded', {
    resourceType: 'fee',
    resourceId: fee?.id || `mock-fee-${taskId}`,
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    aggregateType: 'fee',
    resourceId: fee?.id || `mock-fee-${taskId}`,
    taskId: String(task._id),
    caseId: String(task.caseId),
    universalCaseId: task.universalCaseId,
    totalAmount: Number(input.totalAmount || input.amount)
  }, context);
  return fee || { status: 'demanded' };
}

function requiredChecklistSatisfied(task) {
  return (task.checklist || []).filter((item) => item.required).every((item) => ['satisfied', 'not_applicable'].includes(item.status));
}

async function approveTask(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  if (!requiredChecklistSatisfied(task)) {
    const error = new Error('All required checklist items must be satisfied before approval.');
    error.status = 400;
    throw error;
  }
  if (!useMockData()) {
    task.decision = {
      outcome: 'approved',
      reason: input.decisionReason,
      decidedBy: context.user?.id || context.user?._id || null,
      decidedAt: new Date()
    };
    await task.save();
    await taskLifecycle.approveTask(task._id, input, context);
  }
  await emitAndAudit(EVENT_NAMES.TASK_APPROVED, 'task.approved', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId,
    decisionReason: input.decisionReason
  }, context);
  return { success: true };
}

async function rejectTask(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  if (!useMockData()) {
    task.decision = {
      outcome: 'rejected',
      reason: input.rejectionReason,
      decidedBy: context.user?.id || context.user?._id || null,
      decidedAt: new Date()
    };
    await task.save();
    await taskLifecycle.rejectTask(task._id, input, context);
  }
  await emitAndAudit(EVENT_NAMES.TASK_REJECTED, 'task.rejected', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId,
    rejectionReason: input.rejectionReason
  }, context);
  return { success: true };
}

async function returnTask(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  if (!useMockData()) {
    task.status = 'returned';
    await task.save();
  }
  await emitAndAudit(EVENT_NAMES.TASK_RETURNED, 'task.returned', {
    resourceType: 'task',
    resourceId: String(task._id),
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    taskId: String(task._id),
    caseId: String(task.caseId),
    resourceId: String(task._id),
    universalCaseId: task.universalCaseId,
    reason: input.reason
  }, context);
  return { success: true };
}

async function issueCertificate(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  if (!useMockData() && task.status !== 'approved' && task.status !== 'certificate_issued') {
    const error = new Error('Certificate can only be issued for approved tasks.');
    error.status = 400;
    throw error;
  }
  let certificate = null;
  if (!useMockData()) {
    certificate = await certificateService.storeCertificate({
      taskId: task._id,
      caseId: task.caseId,
      universalCaseId: task.universalCaseId,
      departmentCode: task.departmentCode,
      certificateType: input.certificateType,
      certificateNumber: input.certificateNumber || `CERT-${Date.now()}`,
      issuedAt: new Date(),
      validFrom: input.validFrom || new Date(),
      validUntil: input.validUntil || null
    }, null, { ...context, user: context.user });
    await taskLifecycle.issueCertificate(task._id, { certificateId: certificate.id }, context);
  } else {
    certificate = { id: `mock-certificate-${taskId}` };
  }
  await emitAndAudit(EVENT_NAMES.CERTIFICATE_ISSUED, 'certificate.issued', {
    resourceType: 'certificate',
    resourceId: certificate.id,
    caseId: task.caseId,
    taskId: task._id,
    universalCaseId: task.universalCaseId,
    departmentCode: task.departmentCode
  }, {
    aggregateType: 'certificate',
    resourceId: certificate.id,
    taskId: String(task._id),
    caseId: String(task.caseId),
    universalCaseId: task.universalCaseId,
    certificateNumber: input.certificateNumber || null
  }, context);
  return certificate;
}

async function addComment(taskId, input, context = {}) {
  const task = await loadTaskForAction(context, taskId);
  return commentService.addTaskComment(task._id, {
    caseId: task.caseId,
    universalCaseId: task.universalCaseId,
    body: input.body,
    visibility: input.visibility || 'internal',
    attachments: input.attachments || []
  }, context);
}

module.exports = {
  startReview,
  updateChecklist,
  reviewDocument,
  raiseQuery,
  scheduleInspection,
  completeInspection,
  createFeeDemand,
  approveTask,
  rejectTask,
  returnTask,
  issueCertificate,
  addComment
};
