const express = require('express');
const { redirectForRole } = require('../controllers/authController');
const {
  COOKIE_CONSENT_NAME,
  buildCookieConsent,
  clearCookieConsentOptions,
  cookieConsentOptions,
  getCookieConsent
} = require('../utils/cookieConsent');
const { safeNextPath } = require('../utils/navigation');

const router = express.Router();

function wantsJson(req) {
  return req.accepts(['json', 'html']) === 'json';
}

router.get('/', (req, res) => {
  if (req.session.user) return res.redirect(redirectForRole(req.session.user.role));
  return res.render('pages/home', {
    title: 'UdyogSetu 360',
    layout: false,
    cookieConsent: getCookieConsent(req),
    selectedLanguage: req.cookies?.us360_language || 'en'
  });
});

router.get('/search', (req, res) => {
  const query = String(req.query.q || '').trim();
  const service = String(req.query.service || 'All Services').trim();
  const results = [
    { title: 'Track Universal Case ID', href: '/cases', description: 'Check live case status, SLA clock and department task movement.' },
    { title: 'Submit Common Application', href: '/cases/new', description: 'Start a unified application and route it to mapped departments.' },
    { title: 'Verify Certificate', href: '/verify', description: 'Validate certificate number, case ID or verification token.' },
    { title: 'Submit Grievance', href: '/grievances/new', description: 'Raise an issue and optionally link it to your Universal Case ID.' },
    { title: 'Department Portal', href: '/department', description: 'Open department queues and synchronisation actions.' }
  ].filter((item) => !query || `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase()));

  return res.render('pages/search', { title: 'Search Services', query, service, results });
});

router.get('/services', (req, res) => res.redirect('/search'));

router.get('/language', (req, res) => {
  const allowed = ['en', 'kn', 'hi'];
  const lang = allowed.includes(req.query.lang) ? req.query.lang : 'en';
  res.cookie('us360_language', lang, {
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 180,
    path: '/'
  });
  return res.redirect(safeNextPath(req.query.next, '/'));
});

router.get('/start-application', (req, res) => res.redirect('/cases/new'));
router.get('/apply', (req, res) => res.redirect('/cases/new'));
router.get('/track-application', (req, res) => res.redirect('/cases'));
router.get('/track-case', (req, res) => res.redirect('/cases'));
router.get('/department-portal', (req, res) => res.redirect('/department'));
router.get('/operations-console', (req, res) => res.redirect('/admin'));
router.get('/help', (req, res) => res.redirect('/contact?topic=helpdesk'));

router.get('/cookies/consent', (req, res) => {
  return res.json({
    ok: true,
    consent: getCookieConsent(req)
  });
});

router.post('/cookies/consent', (req, res) => {
  try {
    const consent = buildCookieConsent(req.body.action, req.body.categories);
    res.cookie(COOKIE_CONSENT_NAME, JSON.stringify(consent), cookieConsentOptions(req));

    if (!wantsJson(req)) return res.redirect(req.get('referer') || '/');
    return res.json({ ok: true, consent });
  } catch (_error) {
    if (!wantsJson(req)) {
      req.flash('error', 'Please choose a valid cookie preference.');
      return res.redirect(req.get('referer') || '/');
    }

    return res.status(400).json({
      ok: false,
      error: 'Please choose a valid cookie preference.'
    });
  }
});

router.delete('/cookies/consent', (req, res) => {
  res.clearCookie(COOKIE_CONSENT_NAME, clearCookieConsentOptions(req));
  return res.json({ ok: true });
});

module.exports = router;
