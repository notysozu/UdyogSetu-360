const mongoose = require('mongoose');
const { randomUUID } = require('crypto');
const caseRepository = require('../repositories/case.repository');
const approvalTaskRepository = require('../repositories/approval-task.repository');
const documentRepository = require('../repositories/document.repository');
const domainEventRepository = require('../repositories/domain-event.repository');
const auditEventRepository = require('../repositories/audit-event.repository');
const { createDraftSchema, updateDraftSchema, finalSubmitSchema, amendmentSchema, resubmissionSchema } = require('../validators/caf.validators');
const { calculateApprovalTracks, getRequiredAttachments, buildInitialTasks } = require('./approval-track.service');
const { buildDuplicateDetectionService } = require('./duplicate-detection.service');
const { generateAcknowledgement } = require('./acknowledgement.service');
const { buildAttachmentService } = require('./attachment.service');
const { generateCaseId } = require('../utils/caseId');
const { generateUniversalCaseId } = require('../utils/universal-case-id.util');

class CafServiceError extends Error {
  constructor(message, status = 400, code = 'CAF_ERROR', errors = {}, extra = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
    Object.assign(this, extra);
  }
}

function createContextMeta(context = {}) {
  return {
    user: context.user || null,
    correlationId: context.correlationId || null,
    requestId: context.requestId || null,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null
  };
}

function createEventPayload(eventName, caseDoc, payload = {}, context = {}) {
  return {
    eventName,
    eventVersion: 'v1',
    source: 'udyogsetu-web',
    subject: `cases/${caseDoc.caseId}`,
    correlationId: context.correlationId || caseDoc.correlationId || null,
    causationId: context.requestId || null,
    idempotencyKey: context.idempotencyKey || null,
    aggregateType: 'case',
    aggregateId: caseDoc.caseId,
    universalCaseId: caseDoc.universalCaseId || null,
    payload,
    metadata: {
      actorId: String(context.user?._id || context.user?.id || ''),
      timestamp: new Date().toISOString()
    }
  };
}

function assertInvestorAccess(caseDoc, context = {}) {
  const actorId = String(context.user?._id || context.user?.id || '');
  const ownerId = String(caseDoc.applicantUserId || caseDoc.createdBy || '');

  if (actorId && ownerId && actorId !== ownerId && context.user?.primaryRole !== 'admin') {
    throw new CafServiceError('You do not have access to this case.', 403, 'ACCESS_DENIED');
  }
}

function countChangedFields(oldData = {}, newData = {}, prefix = '') {
  const changed = [];
  const keys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);

  keys.forEach((key) => {
    const oldValue = oldData ? oldData[key] : undefined;
    const newValue = newData ? newData[key] : undefined;
    const path = prefix ? `${prefix}.${key}` : key;

    if (
      oldValue &&
      newValue &&
      typeof oldValue === 'object' &&
      typeof newValue === 'object' &&
      !Array.isArray(oldValue) &&
      !Array.isArray(newValue) &&
      !(oldValue instanceof Date) &&
      !(newValue instanceof Date)
    ) {
      changed.push(...countChangedFields(oldValue, newValue, path));
      return;
    }

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changed.push(path);
    }
  });

  return changed;
}

function buildCafService(deps = {}) {
  const cases = deps.caseRepository || caseRepository;
  const tasks = deps.approvalTaskRepository || approvalTaskRepository;
  const documents = deps.documentRepository || documentRepository;
  const events = deps.domainEventRepository || domainEventRepository;
  const auditEvents = deps.auditEventRepository || auditEventRepository;
  const duplicateDetection = deps.duplicateDetectionService || buildDuplicateDetectionService({ caseRepository: cases });
  const attachmentService = deps.attachmentService || buildAttachmentService({ documentRepository: documents, domainEventRepository: events, auditEventRepository: auditEvents });
  const generateUniversalId =
    deps.generateUniversalCaseId || generateUniversalCaseId;

  async function runInTransaction(work) {
    let session;
    try {
      session = await mongoose.startSession();
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error) {
      if (
        error.message?.includes('Transaction numbers are only allowed') ||
        error.message?.includes('replica set') ||
        error.message?.includes('Transaction support') ||
        error.codeName === 'IllegalOperation'
      ) {
        return work(null);
      }
      throw error;
    } finally {
      await session?.endSession().catch(() => {});
    }
  }

  async function createDraft(input, context = {}) {
    const validation = createDraftSchema(input);
    if (!validation.valid) {
      throw new CafServiceError('Draft could not be saved.', 400, 'VALIDATION_ERROR', validation.errors);
    }

    const now = new Date();
    const caseDoc = await cases.createDraft({
      caseId: generateCaseId(now),
      applicationType: 'combined_application_form',
      sourceSystem: validation.data.sourceSystem,
      sourceReferenceId: validation.data.sourceReferenceId || undefined,
      createdBy: context.user?._id || context.user?.id || null,
      applicantUserId: context.user?._id || context.user?.id || null,
      investorId: String(context.user?._id || context.user?.id || ''),
      caseType: 'combined_application_form',
      title: validation.data.project.projectName || validation.data.enterprise.legalName || 'CAF Draft',
      description: validation.data.project.projectDescription || '',
      status: 'draft',
      currentStage: 'Draft saved',
      cafData: validation.data,
      validationWarnings: validation.warnings,
      metadata: { draftVersion: 1 },
      correlationId: context.correlationId || null,
      lastActivityAt: now
    });

    await events.append(
      createEventPayload(
        'case.draft_created.v1',
        caseDoc,
        {
          previousStatus: null,
          nextStatus: 'draft',
          warnings: validation.warnings
        },
        context
      )
    );

    await auditEvents.append({
      action: 'case.draft_created',
      resourceType: 'case',
      resourceId: caseDoc.caseId,
      caseId: caseDoc.caseId,
      universalCaseId: null,
      metadata: { warnings: validation.warnings },
      context: createContextMeta(context)
    });

    if (validation.data.attachments.length) {
      await attachmentService.attachDocumentMetadata(caseDoc.caseId, validation.data.attachments, context);
    }

    return { caseDoc, validation };
  }

  async function updateDraft(caseId, input, context = {}) {
    const caseDoc = await cases.findById(caseId);
    if (!caseDoc) {
      throw new CafServiceError('Draft not found.', 404, 'NOT_FOUND');
    }
    assertInvestorAccess(caseDoc, context);

    if (caseDoc.status !== 'draft') {
      throw new CafServiceError('Only draft cases can be edited.', 409, 'CASE_NOT_EDITABLE');
    }

    const validation = updateDraftSchema(input);
    if (!validation.valid) {
      throw new CafServiceError('Draft could not be updated.', 400, 'VALIDATION_ERROR', validation.errors);
    }

    const updated = await cases.updateDraft(caseId, {
      title: validation.data.project.projectName || validation.data.enterprise.legalName || caseDoc.title,
      description: validation.data.project.projectDescription || '',
      cafData: validation.data,
      validationWarnings: validation.warnings,
      lastActivityAt: new Date(),
      metadata: {
        ...(caseDoc.metadata || {}),
        draftVersion: Number(caseDoc.metadata?.draftVersion || 1) + 1
      }
    });

    await events.append(
      createEventPayload(
        'case.draft_updated.v1',
        updated,
        { previousStatus: caseDoc.status, nextStatus: updated.status },
        context
      )
    );

    await auditEvents.append({
      action: 'case.draft_updated',
      resourceType: 'case',
      resourceId: updated.caseId,
      caseId: updated.caseId,
      universalCaseId: updated.universalCaseId || null,
      before: { cafData: caseDoc.cafData },
      after: { cafData: updated.cafData },
      context: createContextMeta(context)
    });

    if (validation.data.attachments.length) {
      await attachmentService.attachDocumentMetadata(updated.caseId, validation.data.attachments, context);
    }

    return { caseDoc: updated, validation };
  }

  async function validateDraft(caseId, context = {}) {
    const caseDoc = await cases.findById(caseId);
    if (!caseDoc) {
      throw new CafServiceError('Draft not found.', 404, 'NOT_FOUND');
    }
    assertInvestorAccess(caseDoc, context);

    const approvalInfo = calculateApprovalTracks(caseDoc.cafData);
    const validation = finalSubmitSchema(caseDoc.cafData, approvalInfo.requiredAttachments);

    const duplicateCheck = await duplicateDetection.checkDuplicate(caseDoc.cafData, context);
    const attachmentValidation = await attachmentService.validateRequiredAttachments(
      caseDoc,
      approvalInfo.requiredAttachments
    );

    if (!attachmentValidation.valid) {
      validation.errors.attachments = (validation.errors.attachments || []).concat(
        attachmentValidation.missing.map(
          (item) => `Missing required attachment: ${item.replaceAll('_', ' ')}.`
        )
      );
      validation.valid = false;
    }

    await events.append(
      createEventPayload(
        'case.validation_requested.v1',
        caseDoc,
        {
          previousStatus: caseDoc.status,
          nextStatus: caseDoc.status,
          valid: validation.valid
        },
        context
      )
    );

    await auditEvents.append({
      action: 'case.validated',
      resourceType: 'case',
      resourceId: caseDoc.caseId,
      caseId: caseDoc.caseId,
      universalCaseId: caseDoc.universalCaseId || null,
      metadata: {
        valid: validation.valid,
        duplicateCheck
      },
      context: createContextMeta(context)
    });

    return {
      caseDoc,
      validation,
      approvalInfo,
      duplicateCheck,
      attachmentValidation
    };
  }

  async function submitCase(caseId, input = {}, context = {}) {
    const caseDoc = await cases.findById(caseId);
    if (!caseDoc) {
      throw new CafServiceError('Draft not found.', 404, 'NOT_FOUND');
    }
    assertInvestorAccess(caseDoc, context);

    if (caseDoc.status !== 'draft') {
      if (
        context.idempotencyKey &&
        caseDoc.submissionIdempotencyKeys?.includes(context.idempotencyKey) &&
        caseDoc.universalCaseId
      ) {
        const currentTasks = await tasks.findByCaseId(caseDoc.caseId);
        return {
          caseDoc,
          tasks: currentTasks,
          acknowledgement: caseDoc.acknowledgement || generateAcknowledgement(caseDoc, currentTasks, context),
          duplicateCheck: caseDoc.duplicateCheck || null,
          replayed: true
        };
      }
      throw new CafServiceError('Only draft cases can be submitted.', 409, 'INVALID_CASE_STATUS');
    }

    const validationResult = await validateDraft(caseId, context);
    if (!validationResult.validation.valid) {
      throw new CafServiceError(
        'Final submission validation failed.',
        400,
        'VALIDATION_ERROR',
        validationResult.validation.errors,
        { warnings: validationResult.validation.warnings }
      );
    }

    const duplicateCheck = validationResult.duplicateCheck;
    if (duplicateCheck.isDuplicate) {
      await events.append(
        createEventPayload(
          'case.duplicate_detected.v1',
          caseDoc,
          { duplicateCheck },
          context
        )
      );
      await auditEvents.append({
        action: 'case.duplicate_detected',
        resourceType: 'case',
        resourceId: caseDoc.caseId,
        caseId: caseDoc.caseId,
        universalCaseId: null,
        metadata: duplicateCheck,
        context: createContextMeta(context)
      });
    }

    if (duplicateCheck.blocking) {
      throw new CafServiceError(
        'Duplicate submission blocked.',
        409,
        'DUPLICATE_BLOCKED',
        {},
        { duplicateCheck }
      );
    }

    if (
      duplicateCheck.isDuplicate &&
      !validationResult.caseDoc.cafData.duplicateOverrideConfirmed &&
      !input.duplicateOverrideConfirmed
    ) {
      throw new CafServiceError(
        'Duplicate confirmation is required before final submission.',
        409,
        'DUPLICATE_CONFIRMATION_REQUIRED',
        {},
        { duplicateCheck }
      );
    }

    const result = await runInTransaction(async (session) => {
      const universalCaseId =
        caseDoc.universalCaseId || (await generateUniversalId(new Date(), session));
      const initialTasks = buildInitialTasks(
        { ...caseDoc.toObject(), universalCaseId },
        validationResult.approvalInfo.approvalTracks,
        context
      );
      const acknowledgement = generateAcknowledgement(
        {
          ...caseDoc.toObject(),
          universalCaseId,
          submittedAt: new Date(),
          status: 'submitted',
          requiredDepartments: validationResult.approvalInfo.requiredDepartments
        },
        initialTasks,
        {
          ...context,
          universalCaseId
        }
      );

      const updatedCase = await cases.markSubmitted(
        caseId,
        {
          universalCaseId,
          title: validationResult.validation.data.project.projectName || caseDoc.title,
          description: validationResult.validation.data.project.projectDescription || '',
          cafData: {
            ...validationResult.validation.data,
            duplicateOverrideConfirmed:
              input.duplicateOverrideConfirmed ||
              validationResult.validation.data.duplicateOverrideConfirmed,
            duplicateOverrideReason:
              input.duplicateOverrideReason ||
              validationResult.validation.data.duplicateOverrideReason
          },
          status: 'submitted',
          currentStage: 'Application submitted for scrutiny',
          submittedAt: caseDoc.submittedAt || new Date(),
          lastActivityAt: new Date(),
          requiredDepartments: validationResult.approvalInfo.requiredDepartments,
          approvalTracks: validationResult.approvalInfo.approvalTracks.map((track) => ({
            ...track,
            status: 'pending'
          })),
          duplicateCheck: {
            ...duplicateCheck,
            duplicateOverrideConfirmed:
              input.duplicateOverrideConfirmed ||
              validationResult.validation.data.duplicateOverrideConfirmed ||
              false,
            duplicateOverrideReason:
              input.duplicateOverrideReason ||
              validationResult.validation.data.duplicateOverrideReason ||
              '',
            checkedAt: new Date()
          },
          acknowledgement,
          metadata: {
            ...(caseDoc.metadata || {}),
            attachmentCount: (
              await documents.findByCaseId(caseDoc.caseId)
            ).length
          },
          submissionIdempotencyKeys: context.idempotencyKey
            ? uniqueArray([...(caseDoc.submissionIdempotencyKeys || []), context.idempotencyKey])
            : caseDoc.submissionIdempotencyKeys || []
        },
        session
      );

      const createdTasks = await tasks.createMany(initialTasks, session);

      const domainEvents = [
        createEventPayload(
          'case.submitted.v1',
          updatedCase,
          {
            previousStatus: 'draft',
            nextStatus: 'submitted',
            duplicateCheck,
            requiredDepartments: updatedCase.requiredDepartments
          },
          { ...context, universalCaseId }
        ),
        createEventPayload(
          'acknowledgement.generated.v1',
          updatedCase,
          {
            acknowledgementNumber: acknowledgement.acknowledgementNumber,
            universalCaseId
          },
          { ...context, universalCaseId }
        )
      ].concat(
        createdTasks.map((task) => ({
          eventName: 'task.created.v1',
          eventVersion: 'v1',
          source: 'udyogsetu-web',
          subject: `cases/${updatedCase.caseId}/tasks/${task._id}`,
          correlationId: context.correlationId || null,
          aggregateType: 'case',
          aggregateId: updatedCase.caseId,
          universalCaseId,
          payload: {
            taskId: String(task._id),
            departmentCode: task.departmentCode,
            taskType: task.taskType,
            title: task.title
          },
          metadata: { actorId: String(context.user?._id || context.user?.id || '') }
        }))
      );

      await events.appendMany(domainEvents, session);

      await auditEvents.append({
        action: 'case.submitted',
        resourceType: 'case',
        resourceId: updatedCase.caseId,
        caseId: updatedCase.caseId,
        universalCaseId,
        before: { status: 'draft' },
        after: { status: 'submitted' },
        metadata: {
          requiredDepartments: updatedCase.requiredDepartments,
          duplicateCheck
        },
        context: createContextMeta(context)
      });

      await auditEvents.append({
        action: 'acknowledgement.generated',
        resourceType: 'case',
        resourceId: updatedCase.caseId,
        caseId: updatedCase.caseId,
        universalCaseId,
        metadata: acknowledgement,
        context: createContextMeta(context)
      });

      return {
        caseDoc: updatedCase,
        tasks: createdTasks,
        acknowledgement,
        duplicateCheck
      };
    });

    return result;
  }

  async function amendCase(caseId, input = {}, context = {}) {
    const caseDoc = await cases.findById(caseId);
    if (!caseDoc) {
      throw new CafServiceError('Case not found.', 404, 'NOT_FOUND');
    }
    assertInvestorAccess(caseDoc, context);

    if (caseDoc.status === 'closed' || caseDoc.status === 'withdrawn') {
      throw new CafServiceError('This case cannot be amended.', 409, 'AMENDMENT_NOT_ALLOWED');
    }

    const validation = amendmentSchema(input);
    if (!validation.valid) {
      throw new CafServiceError('Amendment request is invalid.', 400, 'VALIDATION_ERROR', validation.errors);
    }

    const amendmentNumber = Number(caseDoc.amendmentHistory?.length || 0) + 1;
    const patch = validation.data.patch;
    const mergedCafData = {
      ...caseDoc.cafData,
      ...patch,
      enterprise: { ...(caseDoc.cafData?.enterprise || {}), ...(patch.enterprise || {}) },
      project: { ...(caseDoc.cafData?.project || {}), ...(patch.project || {}) },
      land: { ...(caseDoc.cafData?.land || {}), ...(patch.land || {}) },
      environment: { ...(caseDoc.cafData?.environment || {}), ...(patch.environment || {}) },
      power: { ...(caseDoc.cafData?.power || {}), ...(patch.power || {}) },
      fire: { ...(caseDoc.cafData?.fire || {}), ...(patch.fire || {}) },
      industrialSafety: { ...(caseDoc.cafData?.industrialSafety || {}), ...(patch.industrialSafety || {}) },
      labour: { ...(caseDoc.cafData?.labour || {}), ...(patch.labour || {}) }
    };

    const amendment = {
      amendmentNumber,
      requestedBy: context.user?._id || context.user?.id || null,
      reason: validation.data.reason,
      patch,
      status: 'applied',
      requestedAt: new Date(),
      appliedAt: new Date(),
      metadata: { changedFields: countChangedFields(caseDoc.cafData, mergedCafData) }
    };

    const updated = await cases.updateDraft(caseId, {
      cafData: mergedCafData,
      status: caseDoc.status === 'draft' ? 'draft' : 'reopened',
      currentStage: 'Amendment applied',
      lastActivityAt: new Date(),
      amendmentHistory: [...(caseDoc.amendmentHistory || []), amendment]
    });

    await events.append(
      createEventPayload(
        'case.amended.v1',
        updated,
        {
          previousStatus: caseDoc.status,
          nextStatus: updated.status,
          reason: validation.data.reason,
          amendmentNumber
        },
        context
      )
    );

    await auditEvents.append({
      action: 'case.amended',
      resourceType: 'case',
      resourceId: updated.caseId,
      caseId: updated.caseId,
      universalCaseId: updated.universalCaseId || null,
      before: { cafData: caseDoc.cafData },
      after: { cafData: updated.cafData },
      metadata: amendment,
      context: createContextMeta(context)
    });

    return { caseDoc: updated, amendment };
  }

  async function resubmitCase(caseId, input = {}, context = {}) {
    const caseDoc = await cases.findById(caseId);
    if (!caseDoc) {
      throw new CafServiceError('Case not found.', 404, 'NOT_FOUND');
    }
    assertInvestorAccess(caseDoc, context);

    if (!['query_raised', 'response_submitted', 'rejected', 'reopened'].includes(caseDoc.status)) {
      throw new CafServiceError('This case cannot be resubmitted.', 409, 'RESUBMISSION_NOT_ALLOWED');
    }

    const validation = resubmissionSchema(input);
    if (!validation.valid) {
      throw new CafServiceError('Resubmission is invalid.', 400, 'VALIDATION_ERROR', validation.errors);
    }

    const resubmissionNumber = Number(caseDoc.resubmissionHistory?.length || 0) + 1;
    const historyEntry = {
      resubmissionNumber,
      reason: validation.data.reason,
      submittedBy: context.user?._id || context.user?.id || null,
      submittedAt: new Date(),
      changedFields: validation.data.changedFields,
      responseToQueryId: validation.data.responseToQueryId || null,
      metadata: {}
    };

    const updated = await cases.updateDraft(caseId, {
      status: 'response_submitted',
      currentStage: 'Investor response submitted',
      resubmittedAt: new Date(),
      lastActivityAt: new Date(),
      resubmissionHistory: [...(caseDoc.resubmissionHistory || []), historyEntry]
    });

    await events.append(
      createEventPayload(
        'case.resubmitted.v1',
        updated,
        {
          previousStatus: caseDoc.status,
          nextStatus: 'response_submitted',
          reason: validation.data.reason,
          resubmissionNumber
        },
        context
      )
    );

    await auditEvents.append({
      action: 'case.resubmitted',
      resourceType: 'case',
      resourceId: updated.caseId,
      caseId: updated.caseId,
      universalCaseId: updated.universalCaseId || null,
      before: { status: caseDoc.status },
      after: { status: updated.status },
      metadata: historyEntry,
      context: createContextMeta(context)
    });

    return { caseDoc: updated, resubmission: historyEntry };
  }

  async function getAcknowledgement(caseId, context = {}) {
    const caseDoc = await cases.findById(caseId);
    if (!caseDoc) {
      throw new CafServiceError('Case not found.', 404, 'NOT_FOUND');
    }
    assertInvestorAccess(caseDoc, context);
    const currentTasks = await tasks.findByCaseId(caseDoc.caseId);
    return {
      caseDoc,
      tasks: currentTasks,
      acknowledgement:
        caseDoc.acknowledgement || generateAcknowledgement(caseDoc, currentTasks, context)
    };
  }

  async function getCase(caseId, context = {}) {
    const caseDoc = await cases.findById(caseId);
    if (!caseDoc) {
      throw new CafServiceError('Case not found.', 404, 'NOT_FOUND');
    }
    assertInvestorAccess(caseDoc, context);
    return caseDoc;
  }

  return {
    getCase,
    createDraft,
    updateDraft,
    validateDraft,
    submitCase,
    amendCase,
    resubmitCase,
    getAcknowledgement
  };
}

function uniqueArray(items) {
  return [...new Set(items.filter(Boolean))];
}

module.exports = { CafServiceError, ...buildCafService(), buildCafService };
