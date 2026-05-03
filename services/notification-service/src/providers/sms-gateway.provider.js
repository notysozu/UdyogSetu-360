const { randomUUID } = require('crypto');
const BaseProvider = require('./base-notification-provider');

class SmsGatewayProvider extends BaseProvider {
  constructor() {
    super('sms-gateway');
  }

  async sendSms(_input) {
    // TODO: wire external SMS gateway integration when configured.
    return { ok: true, providerMessageId: `sms-gateway-placeholder-${randomUUID()}` };
  }
}

module.exports = SmsGatewayProvider;
