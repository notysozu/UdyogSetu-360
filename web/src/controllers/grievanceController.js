const Case = require('../models/Case');
const Grievance = require('../models/Grievance');
const { appendEvent } = require('../services/eventService');

async function newGrievanceForm(req, res) {
  const cases = await Case.find({ createdBy: req.session.user.id }).sort({ createdAt: -1 }).limit(25);
  return res.render('pages/grievance-new', {
    title: 'Submit Grievance',
    cases,
    values: {
      caseId: String(req.query.caseId || ''),
      subject: '',
      message: ''
    },
    errors: []
  });
}

async function createGrievance(req, res) {
  const values = {
    caseId: String(req.body.caseId || '').trim(),
    subject: String(req.body.subject || '').trim(),
    message: String(req.body.message || '').trim()
  };
  const errors = [];

  if (!values.subject) errors.push('Subject is required.');
  if (!values.message) errors.push('Message is required.');

  let caseDoc = null;
  if (values.caseId) {
    caseDoc = await Case.findOne({
      caseId: values.caseId,
      createdBy: req.session.user.id
    });
    if (!caseDoc) errors.push('No matching case was found in your account.');
  }

  if (errors.length) {
    const cases = await Case.find({ createdBy: req.session.user.id }).sort({ createdAt: -1 }).limit(25);
    return res.status(400).render('pages/grievance-new', {
      title: 'Submit Grievance',
      cases,
      values,
      errors
    });
  }

  await Grievance.create({
    caseId: values.caseId || undefined,
    raisedBy: req.session.user.id,
    subject: values.subject,
    message: values.message
  });

  await appendEvent({
    type: 'grievance.raised',
    caseId: values.caseId || undefined,
    actor: req.session.user,
    correlationId: req.correlationId,
    payload: { subject: values.subject, source: 'public_grievance_form' }
  });

  req.flash('success', caseDoc
    ? 'Grievance submitted and linked to your case.'
    : 'Grievance submitted. The helpdesk will review it.');
  return res.redirect(values.caseId ? `/cases/${values.caseId}` : '/dashboard');
}

module.exports = { newGrievanceForm, createGrievance };
