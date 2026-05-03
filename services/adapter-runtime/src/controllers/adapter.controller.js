const adapterRuntimeService = require('../services/adapter-runtime.service');
const adapterRegistry = require('../services/adapter-registry');
const { validateDepartmentCode, validateSubmitPayload, validateDocumentPayload, validateCallbackPayload } = require('../validators/adapter.validators');

function getContext(req) {
  return {
    actor: req.user || req.serviceUser || {
      id: 'adapter-route',
      primaryRole: 'system',
      permissions: ['system.internal_call']
    },
    correlationId: req.correlationId || req.get('x-correlation-id') || null
  };
}

async function listAdapters(_req, res) {
  return res.json({
    ok: true,
    data: {
      registered: adapterRegistry.listAdapters(),
      active: adapterRegistry.listActiveAdapters()
    }
  });
}

async function getAllHealth(req, res) {
  const data = await adapterRuntimeService.listAdapterHealth(getContext(req));
  return res.json({ ok: true, data });
}

async function getHealth(req, res) {
  validateDepartmentCode(req.params.departmentCode);
  const data = await adapterRuntimeService.getAdapterHealth(req.params.departmentCode, getContext(req));
  return res.json({ ok: true, data });
}

async function submit(req, res) {
  validateDepartmentCode(req.params.departmentCode);
  const canonicalPayload = validateSubmitPayload(req.body || {});
  const data = await adapterRuntimeService.submitToDepartment(req.params.departmentCode, canonicalPayload, getContext(req));
  return res.status(201).json({ ok: true, data });
}

async function getStatus(req, res) {
  validateDepartmentCode(req.params.departmentCode);
  const externalReferenceId = req.params.externalReferenceId;
  const data = await adapterRuntimeService.checkDepartmentStatus(req.params.departmentCode, externalReferenceId, getContext(req));
  return res.json({ ok: true, data });
}

async function pushDocument(req, res) {
  validateDepartmentCode(req.params.departmentCode);
  const payload = validateDocumentPayload(req.body || {});
  const data = await adapterRuntimeService.pushDocumentToDepartment(req.params.departmentCode, payload, getContext(req));
  return res.status(201).json({ ok: true, data });
}

async function receiveCallback(req, res) {
  validateDepartmentCode(req.params.departmentCode);
  const payload = validateCallbackPayload(req.body || {});
  const data = await adapterRuntimeService.processDepartmentCallback(
    req.params.departmentCode,
    payload,
    req.headers,
    getContext(req)
  );
  return res.json({ ok: true, data });
}

async function reload(req, res) {
  validateDepartmentCode(req.params.departmentCode);
  const data = await adapterRuntimeService.reloadAdapter(req.params.departmentCode, getContext(req));
  return res.json({ ok: true, data });
}

async function testMockAdapter(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ ok: false, error: { message: 'Mock adapter testing disabled in production.' } });
  }
  validateDepartmentCode(req.params.departmentCode);
  const payload = validateSubmitPayload(req.body || {});
  const data = await adapterRuntimeService.submitToDepartment(req.params.departmentCode, payload, getContext(req));
  return res.status(201).json({ ok: true, data });
}

module.exports = {
  listAdapters,
  getAllHealth,
  getHealth,
  submit,
  getStatus,
  pushDocument,
  receiveCallback,
  reload,
  testMockAdapter
};
