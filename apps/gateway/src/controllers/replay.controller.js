const replayService = require('../../../../services/orchestration-service/src/replay/replay.service');

function ctx(req) {
  return {
    correlationId: req.context?.correlationId || null,
    userId: req.context?.actor?.id || null,
    role: req.context?.actor?.role || null,
    actor: {
      actorType: 'user',
      actorId: req.context?.actor?.id || null,
      role: req.context?.actor?.role || null,
      serviceName: 'gateway'
    }
  };
}

function envelope(req, data) {
  return {
    success: true,
    data,
    error: null,
    meta: { correlationId: req.context?.correlationId || null, timestamp: new Date().toISOString() }
  };
}

async function listAttempts(req, res) {
  res.json(envelope(req, await replayService.listReplayAttempts({}, req.query || {})));
}

async function getAttempt(req, res) {
  const attempt = await replayService.getReplayAttempt(req.params.replayId);
  if (!attempt) return res.status(404).json({ success: false, data: null, error: { message: 'Replay attempt not found.' } });
  res.json(envelope(req, attempt));
}

async function requestReplay(req, res) {
  const attempt = await replayService.createReplayAttempt({
    reason: req.body.reason,
    mode: req.body.mode,
    dryRun: req.body.dryRun,
    filter: req.body.filter || {}
  }, ctx(req));
  const result = await replayService.runReplay(attempt.replayId, ctx(req));
  res.status(201).json(envelope(req, result));
}

async function cancelReplay(req, res) {
  const attempt = await replayService.cancelReplay(req.params.replayId, ctx(req));
  if (!attempt) return res.status(404).json({ success: false, data: null, error: { message: 'Replay attempt not found.' } });
  res.json(envelope(req, attempt));
}

async function replayByCase(req, res) {
  req.body.filter = { universalCaseId: req.params.universalCaseId };
  return requestReplay(req, res);
}

async function replayByDeadLetter(req, res) {
  req.body.filter = { eventId: req.params.messageId, publishStatus: 'dead_lettered' };
  return requestReplay(req, res);
}

module.exports = {
  listAttempts,
  getAttempt,
  requestReplay,
  cancelReplay,
  replayByCase,
  replayByDeadLetter
};
