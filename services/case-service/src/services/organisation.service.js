const organisationRepository = require('../repositories/organisation.repository');
const { appendDomainEvent } = require('./event-outbox.service');
const { DOMAIN_EVENT_NAMES } = require('../../../../packages/shared/src');

async function createOrganisation(input, context = {}) {
  const organisation = await organisationRepository.create(
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
      eventName: DOMAIN_EVENT_NAMES.ORGANISATION_CREATED,
      aggregateType: 'organisation',
      aggregateId: organisation.id,
      payload: { organisationId: organisation.id, legalName: organisation.legalName }
    },
    context
  );

  return organisation;
}

module.exports = { createOrganisation };
