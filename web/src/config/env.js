const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 3000),
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret',
  JWT_ISSUER: process.env.JWT_ISSUER || 'udyogsetu-360',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'udyogsetu-360-web',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '2h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || process.env.SESSION_SECRET || 'dev-cookie-secret',
  AUTH_COOKIE_SECURE: String(process.env.AUTH_COOKIE_SECURE || process.env.NODE_ENV === 'production').toLowerCase() === 'true',
  AUTH_COOKIE_SAME_SITE: process.env.AUTH_COOKIE_SAME_SITE || 'lax',
  AUTH_SESSION_MAX_AGE_MS: Number(process.env.AUTH_SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 8),
  PASSWORD_RESET_EXPIRES_MINUTES: Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 30),
  EMAIL_VERIFICATION_EXPIRES_MINUTES: Number(process.env.EMAIL_VERIFICATION_EXPIRES_MINUTES || 60),
  OTP_EXPIRES_MINUTES: Number(process.env.OTP_EXPIRES_MINUTES || 10),
  OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  SERVICE_JWT_SECRET: process.env.SERVICE_JWT_SECRET || 'dev-service-jwt-secret',
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-service-token',
  TRUSTED_SERVICE_NAMES: String(process.env.TRUSTED_SERVICE_NAMES || 'gateway,case-service,notification-service,n8n').split(',').map((item) => item.trim()).filter(Boolean),
  OIDC_ENABLED: String(process.env.OIDC_ENABLED || 'false').toLowerCase() === 'true',
  OIDC_ISSUER_URL: process.env.OIDC_ISSUER_URL || '',
  OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID || '',
  OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET || '',
  OIDC_CALLBACK_URL: process.env.OIDC_CALLBACK_URL || '',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET || 'dev-n8n-secret',
  CASE_ID_PREFIX: process.env.CASE_ID_PREFIX || 'US360-KA',
  ACK_PREFIX: process.env.ACK_PREFIX || 'ACK-US360-KA',
  CAF_AUTOSAVE_ENABLED: String(process.env.CAF_AUTOSAVE_ENABLED || 'true').toLowerCase() === 'true',
  CAF_DUPLICATE_LOOKBACK_DAYS: Number(process.env.CAF_DUPLICATE_LOOKBACK_DAYS || 180),
  ATTACHMENT_STORAGE_PROVIDER: process.env.ATTACHMENT_STORAGE_PROVIDER || 's3',
  S3_BUCKET: process.env.S3_BUCKET || 'udyogsetu-documents'
};

module.exports = { env };
