const ContactRequest = require('../models/ContactRequest');

function showContactForm(req, res) {
  return res.render('pages/contact', {
    title: 'Contact UdyogSetu 360',
    values: {
      name: req.session.user?.name || '',
      email: req.session.user?.email || '',
      topic: String(req.query.topic || 'general'),
      message: ''
    },
    errors: []
  });
}

async function createContactRequest(req, res) {
  const values = {
    name: String(req.body.name || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
    topic: String(req.body.topic || 'general').trim(),
    message: String(req.body.message || '').trim()
  };
  const allowedTopics = ['general', 'feedback', 'helpdesk', 'technical', 'department'];
  const errors = [];

  if (!values.name) errors.push('Name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('A valid email is required.');
  if (!allowedTopics.includes(values.topic)) values.topic = 'general';
  if (!values.message) errors.push('Message is required.');

  if (errors.length) {
    return res.status(400).render('pages/contact', {
      title: 'Contact UdyogSetu 360',
      values,
      errors
    });
  }

  await ContactRequest.create({
    ...values,
    user: req.session.user?.id
  });

  req.flash('success', 'Your request has been submitted. The UdyogSetu 360 team will follow up.');
  return res.redirect('/contact');
}

module.exports = { showContactForm, createContactRequest };
