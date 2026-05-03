const { randomUUID } = require('crypto');
const BaseProvider = require('./base-notification-provider');

class DevEmailProvider extends BaseProvider {
  constructor() {
    super('dev-email');
  }

  async sendEmail(input) {
    // Development-safe provider: never sends external mail.
    console.info('[notification:dev-email]', {
      to: input.to,
      subject: input.subject,
      preview: String(input.text || input.html || '').slice(0, 120)
    });
    return { ok: true, providerMessageId: `dev-email-${randomUUID()}` };
  }
}

module.exports = DevEmailProvider;
