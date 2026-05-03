const Counter = require('../models/Counter');

async function getNextSequence(key, session = null) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session
    }
  );

  return counter.sequence;
}

module.exports = { getNextSequence };
