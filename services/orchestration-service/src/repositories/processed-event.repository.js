const ProcessedEvent = require('../models/ProcessedEvent');

module.exports = {
  findOne(filter = {}) {
    return ProcessedEvent.findOne(filter);
  },
  create(input, options = {}) {
    return ProcessedEvent.create([input], options.session ? { session: options.session } : {}).then(
      (rows) => rows[0]
    );
  },
  updateOne(filter, patch, options = {}) {
    return ProcessedEvent.findOneAndUpdate(filter, patch, {
      new: true,
      upsert: false,
      session: options.session
    });
  }
};
