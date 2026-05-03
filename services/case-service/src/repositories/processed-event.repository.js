const ProcessedEvent = require('../models/ProcessedEvent');

module.exports = {
  findOne(filter = {}) {
    return ProcessedEvent.findOne(filter);
  },
  findOneAndUpdate(filter = {}, patch = {}, options = {}) {
    return ProcessedEvent.findOneAndUpdate(filter, patch, {
      new: true,
      upsert: Boolean(options.upsert),
      setDefaultsOnInsert: true
    });
  }
};
