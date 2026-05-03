const { randomUUID } = require('crypto');
const repository = require('../repositories/communication-thread.repository');
const { appendDomainEvent } = require('./event-outbox.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

function contextActor(context = {}) {
  return context.user || { actorType: 'user', actorId: context.userId || null, role: context.role || null };
}

async function createThread(input, context = {}) {
  const thread = await repository.create({
    ...input,
    status: input.status || 'open',
    messages: input.messages || [],
    lastMessageAt: input.lastMessageAt || null,
    lastMessageBy: input.lastMessageBy || null,
    correlationId: context.correlationId || null,
    createdBy: context.userId || null,
    updatedBy: context.userId || null
  });
  return thread;
}

async function addMessage(threadId, input, context = {}) {
  const thread = await repository.findById(threadId, { activeOnly: true });
  if (!thread) throw new Error('Thread not found.');
  const message = {
    messageId: input.messageId || randomUUID(),
    authorUserId: context.userId || null,
    authorRole: context.role || null,
    body: input.body,
    visibility: input.visibility || 'department_visible',
    attachments: input.attachments || [],
    isSystemGenerated: Boolean(input.isSystemGenerated),
    createdAt: new Date(),
    metadata: input.metadata || {}
  };
  thread.messages.push(message);
  thread.lastMessageAt = message.createdAt;
  thread.lastMessageBy = context.userId || null;
  thread.updatedBy = context.userId || null;
  await thread.save();
  await appendDomainEvent({
    eventName: EVENT_NAMES.COMMENT_CREATED,
    aggregateType: 'communication_thread',
    aggregateId: String(thread._id),
    universalCaseId: thread.universalCaseId || null,
    payload: {
      threadId: String(thread._id),
      visibility: message.visibility,
      resourceType: thread.resourceType,
      resourceId: String(thread.resourceId)
    }
  }, context).catch(() => {});
  await recordAuditEvent({
    actor: contextActor(context),
    action: 'comment.created',
    resourceType: 'communication_thread',
    resourceId: String(thread._id),
    caseId: thread.caseId || null,
    universalCaseId: thread.universalCaseId || null,
    correlationId: context.correlationId || null
  }, context).catch(() => {});
  return thread;
}

async function listThreadMessages(threadId, user, context = {}) {
  const thread = await repository.findById(threadId, { activeOnly: true });
  if (!thread) throw new Error('Thread not found.');
  const role = user.primaryRole || user.role;
  const messages = thread.messages.filter((message) =>
    role === 'investor' ? !['internal', 'audit_only'].includes(message.visibility) : true
  );
  return messages;
}

async function closeThread(threadId, reason, context = {}) {
  return repository.updateById(threadId, {
    status: 'closed',
    metadata: { closeReason: reason || null },
    updatedBy: context.userId || null
  });
}

async function findOrCreateThread(resourceType, resourceId, input, context = {}) {
  const existing = await repository.findByResource(resourceType, resourceId);
  if (existing) return existing;
  return createThread(
    {
      threadType: input.threadType || resourceType,
      resourceType,
      resourceId,
      caseId: input.caseId || null,
      universalCaseId: input.universalCaseId || null,
      taskId: input.taskId || null,
      grievanceId: input.grievanceId || null,
      departmentCode: input.departmentCode || null,
      participants: input.participants || [],
      subject: input.subject || null,
      visibility: input.visibility || 'department_visible'
    },
    context
  );
}

async function createInternalComment(resourceType, resourceId, input, context = {}) {
  const thread = await findOrCreateThread(resourceType, resourceId, input, context);
  return addMessage(thread._id, { ...input, visibility: 'internal' }, context);
}

async function createExternalReply(resourceType, resourceId, input, context = {}) {
  const thread = await findOrCreateThread(resourceType, resourceId, input, context);
  return addMessage(thread._id, { ...input, visibility: 'investor_visible' }, context);
}

module.exports = {
  createThread,
  addMessage,
  listThreadMessages,
  closeThread,
  createInternalComment,
  createExternalReply
};
