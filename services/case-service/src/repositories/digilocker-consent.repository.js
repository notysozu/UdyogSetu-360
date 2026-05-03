const DigiLockerConsent = require('../models/DigiLockerConsent');

function create(data) {
  return DigiLockerConsent.create(data);
}

function findByConsentId(consentId) {
  return DigiLockerConsent.findOne({ consentId, isDeleted: false });
}

function findByState(state) {
  return DigiLockerConsent.findOne({ state, isDeleted: false });
}

function updateByConsentId(consentId, patch) {
  return DigiLockerConsent.findOneAndUpdate({ consentId, isDeleted: false }, { $set: patch }, { new: true });
}

module.exports = {
  create,
  findByConsentId,
  findByState,
  updateByConsentId
};
