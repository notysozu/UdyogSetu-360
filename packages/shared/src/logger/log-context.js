const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function withLogContext(context, fn) {
  return storage.run({ ...(storage.getStore() || {}), ...(context || {}) }, fn);
}

function getLogContext() {
  return storage.getStore() || {};
}

module.exports = {
  withLogContext,
  getLogContext
};
