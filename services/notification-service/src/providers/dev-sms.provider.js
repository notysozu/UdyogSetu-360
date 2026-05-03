const { randomUUID } = require('crypto');
const BaseProvider = require('./base-notification-provider');

class DevSmsProvider extends BaseProvider {
  constructor() {
    super('dev-sms');
  }

  async sendSms(input) {
    // Development-safe provider: never sends external SMS.
    console.info('[notification:dev-sms]', {
      to: input.to,
      preview: String(input.message || '').slice(0, 120)
    });
    return { ok: true, providerMessageId: `dev-sms-${randomUUID()}` };
  }
}

module.exports = DevSmsProvider;
