const DevEmailProvider = require('./dev-email.provider');
const DevSmsProvider = require('./dev-sms.provider');
const SmtpEmailProvider = require('./smtp-email.provider');
const SmsGatewayProvider = require('./sms-gateway.provider');

function getEmailProvider() {
  const provider = String(process.env.EMAIL_PROVIDER || 'dev');
  if (provider === 'smtp') return new SmtpEmailProvider();
  return new DevEmailProvider();
}

function getSmsProvider() {
  const provider = String(process.env.SMS_PROVIDER || 'dev');
  if (provider === 'gateway') return new SmsGatewayProvider();
  return new DevSmsProvider();
}

module.exports = { getEmailProvider, getSmsProvider };
