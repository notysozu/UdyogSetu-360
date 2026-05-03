const User = require('../models/User');
const { createRepository } = require('./base.repository');

const repository = createRepository(User);

repository.findByEmail = function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase(), isDeleted: false }).select('+passwordHash');
};

module.exports = repository;
