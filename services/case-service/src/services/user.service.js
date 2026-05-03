const userRepository = require('../repositories/user.repository');
const { appendDomainEvent } = require('./event-outbox.service');
const { DOMAIN_EVENT_NAMES } = require('../../../../packages/shared/src');

async function createUser(input, context = {}) {
  const user = await userRepository.create(
    {
      ...input,
      createdBy: context.userId || null,
      updatedBy: context.userId || null,
      correlationId: context.correlationId || null
    },
    context
  );

  await appendDomainEvent(
    {
      eventName: DOMAIN_EVENT_NAMES.USER_CREATED,
      aggregateType: 'user',
      aggregateId: user.id,
      payload: { userId: user.id, email: user.email, primaryRole: user.primaryRole }
    },
    context
  );

  return user;
}

module.exports = { createUser };
