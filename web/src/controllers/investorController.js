const Case = require('../models/Case');
const ApprovalTask = require('../models/ApprovalTask');
const EventLog = require('../models/EventLog');
const Grievance = require('../models/Grievance');
const Notification = require('../models/Notification');
const { createCase } = require('../services/caseService');
const { appendEvent } = require('../services/eventService');

async function dashboard(req, res) {
  const currentUser = req.user || req.session.user;
  const cases = await Case.find({ createdBy: currentUser.id }).sort({ createdAt: -1 }).limit(20).populate('approvals.department');
  const notifications = await Notification.find({ user: currentUser.id }).sort({ createdAt: -1 }).limit(6);
  return res.render('pages/investor-dashboard', { title: 'Investor Dashboard', cases, notifications });
}

function newCaseForm(req, res) {
  return res.render('pages/case-new', { title: 'New Application' });
}

async function createCaseFromForm(req, res) {
  const caseDoc = await createCase({ payload: req.body, user: req.user || req.session.user, correlationId: req.correlationId });
  req.flash('success', `Application submitted. Universal Case ID: ${caseDoc.caseId}`);
  return res.redirect(`/cases/${caseDoc.caseId}`);
}

async function caseDetail(req, res) {
  const currentUser = req.user || req.session.user;
  const caseDoc = await Case.findOne({ caseId: req.params.caseId, createdBy: currentUser.id }).populate('approvals.department');
  if (!caseDoc) {
    const error = new Error('Case not found');
    error.status = 404;
    throw error;
  }
  const events = await EventLog.find({ caseId: caseDoc.caseId }).sort({ occurredAt: -1 }).limit(50);
  const grievances = await Grievance.find({ caseId: caseDoc.caseId }).sort({ createdAt: -1 });
  const tasks = await ApprovalTask.find({ caseId: caseDoc.caseId }).sort({ createdAt: 1 });
  return res.render('pages/case-detail', { title: `Case ${caseDoc.caseId}`, caseDoc, events, grievances, tasks });
}

async function raiseGrievance(req, res) {
  const currentUser = req.user || req.session.user;
  const { subject, message } = req.body;
  const caseDoc = await Case.findOne({ caseId: req.params.caseId, createdBy: currentUser.id });
  if (!caseDoc) {
    const error = new Error('Case not found');
    error.status = 404;
    throw error;
  }
  await Grievance.create({ caseId: caseDoc.caseId, raisedBy: currentUser.id, subject, message });
  await appendEvent({
    type: 'grievance.raised',
    caseId: caseDoc.caseId,
    actor: currentUser,
    correlationId: req.correlationId,
    payload: { subject }
  });
  req.flash('success', 'Grievance raised and attached to the case timeline.');
  return res.redirect(`/cases/${caseDoc.caseId}`);
}

module.exports = { dashboard, newCaseForm, createCaseFromForm, caseDetail, raiseGrievance };
