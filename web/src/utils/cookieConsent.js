const COOKIE_CONSENT_NAME = 'us360_cookie_consent';
const COOKIE_CONSENT_VERSION = 1;
const COOKIE_CONSENT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 180;

function toBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function buildCookieConsent(action, categories = {}) {
  const base = {
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    decidedAt: new Date().toISOString()
  };

  if (action === 'accept_all') {
    return {
      ...base,
      choice: 'accept_all',
      analytics: true,
      preferences: true
    };
  }

  if (action === 'decline_optional') {
    return {
      ...base,
      choice: 'decline_optional',
      analytics: false,
      preferences: false
    };
  }

  if (action === 'customize') {
    return {
      ...base,
      choice: 'customize',
      analytics: toBoolean(categories.analytics),
      preferences: toBoolean(categories.preferences)
    };
  }

  throw new Error('Unsupported cookie consent action.');
}

function parseCookieConsent(rawConsent) {
  if (!rawConsent) return null;

  let consent = rawConsent;

  if (typeof rawConsent === 'string') {
    try {
      consent = JSON.parse(rawConsent);
    } catch (_error) {
      return null;
    }
  }

  if (!consent || typeof consent !== 'object') return null;
  if (Number(consent.version) !== COOKIE_CONSENT_VERSION) return null;

  return {
    version: COOKIE_CONSENT_VERSION,
    choice: typeof consent.choice === 'string' ? consent.choice : 'customize',
    necessary: true,
    analytics: Boolean(consent.analytics),
    preferences: Boolean(consent.preferences),
    decidedAt: typeof consent.decidedAt === 'string' ? consent.decidedAt : null
  };
}

function getCookieConsent(req) {
  return parseCookieConsent(req.cookies?.[COOKIE_CONSENT_NAME]);
}

function isSecureRequest(req) {
  return req.secure || req.get('x-forwarded-proto') === 'https';
}

function cookieConsentOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || isSecureRequest(req),
    maxAge: COOKIE_CONSENT_MAX_AGE_MS,
    path: '/'
  };
}

function clearCookieConsentOptions(req) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production' || isSecureRequest(req),
    path: '/'
  };
}

module.exports = {
  COOKIE_CONSENT_NAME,
  buildCookieConsent,
  clearCookieConsentOptions,
  cookieConsentOptions,
  getCookieConsent,
  parseCookieConsent
};
