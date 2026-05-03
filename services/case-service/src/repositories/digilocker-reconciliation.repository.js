const DigiLockerReconciliationLog = require('../models/DigiLockerReconciliationLog');

function create(data) {
  return DigiLockerReconciliationLog.create(data);
}

module.exports = { create };
