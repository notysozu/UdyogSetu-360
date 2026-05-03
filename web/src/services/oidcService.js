const { env } = require('../config/env');

function isOidcEnabled() {
  return env.OIDC_ENABLED;
}

function buildSsoStartUrl(next = '/') {
  if (!isOidcEnabled()) return null;
  return `${env.OIDC_ISSUER_URL}/authorize?client_id=${encodeURIComponent(env.OIDC_CLIENT_ID)}&redirect_uri=${encodeURIComponent(env.OIDC_CALLBACK_URL)}&response_type=code&scope=openid%20profile%20email&state=${encodeURIComponent(next)}`;
}

function mapOidcClaimsToLocalUser(claims = {}) {
  return {
    email: claims.email || '',
    name: claims.name || claims.preferred_username || '',
    roles: claims.roles || [],
    department: claims.department || null,
    organisation: claims.organisation || null
  };
}

module.exports = {
  isOidcEnabled,
  buildSsoStartUrl,
  mapOidcClaimsToLocalUser
};
