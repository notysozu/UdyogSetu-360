const Case = require('../../../../web/src/models/Case');
const grievanceService = require('../services/investor-grievance-view.service');

async function listGrievances(req, res) {
  const grievances = await grievanceService.getInvestorGrievances(req.user, {});
  res.render('grievances/grievance-list', {
    title: 'Grievances',
    grievances
  });
}

async function showNewGrievanceForm(req, res) {
  const cases = await Case.find({
    $or: [{ createdBy: req.user.id }, { applicantUserId: req.user.id }, { organisationId: req.user.organisationId || null }]
  }).sort({ createdAt: -1 }).limit(50).catch(() => []);
  res.render('grievances/new-grievance', {
    title: 'New Grievance',
    cases
  });
}

async function createGrievance(req, res) {
  if (!req.body.subject || !req.body.description || !req.body.category) {
    req.flash('error', 'Subject, description and category are required.');
    return res.redirect('/grievances/new');
  }
  const grievance = await grievanceService.createInvestorGrievance(req.user, req.body);
  req.flash('success', 'Grievance submitted successfully.');
  res.redirect(`/grievances/${grievance._id}`);
}

async function showGrievance(req, res) {
  const grievances = await grievanceService.getInvestorGrievances(req.user, {});
  const grievance = grievances.find((item) => String(item._id) === req.params.grievanceId);
  if (!grievance) {
    const error = new Error('Grievance not found.');
    error.status = 404;
    throw error;
  }
  res.render('grievances/grievance-detail', {
    title: grievance.subject,
    grievance
  });
}

async function addGrievanceMessage(req, res) {
  if (!req.body.message) {
    req.flash('error', 'Message is required.');
    return res.redirect(`/grievances/${req.params.grievanceId}`);
  }
  await grievanceService.addMessage(req.user, req.params.grievanceId, req.body);
  req.flash('success', 'Message added to grievance.');
  res.redirect(`/grievances/${req.params.grievanceId}`);
}

module.exports = {
  listGrievances,
  showNewGrievanceForm,
  createGrievance,
  showGrievance,
  addGrievanceMessage
};
