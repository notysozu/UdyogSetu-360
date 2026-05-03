function ok(data, meta = {}) {
  return { ok: true, data, meta };
}

function fail(message, details = null) {
  return {
    ok: false,
    error: {
      message,
      details
    }
  };
}

module.exports = { ok, fail };
