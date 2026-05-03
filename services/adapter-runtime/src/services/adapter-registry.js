const { AdapterConfigError } = require('../errors/adapter.errors');

const adapterClasses = new Map();
const adapterInstances = new Map();
const activeDepartments = new Map();

function extractMetadata(adapterClass) {
  return {
    adapterCode: adapterClass.adapterCode || adapterClass.prototype?.adapterCode,
    departmentCode: adapterClass.departmentCode || adapterClass.prototype?.departmentCode
  };
}

function registerAdapter(adapterClass) {
  const { adapterCode, departmentCode } = extractMetadata(adapterClass);
  if (!adapterCode || !departmentCode) {
    throw new AdapterConfigError('Adapter class must expose static adapterCode and departmentCode.');
  }
  adapterClasses.set(adapterCode, adapterClass);
  if (!activeDepartments.has(departmentCode)) {
    activeDepartments.set(departmentCode, adapterCode);
  }
  return adapterClass;
}

function registerAdapterInstance(instance) {
  adapterInstances.set(instance.adapterCode, instance);
  activeDepartments.set(instance.departmentCode, instance.adapterCode);
  return instance;
}

function unregisterAdapter(adapterCode) {
  const instance = adapterInstances.get(adapterCode);
  const adapterClass = adapterClasses.get(adapterCode);
  const departmentCode = instance?.departmentCode || adapterClass?.departmentCode;
  adapterInstances.delete(adapterCode);
  adapterClasses.delete(adapterCode);
  if (departmentCode && activeDepartments.get(departmentCode) === adapterCode) {
    activeDepartments.delete(departmentCode);
  }
}

function getAdapter(adapterCode) {
  return adapterInstances.get(adapterCode) || adapterClasses.get(adapterCode) || null;
}

function getAdapterByDepartment(departmentCode) {
  const adapterCode = activeDepartments.get(departmentCode);
  if (!adapterCode) {
    throw new AdapterConfigError(`No active adapter registered for department ${departmentCode}.`, {
      code: 'ADAPTER_NOT_REGISTERED'
    });
  }
  return getAdapter(adapterCode);
}

function listAdapters() {
  return Array.from(new Set([...adapterClasses.keys(), ...adapterInstances.keys()])).map((adapterCode) => {
    const adapter = adapterInstances.get(adapterCode);
    const adapterClass = adapterClasses.get(adapterCode);
    return {
      adapterCode,
      departmentCode: adapter?.departmentCode || adapterClass?.departmentCode || null,
      active: activeDepartments.get(adapter?.departmentCode || adapterClass?.departmentCode) === adapterCode
    };
  });
}

function listActiveAdapters() {
  return Array.from(activeDepartments.entries()).map(([departmentCode, adapterCode]) => ({
    departmentCode,
    adapterCode
  }));
}

function hasAdapter(departmentCode) {
  return activeDepartments.has(departmentCode);
}

function clearRegistry() {
  adapterClasses.clear();
  adapterInstances.clear();
  activeDepartments.clear();
}

module.exports = {
  registerAdapter,
  registerAdapterInstance,
  unregisterAdapter,
  getAdapter,
  getAdapterByDepartment,
  listAdapters,
  listActiveAdapters,
  hasAdapter,
  clearRegistry
};
