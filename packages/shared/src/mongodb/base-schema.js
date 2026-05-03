const mongoose = require('mongoose');
const { softDeletePlugin } = require('./plugins/softDeletePlugin');
const { auditFieldsPlugin } = require('./plugins/auditFieldsPlugin');

function createOperationalSchema(definition, options = {}) {
  const schema = new mongoose.Schema(definition, {
    timestamps: true,
    minimize: false,
    ...options
  });

  schema.plugin(auditFieldsPlugin);
  schema.plugin(softDeletePlugin);

  return schema;
}

module.exports = { createOperationalSchema };
