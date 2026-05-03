const mongoose = require('mongoose');
const IntegrationEndpoint = require('../../../case-service/src/models/IntegrationEndpoint');

function findActiveByDepartment(departmentCode, environment = process.env.NODE_ENV || 'development') {
  if (mongoose.connection.readyState !== 1) {
    return Promise.resolve(null);
  }
  return IntegrationEndpoint.findOne({
    departmentCode,
    isActive: true,
    isDeleted: false,
    $or: [{ environment }, { environment: 'development' }]
  }).sort({ updatedAt: -1 });
}

function listActive(environment = process.env.NODE_ENV || 'development') {
  if (mongoose.connection.readyState !== 1) {
    return Promise.resolve([]);
  }
  return IntegrationEndpoint.find({
    isActive: true,
    isDeleted: false,
    $or: [{ environment }, { environment: 'development' }]
  }).sort({ departmentCode: 1, updatedAt: -1 });
}

function upsertConfig(config) {
  return IntegrationEndpoint.findOneAndUpdate(
    { departmentCode: config.departmentCode, adapterCode: config.adapterCode, isDeleted: false },
    {
      $set: config
    },
    { new: true, upsert: true }
  );
}

module.exports = {
  findActiveByDepartment,
  listActive,
  upsertConfig
};
