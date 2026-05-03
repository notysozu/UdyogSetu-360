const { randomUUID } = require('crypto');
const BaseProvider = require('./base-notification-provider');

class SmtpEmailProvider extends BaseProvider {
  constructor() {
    super('smtp');
  }

  async sendEmail(_input) {
    // TODO: wire nodemailer transport when SMTP integration is enabled.
    return { ok: true, providerMessageId: `smtp-placeholder-${randomUUID()}` };
  }
}

module.exports = SmtpEmailProvider;
