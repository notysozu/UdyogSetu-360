const Case = require('../models/Case');
const EventLog = require('../models/EventLog');
const Department = require('../models/Department');
const { getAdminMetrics } = require('../services/dashboardService');

async function dashboard(req, res) {
  const metrics = await getAdminMetrics();
  const cases = await Case.find().sort({ createdAt: -1 }).limit(10).populate('approvals.department');
  const departments = await Department.find().sort({ family: 1 });
  const timelineBase = req.baseUrl === '/audit' ? '/audit' : '/admin';
  return res.render('pages/admin-dashboard', { title: 'Admin Console', metrics, cases, departments, timelineBase });
}

async function caseTimeline(req, res) {
  const events = await EventLog.find({ caseId: req.params.caseId }).sort({ occurredAt: -1 }).limit(100);
  return res.render('pages/timeline', { title: `Timeline ${req.params.caseId}`, caseId: req.params.caseId, events });
}

module.exports = { dashboard, caseTimeline };
