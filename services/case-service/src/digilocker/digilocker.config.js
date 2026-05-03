function getDigiLockerConfig() {
  return {
    enabled: String(process.env.DIGILOCKER_ENABLED || 'false') === 'true',
    environment: process.env.DIGILOCKER_ENVIRONMENT || 'sandbox',
    baseUrl: process.env.DIGILOCKER_BASE_URL || 'https://sandbox.digilocker.gov.in',
    clientId: process.env.DIGILOCKER_CLIENT_ID || '',
    clientSecret: process.env.DIGILOCKER_CLIENT_SECRET || '',
    redirectUri: process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:3000/digilocker/callback',
    requesterId: process.env.DIGILOCKER_REQUESTER_ID || '',
    orgId: process.env.DIGILOCKER_ORG_ID || '',
    consentExpiresMinutes: Number(process.env.DIGILOCKER_CONSENT_EXPIRES_MINUTES || 30),
    webhookSecret: process.env.DIGILOCKER_WEBHOOK_SECRET || 'change-me',
    allowSandboxMock: String(process.env.DIGILOCKER_ALLOW_SANDBOX_MOCK || 'true') === 'true'
  };
}

module.exports = { getDigiLockerConfig };
