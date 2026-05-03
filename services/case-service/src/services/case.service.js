const caseLifecycleService = require('../../../orchestration-service/src/services/case-lifecycle.service');
const orchestrationService = require('../../../orchestration-service/src/services/orchestration.service');
const caseRepository = require('../repositories/case.repository');
const approvalTaskRepository = require('../repositories/approval-task.repository');
const taskService = require('./task.service');
const documentService = require('./document.service');
const grievanceService = require('./grievance.service');
const slaService = require('./sla.service');
const { appendDomainEvent } = require('./event-outbox.service');
const {
  CASE_STATUSES,
  DOMAIN_EVENT_NAMES,
  generateUniversalCaseId,
  computeSlaDueAt
} = require('../../../../packages/shared/src');

function normalizeCreateInput(input = {}) {
  if (input.applicant && input.enterprise) {
    return {
      organisationId: input.organisationId,
      investorId: input.investorId,
      applicantUserId: input.applicantUserId,
      caseType: input.caseType || 'common_application',
      title: input.title || `${input.enterprise.name} application`,
      description: input.description || '',
      requiredDepartments: input.requiredDepartments || [],
      metadata: input.metadata || {}
    };
  }
  return input;
}

async function createDraftCase(input, context = {}) {
  const normalized = normalizeCreateInput(input);
  const universalCaseId = normalized.universalCaseId || generateUniversalCaseId();
  const dueAt = normalized.slaSummary?.dueAt || computeSlaDueAt(new Date(), 21);
  const warningAt = normalized.slaSummary?.warningAt || new Date(dueAt.getTime() - 48 * 60 * 60 * 1000);

  const caseDoc = await caseRepository.create(
    {
      universalCaseId,
      sourceSystem: normalized.sourceSystem || 'single_window_system',
      sourceReferenceId: normalized.sourceReferenceId,
      organisationId: normalized.organisationId,
      investorId: normalized.investorId,
      applicantUserId: normalized.applicantUserId,
      caseType: normalized.caseType || 'common_application',
      title: normalized.title || 'Draft application',
      description: normalized.description || '',
      status: CASE_STATUSES.DRAFT,
      priority: normalized.priority || 'normal',
      requiredDepartments: normalized.requiredDepartments || [],
      approvalTracks: [],
      currentStage: 'draft',
      lastActivityAt: new Date(),
      slaSummary: {
        dueAt,
        warningAt,
        totalPausedMinutes: 0,
        status: 'running'
      },
      tags: normalized.tags || [],
      riskFlags: normalized.riskFlags || [],
      aiInsights: normalized.aiInsights || {},
      createdBy: context.userId || null,
      updatedBy: context.userId || null,
      correlationId: context.correlationId || null,
      metadata: normalized.metadata || {}
    },
    context
  );

  await appendDomainEvent(
    {
      eventName: DOMAIN_EVENT_NAMES.CASE_DRAFT_CREATED,
      aggregateType: 'case',
      aggregateId: caseDoc.id,
      universalCaseId: caseDoc.universalCaseId,
      payload: { caseId: caseDoc.id, universalCaseId: caseDoc.universalCaseId }
    },
    context
  );

  await slaService.startTimer(
    {
      caseId: caseDoc._id,
      universalCaseId: caseDoc.universalCaseId,
      timerType: 'case',
      status: 'running',
      startsAt: new Date(),
      dueAt,
      warningAt
    },
    context
  );

  return caseDoc;
}

async function submitCase(caseId, context = {}) {
  return caseLifecycleService.submitCase(caseId, {}, {
    actor: context.user || {
      id: context.userId || null,
      primaryRole: context.primaryRole || 'system',
      permissions: context.permissions || []
    },
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  });
}

async function amendCase(caseId, patch, context = {}) {
  const caseDoc = await caseRepository.updateById(caseId, {
    ...patch,
    updatedBy: context.userId || null,
    correlationId: context.correlationId || null,
    lastActivityAt: new Date()
  });

  if (caseDoc) {
    await appendDomainEvent(
      {
        eventName: DOMAIN_EVENT_NAMES.CASE_AMENDED,
        aggregateType: 'case',
        aggregateId: caseDoc.id,
        universalCaseId: caseDoc.universalCaseId,
        payload: patch
      },
      context
    );
  }

  return caseDoc;
}

async function changeCaseStatus(caseId, nextStatus, context = {}) {
  return orchestrationService.transitionCase(caseId, nextStatus, { reason: context.reason }, {
    actor: context.user || {
      id: context.userId || null,
      primaryRole: context.primaryRole || 'system',
      permissions: context.permissions || []
    },
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  });
}

async function getCaseTimeline(caseId) {
  const caseDoc = await caseRepository.findById(caseId);
  if (!caseDoc) {
    throw new Error('Case not found.');
  }
  const tasks = await approvalTaskRepository.findByCaseId(caseDoc._id);
  return {
    case: caseDoc,
    tasks
  };
}

async function addDocument(caseId, documentInput, context = {}) {
  const caseDoc = await caseRepository.findById(caseId);
  if (!caseDoc) {
    throw new Error('Case not found.');
  }
  return documentService.createDocumentMetadata(
    {
      ...documentInput,
      caseId: caseDoc._id,
      universalCaseId: caseDoc.universalCaseId,
      organisationId: caseDoc.organisationId,
      uploadedBy: context.userId || null
    },
    context
  );
}

async function createGrievanceForCase(caseId, grievanceInput, context = {}) {
  const caseDoc = await caseRepository.findById(caseId);
  if (!caseDoc) {
    throw new Error('Case not found.');
  }
  return grievanceService.createGrievance(
    {
      ...grievanceInput,
      caseId: caseDoc._id,
      universalCaseId: caseDoc.universalCaseId,
      organisationId: caseDoc.organisationId
    },
    context
  );
}

module.exports = {
  createDraftCase,
  submitCase,
  amendCase,
  changeCaseStatus,
  getCaseTimeline,
  createDepartmentTasksForCase: taskService.createDepartmentTasksForCase,
  addDocument,
  createGrievance: createGrievanceForCase,
  listTimeline: getCaseTimeline
};
