const Case = require('../models/Case');
const EventLog = require('../models/EventLog');
const { createCase } = require('../services/caseService');
const { validateSubmission, predictDelay } = require('../services/aiClient');

function health(req, res) {
  return res.json({ ok: true, service: 'udyogsetu-web', correlationId: req.correlationId, time: new Date().toISOString() });
}

async function createCaseApi(req, res) {
  const caseDoc = await createCase({ payload: req.body, user: req.session?.user || null, correlationId: req.correlationId });
  return res.status(201).json({ ok: true, data: { caseId: caseDoc.caseId, status: caseDoc.status } });
}

async function listCasesApi(req, res) {
  const cases = await Case.find().sort({ createdAt: -1 }).limit(50).populate('approvals.department');
  return res.json({ ok: true, data: cases });
}

async function eventsApi(req, res) {
  const events = await EventLog.find({ caseId: req.params.caseId }).sort({ occurredAt: -1 }).limit(100);
  return res.json({ ok: true, data: events });
}

async function validateApi(req, res) {
  const result = await validateSubmission(req.body);
  return res.json({ ok: true, data: result });
}

async function delayRiskApi(req, res) {
  const result = await predictDelay(req.body);
  return res.json({ ok: true, data: result });
}

module.exports = { health, createCaseApi, listCasesApi, eventsApi, validateApi, delayRiskApi };
