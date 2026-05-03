const Certificate = require('../models/Certificate');

function showVerifyForm(req, res) {
  return res.render('pages/verify', {
    title: 'Verify Certificate',
    query: '',
    result: null
  });
}

async function verifyCertificate(req, res) {
  const query = String(req.body.identifier || '').trim();

  if (!query) {
    return res.status(400).render('pages/verify', {
      title: 'Verify Certificate',
      query,
      result: { status: 'invalid', message: 'Enter a certificate number, case ID or verification token.' }
    });
  }

  const certificate = await Certificate.findOne({
    $or: [
      { certificateNumber: query },
      { caseId: query },
      { verificationToken: query }
    ]
  });

  return res.render('pages/verify', {
    title: 'Verify Certificate',
    query,
    result: certificate
      ? { status: certificate.status === 'valid' ? 'verified' : certificate.status, certificate }
      : { status: 'not_found', message: 'No matching certificate was found.' }
  });
}

module.exports = { showVerifyForm, verifyCertificate };
