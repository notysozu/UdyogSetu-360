const { AppError } = require('../utils/app-error');
const { sendAccepted, sendError } = require('../utils/api-response');
const {
  beginRecord,
  completeRecord,
  failRecord
} = require('../services/idempotency.service');

function requireIdempotencyKey() {
  return async function idempotencyMiddleware(req, res, next) {
    const key = req.get('Idempotency-Key');
    if (!key) {
      return next(
        new AppError(
          'VALIDATION_ERROR',
          'Idempotency-Key header is required for this endpoint.',
          400,
          [{ field: 'Idempotency-Key', message: 'Missing required header.' }]
        )
      );
    }

    const actorId = req.context?.actor?.id || 'anonymous';
    const result = await beginRecord({
      key,
      method: req.method,
      route: req.route?.path || req.originalUrl,
      body: req.body,
      actorId,
      correlationId: req.context?.correlationId
    });

    if (result.state === 'replayed') {
      res.setHeader('x-idempotency-status', 'replayed');
      return res.status(result.record.responseStatus || 200).json(result.record.responseBody);
    }

    if (result.state === 'conflict') {
      res.setHeader('x-idempotency-status', 'conflict');
      return sendError(
        res,
        new AppError(
          'IDEMPOTENCY_CONFLICT',
          'Idempotency key was already used with a different payload.',
          409
        ),
        409
      );
    }

    if (result.state === 'processing') {
      res.setHeader('x-idempotency-status', 'processing');
      return sendAccepted(
        res,
        { message: 'A matching request is already being processed.' },
        { idempotencyStatus: 'processing' }
      );
    }

    res.setHeader('x-idempotency-status', 'created');
    req.idempotencyRecord = result.record;

    const originalJson = res.json.bind(res);
    res.json = function patchedJson(body) {
      res.locals.idempotencyResponseBody = body;
      return originalJson(body);
    };

    res.on('finish', async () => {
      if (!req.idempotencyRecord?._id) return;
      if (res.statusCode >= 500) {
        await failRecord(req.idempotencyRecord._id).catch(() => {});
        return;
      }
      await completeRecord(
        req.idempotencyRecord._id,
        res.statusCode,
        res.locals.idempotencyResponseBody
      ).catch(() => {});
    });

    next();
  };
}

module.exports = { requireIdempotencyKey };
