const Certificate = require('../../../../web/src/models/Certificate');
const dashboardService = require('../services/investor-dashboard.service');

async function listCertificates(req, res) {
  const reminders = await dashboardService.getRenewalReminders(req.user);
  const certificates = await Certificate.find({ $or: [{ holderName: req.user.name }, { enterpriseName: req.user.organisation || '' }] })
    .sort({ issuedAt: -1 })
    .limit(100)
    .catch(() => reminders);
  res.render('certificates/certificate-list', {
    title: 'Certificates',
    certificates
  });
}

async function listRenewals(req, res) {
  const reminders = await dashboardService.getRenewalReminders(req.user);
  res.render('renewals/renewal-list', {
    title: 'Renewals',
    reminders
  });
}

async function listCaseCertificates(req, res) {
  const certificates = await Certificate.find({ caseId: req.params.caseId }).sort({ issuedAt: -1 }).catch(() => []);
  res.render('certificates/certificate-list', {
    title: 'Case Certificates',
    certificates,
    caseId: req.params.caseId
  });
}

async function showCertificate(req, res) {
  const certificate = await Certificate.findOne({
    $or: [{ _id: req.params.certificateId }, { certificateNumber: req.params.certificateId }]
  }).catch(() => null);
  if (!certificate) {
    const error = new Error('Certificate not found.');
    error.status = 404;
    throw error;
  }
  res.render('certificates/certificate-detail', {
    title: certificate.certificateNumber,
    certificate
  });
}

async function downloadCertificate(req, res) {
  res.redirect(`/certificates/${req.params.certificateId}`);
}

async function showRenewalForm(req, res) {
  const certificate = await Certificate.findOne({
    $or: [{ _id: req.params.certificateId }, { certificateNumber: req.params.certificateId }]
  }).catch(() => null);
  res.render('certificates/renewal-form', {
    title: 'Renew Certificate',
    certificate
  });
}

function submitRenewalRequest(req, res) {
  req.flash('success', 'Renewal request placeholder submitted.');
  res.redirect('/renewals');
}

module.exports = {
  listCertificates,
  listCaseCertificates,
  showCertificate,
  downloadCertificate,
  listRenewals,
  showRenewalForm,
  submitRenewalRequest
};
