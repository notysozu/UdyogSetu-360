const { AppError } = require('../utils/app-error');
const { getGatewayConfig } = require('../config/gateway.config');
const {
  verifySignature,
  withinTolerance
} = require('../services/webhook-signature.service');

function webhookVerificationMiddleware() {
  const config = getGatewayConfig();

  return function verifyWebhook(req, _res, next) {
    const signature = req.get('x-us360-signature');
    const timestamp = req.get('x-us360-timestamp');
    const webhookId = req.get('x-us360-webhook-id');

    if (
      config.nodeEnv !== 'production' &&
      config.webhookAllowDevBypass &&
      !signature
    ) {
      req.context.webhook = {
        verified: false,
        bypassed: true,
        webhookId: webhookId || null
      };
      return next();
    }

    if (!signature || !timestamp) {
      return next(
        new AppError(
          'WEBHOOK_SIGNATURE_INVALID',
          'Missing webhook signature headers.',
          401
        )
      );
    }

    if (!withinTolerance(timestamp)) {
      return next(
        new AppError(
          'WEBHOOK_SIGNATURE_INVALID',
          'Webhook timestamp is outside the allowed tolerance.',
          401
        )
      );
    }

    const rawBody = req.rawBody || '';
    const valid = verifySignature({
      secret: config.webhookDefaultSecret,
      rawBody,
      timestamp,
      providedSignature: signature
    });

    if (!valid) {
      return next(
        new AppError('WEBHOOK_SIGNATURE_INVALID', 'Webhook signature is invalid.', 401)
      );
    }

    req.context.webhook = {
      verified: true,
      webhookId: webhookId || null,
      timestamp
    };
    return next();
  };
}

module.exports = { webhookVerificationMiddleware };
