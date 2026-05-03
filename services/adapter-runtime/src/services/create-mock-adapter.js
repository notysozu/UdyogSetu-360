const { createAdapterForDepartment } = require('./adapter-factory');

function createMockAdapter(name) {
  let adapterPromise = null;
  function getAdapter() {
    if (!adapterPromise) {
      adapterPromise = createAdapterForDepartment(name);
    }
    return adapterPromise;
  }

  return {
    async submitApplication(payload, context) {
      return (await getAdapter()).submitApplication(payload, context);
    },
    async getStatus(referenceId, context) {
      return (await getAdapter()).getStatus(referenceId, context);
    },
    async pushDocument(payload, context) {
      return (await getAdapter()).pushDocument(payload, context);
    },
    async receiveCallback(payload, context) {
      return (await getAdapter()).receiveCallback(payload, context);
    },
    async healthCheck(context) {
      return (await getAdapter()).healthCheck(context);
    }
  };
}

module.exports = { createMockAdapter };
