function createReplaySafeHandler(handler) {
  const processed = new Set();

  return async function replaySafeHandler(event) {
    if (processed.has(event.id)) {
      return { skipped: true, reason: 'already_processed' };
    }
    processed.add(event.id);
    return handler(event);
  };
}

module.exports = { createReplaySafeHandler };
