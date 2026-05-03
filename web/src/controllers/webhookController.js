const Notification = require('../models/Notification');
const Case = require('../models/Case');
const { env } = require('../config/env');
const { appendEvent } = require('../services/eventService');

async function n8nEscalation(req, res) {
  const secret = req.get('x-udyogsetu-secret');
  if (secret !== env.N8N_WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, error: { message: 'Invalid webhook secret' } });
  }

  const { caseId, title = 'SLA escalation', message = 'A workflow escalation was received.' } = req.body;
  const caseDoc = await Case.findOne({ caseId });
  if (!caseDoc) return res.status(404).json({ ok: false, error: { message: 'Case not found' } });

  if (caseDoc.createdBy) {
    await Notification.create({ user: caseDoc.createdBy, title, message, caseId });
  }

  await appendEvent({
    type: 'workflow.escalation.received',
    caseId,
    source: 'n8n',
    correlationId: req.correlationId,
    payload: { title, message }
  });

  return res.json({ ok: true, received: true });
}

module.exports = { n8nEscalation };
