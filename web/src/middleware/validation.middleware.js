function validateLogin(body) {
  const errors = [];
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
  if (!password) errors.push('Password is required.');
  return { errors, values: { email, password, next: body.next || '' } };
}

function validateRegistration(body) {
  const errors = [];
  const values = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    organisation: String(body.organisation || '').trim(),
    password: String(body.password || '')
  };
  if (!values.name) errors.push('Name is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('A valid email is required.');
  if (!values.organisation) errors.push('Organisation name is required.');
  if (values.password.length < 8) errors.push('Password must be at least 8 characters.');
  return { errors, values };
}

module.exports = {
  validateLogin,
  validateRegistration
};
