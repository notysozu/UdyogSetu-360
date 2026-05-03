const SlaTimer = require('../../../case-service/src/models/SlaTimer');

module.exports = {
  create(input, options = {}) {
    return SlaTimer.create([input], options.session ? { session: options.session } : {}).then(
      (rows) => rows[0]
    );
  },
  findOne(filter = {}) {
    return SlaTimer.findOne(filter);
  },
  findMany(filter = {}) {
    return SlaTimer.find(filter);
  },
  updateById(id, patch, options = {}) {
    return SlaTimer.findByIdAndUpdate(id, patch, {
      new: true,
      session: options.session
    });
  },
  save(timerDoc, options = {}) {
    return timerDoc.save(options.session ? { session: options.session } : undefined);
  },
  findWarnings(now = new Date()) {
    return SlaTimer.find({
      status: 'running',
      warningAt: { $lte: now },
      dueAt: { $gt: now },
      isDeleted: false
    });
  },
  findBreached(now = new Date()) {
    return SlaTimer.find({
      status: { $in: ['running', 'warning'] },
      dueAt: { $lte: now },
      isDeleted: false
    });
  }
};
