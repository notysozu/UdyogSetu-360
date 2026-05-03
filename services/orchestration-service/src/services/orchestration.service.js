const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const {
  CASE_STATUSES,
  TASK_STATUSES,
  DOMAIN_EVENT_NAMES,
  AUDIT_ACTIONS
} = require('../../../../packages/shared/src');
const caseRepository = require('../repositories/case.repository');
const taskRepository = require('../repositories/task.repository');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');
const {
  assertCaseTransitionAllowed,
  assertTaskTransitionAllowed,
  allMandatoryTasksApproved,
  anyMandatoryTaskRejected,
  allRequiredFeesPaid,
  allRequiredInspectionsCompleted,
  allRequiredCertificatesIssued
} = require('../guards/transition-guards');
const { getCaseTransition } = require('../state-machines/case-state-machine');
const { getTaskTransition } = require('../state-machines/task-state-machine');
const slaService = require('./sla-orchestration.service');
const eventReplayService = require('./event-replay.service');
const { buildCaseHandlers } = require('../handlers/case-event.handlers');
const { buildTaskHandlers } = require('../handlers/task-event.handlers');

function buildActor(context = {}) {
  const actor = context.actor || context.user || {};
  return {
    actorType: actor.primaryRole === 'system' ? 'system' : 'user',
    actorId: actor.id || actor._id || 'anonymous',
    role: actor.primaryRole || actor.role || 'unknown',
    displayName: actor.name || actor.email || actor.primaryRole || 'Unknown'
  };
}

async function withSession(callback) {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (_abortError) {
        // no-op fallback
      }
    }
    if (String(error.message || '').includes('Transaction numbers are only allowed')) {
      console.warn('Falling back to best-effort non-transactional orchestration flow.');
      return callback(null);
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

function buildTaskDueDates(task, caseDoc) {
  return {
    dueAt: task.dueAt || caseDoc.slaSummary?.dueAt || null,
    warningAt: task.warningAt || caseDoc.slaSummary?.warningAt || null
  };
}

function buildTaskFromRequirement(caseDoc, requirement, context = {}) {
  return {
    caseId: caseDoc._id,
    universalCaseId: caseDoc.universalCaseId,
    departmentCode: requirement.departmentCode,
    taskType: requirement.requiredApprovalType || 'other',
    title: `${requirement.departmentCode} review for ${caseDoc.title}`,
    status: TASK_STATUSES.PENDING,
    priority: caseDoc.priority || 'normal',
    checklist: [],
    metadata: {
      isMandatory: requirement.isMandatory !== false
    },
    ...buildTaskDueDates({}, caseDoc),
    createdBy: context.actor?.id || null,
    updatedBy: context.actor?.id || null,
    correlationId: context.correlationId || null
  };
}

function applyCaseTransition(caseDoc, nextStatus, payload = {}) {
  const now = new Date();
  caseDoc.status = nextStatus;
  caseDoc.currentStage = nextStatus;
  caseDoc.lastActivityAt = now;
  if (nextStatus === CASE_STATUSES.SUBMITTED && !caseDoc.submittedAt) {
    caseDoc.submittedAt = now;
  }
  if (nextStatus === CASE_STATUSES.CLOSED) {
    caseDoc.closedAt = now;
  }
  if (nextStatus === CASE_STATUSES.REOPENED) {
    caseDoc.reopenedAt = now;
  }
  if (nextStatus === CASE_STATUSES.AMENDMENT_REQUESTED) {
    caseDoc.metadata = {
      ...(caseDoc.metadata || {}),
      amendmentPending: payload
    };
  }
  if (nextStatus === CASE_STATUSES.AMENDED) {
    caseDoc.metadata = {
      ...(caseDoc.metadata || {}),
      lastAmendmentAppliedAt: now
    };
  }
}

function applyTaskTransition(taskDoc, nextStatus, payload = {}, context = {}) {
  const now = new Date();
  taskDoc.status = nextStatus;
  taskDoc.updatedBy = context.actor?.id || null;
  taskDoc.correlationId = context.correlationId || null;

  if (nextStatus === TASK_STATUSES.ASSIGNED) {
    taskDoc.assignedOfficerId = payload.officerId || context.actor?.id || taskDoc.assignedOfficerId;
  }
  if (nextStatus === TASK_STATUSES.QUERY_RAISED) {
    taskDoc.queryThread.push({
      message: payload.message || payload.reason || 'Query raised',
      raisedBy: context.actor?.id || null,
      raisedAt: now,
      status: 'open'
    });
  }
  if ([TASK_STATUSES.RESPONSE_RECEIVED].includes(nextStatus)) {
    const openQuery = [...(taskDoc.queryThread || [])].reverse().find((item) => item.status === 'open');
    if (openQuery) {
      openQuery.respondedBy = context.actor?.id || null;
      openQuery.respondedAt = now;
      openQuery.status = 'answered';
    }
    taskDoc.metadata = {
      ...(taskDoc.metadata || {}),
      lastResponse: payload
    };
  }
  if ([TASK_STATUSES.REJECTED, TASK_STATUSES.APPROVED].includes(nextStatus)) {
    taskDoc.decision = {
      outcome: nextStatus,
      reason: payload.reason || null,
      decidedBy: context.actor?.id || null,
      decidedAt: now
    };
    taskDoc.completedAt = now;
  }
  if (nextStatus === TASK_STATUSES.FEE_PAID) {
    taskDoc.metadata = {
      ...(taskDoc.metadata || {}),
      paymentReference: payload.paymentReference,
      paymentRecordedAt: now
    };
  }
  if (nextStatus === TASK_STATUSES.CERTIFICATE_ISSUED) {
    taskDoc.metadata = {
      ...(taskDoc.metadata || {}),
      certificateNumber: payload.certificateNumber || null,
      certificateDocumentId: payload.documentId || null,
      certificateIssuedAt: now
    };
    taskDoc.completedAt = now;
  }
  if ([TASK_STATUSES.CLOSED, TASK_STATUSES.CANCELLED].includes(nextStatus)) {
    taskDoc.completedAt = now;
  }
}

function eventNameForCaseTransition(previousStatus, nextStatus) {
  return getCaseTransition(previousStatus, nextStatus)?.eventName || DOMAIN_EVENT_NAMES.CASE_STATUS_CHANGED;
}

function eventNameForTaskTransition(previousStatus, nextStatus) {
  return getTaskTransition(previousStatus, nextStatus)?.eventName || DOMAIN_EVENT_NAMES.TASK_STATUS_CHANGED;
}

function deriveAggregateCaseStatus(caseDoc, tasks = []) {
  const activeTasks = tasks.filter((task) => task.status !== TASK_STATUSES.CANCELLED);
  if (!activeTasks.length) {
    return caseDoc.status === CASE_STATUSES.SUBMITTED ? CASE_STATUSES.UNDER_SCRUTINY : caseDoc.status;
  }
  if (anyMandatoryTaskRejected(caseDoc, activeTasks)) {
    return CASE_STATUSES.REJECTED;
  }
  if (activeTasks.some((task) => task.status === TASK_STATUSES.QUERY_RAISED)) {
    return CASE_STATUSES.QUERY_RAISED;
  }
  if (activeTasks.some((task) => [TASK_STATUSES.INSPECTION_REQUIRED, TASK_STATUSES.INSPECTION_SCHEDULED].includes(task.status))) {
    return CASE_STATUSES.INSPECTION_SCHEDULED;
  }
  if (allRequiredInspectionsCompleted(caseDoc, activeTasks)) {
    if (caseDoc.status === CASE_STATUSES.INSPECTION_SCHEDULED) {
      return CASE_STATUSES.INSPECTION_COMPLETED;
    }
  }
  if (activeTasks.some((task) => task.status === TASK_STATUSES.FEE_DEMANDED)) {
    return CASE_STATUSES.FEE_DEMANDED;
  }
  if (allRequiredCertificatesIssued(caseDoc, activeTasks)) {
    return CASE_STATUSES.CERTIFICATE_ISSUED;
  }
  if (allMandatoryTasksApproved(caseDoc, activeTasks)) {
    return CASE_STATUSES.APPROVED;
  }
  if (allRequiredFeesPaid(caseDoc, activeTasks) && [CASE_STATUSES.FEE_DEMANDED, CASE_STATUSES.FEE_PAID].includes(caseDoc.status)) {
    return CASE_STATUSES.FEE_PAID;
  }
  if (activeTasks.every((task) => task.status !== TASK_STATUSES.QUERY_RAISED) && caseDoc.status === CASE_STATUSES.QUERY_RAISED) {
    return CASE_STATUSES.UNDER_SCRUTINY;
  }
  if ([CASE_STATUSES.SUBMITTED, CASE_STATUSES.REOPENED, CASE_STATUSES.RESPONSE_SUBMITTED, CASE_STATUSES.FEE_PAID, CASE_STATUSES.AMENDED].includes(caseDoc.status)) {
    return CASE_STATUSES.UNDER_SCRUTINY;
  }
  return caseDoc.status;
}

async function createTransitionArtifacts({ resourceType, resourceId, caseDoc, previousStatus, nextStatus, payload, context, eventName, session, taskDoc }) {
  const actor = buildActor(context);
  const domainEventPayload = {
    previousStatus,
    nextStatus,
    actor,
    reason: payload?.reason || context.reason || null,
    caseId: caseDoc?._id?.toString?.() || caseDoc?.id || null,
    taskId: taskDoc?._id?.toString?.() || taskDoc?.id || null,
    universalCaseId: caseDoc?.universalCaseId || taskDoc?.universalCaseId || null,
    departmentCode: taskDoc?.departmentCode || null,
    transitionPayload: payload || {},
    timestamp: new Date().toISOString()
  };

  await appendDomainEvent(
    {
      eventName,
      eventId: randomUUID(),
      aggregateType: resourceType,
      aggregateId: String(resourceId),
      universalCaseId: caseDoc?.universalCaseId || taskDoc?.universalCaseId || null,
      payload: domainEventPayload,
      correlationId: context.correlationId || null,
      causationId: context.causationId || null,
      idempotencyKey: context.idempotencyKey || null
    },
    { ...context, session }
  );

  await recordAuditEvent(
    {
      actor,
      action: AUDIT_ACTIONS.UPDATED,
      resourceType,
      resourceId: String(resourceId),
      caseId: caseDoc?._id?.toString?.() || null,
      universalCaseId: caseDoc?.universalCaseId || taskDoc?.universalCaseId || null,
      before: { status: previousStatus },
      after: { status: nextStatus },
      metadata: {
        reason: payload?.reason || context.reason || null,
        transitionPayload: payload || {}
      }
    },
    { ...context, session }
  );
}

async function maybeCreateInitialTasks(caseDoc, context = {}, session = null) {
  const existingTasks = await taskRepository.findByCaseId(caseDoc._id);
  if (existingTasks.length || !caseDoc.requiredDepartments?.length) {
    return existingTasks;
  }

  const createdTasks = [];
  for (const requirement of caseDoc.requiredDepartments) {
    const created = new (require('../../../case-service/src/models/ApprovalTask'))(
      buildTaskFromRequirement(caseDoc, requirement, context)
    );
    await created.save(session ? { session } : {});
    createdTasks.push(created);
    await slaService.startTaskSla(created, { ...context, session });
    await appendDomainEvent(
      {
        eventName: DOMAIN_EVENT_NAMES.TASK_CREATED,
        aggregateType: 'approval_task',
        aggregateId: created.id,
        universalCaseId: caseDoc.universalCaseId,
        payload: {
          caseId: caseDoc.id,
          taskId: created.id,
          departmentCode: created.departmentCode
        }
      },
      { ...context, session }
    );
  }

  caseDoc.approvalTracks = createdTasks.map((task) => ({
    departmentCode: task.departmentCode,
    taskId: task._id,
    status: task.status,
    startedAt: task.createdAt
  }));
  await caseDoc.save(session ? { session } : {});
  return createdTasks;
}

async function transitionCase(caseId, nextStatus, payload = {}, context = {}) {
  return withSession(async (session) => {
    const caseDoc = await caseRepository.findById(caseId);
    if (!caseDoc) {
      throw new Error('Case not found.');
    }

    const previousStatus = caseDoc.status;
    assertCaseTransitionAllowed(caseDoc, nextStatus, {
      ...context,
      payload,
      reason: payload.reason || context.reason || null
    });
    applyCaseTransition(caseDoc, nextStatus, payload);
    await caseDoc.save(session ? { session } : {});

    if (nextStatus === CASE_STATUSES.SUBMITTED) {
      await maybeCreateInitialTasks(caseDoc, context, session);
      await slaService.startCaseSla(caseDoc, { ...context, session });
    }
    if (nextStatus === CASE_STATUSES.QUERY_RAISED) {
      await slaService.pauseSla('case', caseDoc._id, payload.reason || 'query_raised', { ...context, session });
    }
    if (nextStatus === CASE_STATUSES.RESPONSE_SUBMITTED) {
      await slaService.resumeSla('case', caseDoc._id, { ...context, session });
    }
    if ([CASE_STATUSES.CLOSED, CASE_STATUSES.CERTIFICATE_ISSUED, CASE_STATUSES.REJECTED].includes(nextStatus)) {
      await slaService.completeSla('case', caseDoc._id, { ...context, session });
    }
    if (nextStatus === CASE_STATUSES.WITHDRAWN) {
      await slaService.cancelSla('case', caseDoc._id, { ...context, session });
    }

    await createTransitionArtifacts({
      resourceType: 'case',
      resourceId: caseDoc.id,
      caseDoc,
      previousStatus,
      nextStatus,
      payload,
      context,
      eventName: eventNameForCaseTransition(previousStatus, nextStatus),
      session
    });

    if (previousStatus !== nextStatus) {
      await appendDomainEvent(
        {
          eventName: DOMAIN_EVENT_NAMES.CASE_STATUS_CHANGED,
          aggregateType: 'case',
          aggregateId: caseDoc.id,
          universalCaseId: caseDoc.universalCaseId,
          payload: { previousStatus, nextStatus, caseId: caseDoc.id }
        },
        { ...context, session }
      );
    }

    return caseDoc;
  });
}

async function transitionTask(taskId, nextStatus, payload = {}, context = {}) {
  return withSession(async (session) => {
    const taskDoc = await taskRepository.findById(taskId);
    if (!taskDoc) {
      throw new Error('Task not found.');
    }
    const caseDoc = await caseRepository.findById(taskDoc.caseId);
    const previousStatus = taskDoc.status;
    assertTaskTransitionAllowed(caseDoc, taskDoc, nextStatus, { ...context, payload });

    applyTaskTransition(taskDoc, nextStatus, payload, context);
    await taskDoc.save(session ? { session } : {});

    if (nextStatus === TASK_STATUSES.ASSIGNED) {
      await slaService.startTaskSla(taskDoc, { ...context, session });
    }
    if (nextStatus === TASK_STATUSES.QUERY_RAISED) {
      await slaService.pauseSla('task', taskDoc._id, payload.reason || 'query_raised', { ...context, session });
    }
    if ([TASK_STATUSES.RESPONSE_RECEIVED].includes(nextStatus)) {
      await slaService.resumeSla('task', taskDoc._id, { ...context, session });
    }
    if ([TASK_STATUSES.APPROVED, TASK_STATUSES.REJECTED, TASK_STATUSES.CLOSED].includes(nextStatus)) {
      await slaService.completeSla('task', taskDoc._id, { ...context, session });
    }
    if (nextStatus === TASK_STATUSES.CANCELLED) {
      await slaService.cancelSla('task', taskDoc._id, { ...context, session });
    }

    await createTransitionArtifacts({
      resourceType: 'approval_task',
      resourceId: taskDoc.id,
      caseDoc,
      previousStatus,
      nextStatus,
      payload,
      context,
      taskDoc,
      eventName: eventNameForTaskTransition(previousStatus, nextStatus),
      session
    });

    if (previousStatus !== nextStatus) {
      await appendDomainEvent(
        {
          eventName: DOMAIN_EVENT_NAMES.TASK_STATUS_CHANGED,
          aggregateType: 'approval_task',
          aggregateId: taskDoc.id,
          universalCaseId: taskDoc.universalCaseId,
          payload: {
            previousStatus,
            nextStatus,
            caseId: caseDoc?.id,
            taskId: taskDoc.id,
            departmentCode: taskDoc.departmentCode
          }
        },
        { ...context, session }
      );
    }

    await recalculateCaseAggregateStatus(caseDoc._id, {
      ...context,
      actor: context.actor || { primaryRole: 'system', permissions: ['system.internal_call'] }
    });

    return taskDoc;
  });
}

async function recalculateCaseAggregateStatus(caseId, context = {}) {
  const caseDoc = await caseRepository.findById(caseId);
  if (!caseDoc) {
    throw new Error('Case not found.');
  }
  const tasks = await taskRepository.findByCaseId(caseDoc._id);
  const nextStatus = deriveAggregateCaseStatus(caseDoc, tasks);
  if (nextStatus === caseDoc.status) {
    return { changed: false, case: caseDoc, tasks };
  }

  const previousStatus = caseDoc.status;
  applyCaseTransition(caseDoc, nextStatus, { reason: 'aggregate_recalculation' });
  await caseDoc.save();
  await createTransitionArtifacts({
    resourceType: 'case',
    resourceId: caseDoc.id,
    caseDoc,
    previousStatus,
    nextStatus,
    payload: { reason: 'aggregate_recalculation' },
    context,
    eventName: DOMAIN_EVENT_NAMES.CASE_STATUS_CHANGED
  });

  return { changed: true, case: caseDoc, tasks };
}

async function handleCaseEvent(event, context = {}) {
  const handlers = buildCaseHandlers(module.exports, slaService);
  switch (event.eventName) {
    case DOMAIN_EVENT_NAMES.CASE_SUBMITTED:
      return handlers.onCaseSubmitted(event, context);
    case DOMAIN_EVENT_NAMES.SLA_BREACHED:
      return handlers.onSlaBreached(event, context);
    default:
      return { skipped: true, reason: 'no_handler' };
  }
}

async function handleTaskEvent(event, context = {}) {
  const handlers = buildTaskHandlers(module.exports);
  const handlerMap = {
    [DOMAIN_EVENT_NAMES.TASK_CREATED]: handlers.onTaskCreated,
    [DOMAIN_EVENT_NAMES.TASK_STATUS_CHANGED]: handlers.onTaskStatusChanged,
    [DOMAIN_EVENT_NAMES.TASK_QUERY_RAISED]: handlers.onTaskQueryRaised,
    [DOMAIN_EVENT_NAMES.TASK_RESPONSE_SUBMITTED]: handlers.onTaskResponseSubmitted,
    [DOMAIN_EVENT_NAMES.TASK_INSPECTION_SCHEDULED]: handlers.onTaskInspectionScheduled,
    [DOMAIN_EVENT_NAMES.TASK_INSPECTION_COMPLETED]: handlers.onTaskInspectionCompleted,
    [DOMAIN_EVENT_NAMES.TASK_FEE_DEMANDED]: handlers.onTaskFeeDemanded,
    [DOMAIN_EVENT_NAMES.TASK_FEE_PAID]: handlers.onTaskFeePaid,
    [DOMAIN_EVENT_NAMES.TASK_APPROVED]: handlers.onTaskApproved,
    [DOMAIN_EVENT_NAMES.TASK_REJECTED]: handlers.onTaskRejected,
    [DOMAIN_EVENT_NAMES.TASK_CERTIFICATE_ISSUED]: handlers.onCertificateIssued
  };
  const handler = handlerMap[event.eventName];
  if (!handler) {
    return { skipped: true, reason: 'no_handler' };
  }
  return handler(event, context);
}

async function replayEventsForCase(caseId, context = {}) {
  const replay = await eventReplayService.replayCaseEvents(caseId, context);
  for (const event of replay.events) {
    if (String(event.aggregateType).includes('task')) {
      await handleTaskEvent(event, context);
    } else {
      await handleCaseEvent(event, context);
    }
  }
  const projection = await eventReplayService.rebuildCaseProjection(caseId, context);
  return {
    ...replay,
    projection
  };
}

module.exports = {
  transitionCase,
  transitionTask,
  handleCaseEvent,
  handleTaskEvent,
  recalculateCaseAggregateStatus,
  replayEventsForCase,
  deriveAggregateCaseStatus
};
