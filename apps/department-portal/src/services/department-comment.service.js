const commentRepository = require('../../../../services/case-service/src/repositories/comment.repository');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { emitAndAudit } = require('./department-action-event.service');

async function addTaskComment(taskId, input, context = {}) {
  const comment = await commentRepository.create({
    resourceType: 'task',
    resourceId: taskId,
    caseId: input.caseId || null,
    taskId,
    universalCaseId: input.universalCaseId || null,
    authorUserId: context.user?.id || context.user?._id || null,
    authorRole: context.role,
    departmentCode: context.departmentCode || null,
    body: input.body,
    visibility: input.visibility || 'internal',
    attachments: input.attachments || [],
    correlationId: context.correlationId || null,
    metadata: input.metadata || {}
  });
  await emitAndAudit(EVENT_NAMES.COMMENT_CREATED, 'comment.created', {
    resourceType: 'comment',
    resourceId: comment.id,
    caseId: input.caseId || null,
    taskId,
    universalCaseId: input.universalCaseId || null,
    departmentCode: context.departmentCode || null
  }, {
    resourceId: comment.id,
    taskId,
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    aggregateType: 'comment',
    body: input.body,
    visibility: input.visibility || 'internal'
  }, context);
  return comment;
}

async function addCaseComment(caseId, input, context = {}) {
  const comment = await commentRepository.create({
    resourceType: 'case',
    resourceId: caseId,
    caseId,
    universalCaseId: input.universalCaseId || null,
    authorUserId: context.user?.id || context.user?._id || null,
    authorRole: context.role,
    departmentCode: context.departmentCode || null,
    body: input.body,
    visibility: input.visibility || 'nodal_visible',
    attachments: input.attachments || [],
    correlationId: context.correlationId || null,
    metadata: input.metadata || {}
  });
  await emitAndAudit(EVENT_NAMES.COMMENT_CREATED, 'comment.created', {
    resourceType: 'comment',
    resourceId: comment.id,
    caseId,
    universalCaseId: input.universalCaseId || null,
    departmentCode: context.departmentCode || null
  }, {
    resourceId: comment.id,
    caseId,
    universalCaseId: input.universalCaseId || null,
    aggregateType: 'comment',
    body: input.body,
    visibility: input.visibility || 'nodal_visible'
  }, context);
  return comment;
}

function listComments(resourceType, resourceId, context = {}) {
  const filter = {};
  if (context.role === 'auditor') return commentRepository.listByResource(resourceType, resourceId, filter);
  if (context.role === 'nodal_officer') {
    filter.visibility = { $in: ['internal', 'nodal_visible', 'investor_visible'] };
  } else {
    filter.visibility = { $in: ['internal', 'investor_visible'] };
  }
  return commentRepository.listByResource(resourceType, resourceId, filter);
}

async function markCommentInternal() {
  return null;
}

module.exports = {
  addTaskComment,
  addCaseComment,
  listComments,
  markCommentInternal
};
