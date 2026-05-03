const { randomUUID } = require('crypto');
const consentRepository = require('../repositories/digilocker-consent.repository');
const { getDigiLockerConfig } = require('./digilocker.config');
const reconciliationService = require('./digilocker-reconciliation.service');

async function initiateConsent(input, context = {}) {
  const config = getDigiLockerConfig();
  const consentId = randomUUID();
  const state = randomUUID();
  const consent = await consentRepository.create({
    consentId,
    userId: context.user?._id || context.user?.id || null,
    organisationId: context.user?.organisationId || null,
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    requestedDocumentTypes: input.requestedDocumentTypes || [],
    status: 'initiated',
    purpose: input.purpose,
    redirectUrl: input.redirectAfterConsent || null,
    state,
    nonce: randomUUID(),
    expiresAt: new Date(Date.now() + config.consentExpiresMinutes * 60 * 1000),
    correlationId: context.correlationId || null
  });
  await reconciliationService.logOperation({
    consentId,
    userId: consent.userId,
    caseId: consent.caseId,
    universalCaseId: consent.universalCaseId,
    operation: 'consent_initiated',
    status: 'succeeded',
    requestPayload: input,
    correlationId: context.correlationId
  });
  return {
    consentId,
    status: consent.status,
    consentUrl: config.enabled
      ? `${config.baseUrl}/oauth2/authorize?client_id=${encodeURIComponent(config.clientId)}&state=${encodeURIComponent(state)}`
      : `${config.redirectUri}?mock=true&state=${encodeURIComponent(state)}`,
    expiresAt: consent.expiresAt,
    state
  };
}

module.exports = { initiateConsent };
