const nodalService = require('../services/nodal-coordination.service');

function ctx(req) {
  return {
    user: req.user,
    role: req.user?.primaryRole || req.user?.role,
    departmentCode: req.user?.departmentCode || null,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    overrideReason: req.body.overrideReason || null
  };
}

async function listCases(req, res) {
  const cases = await nodalService.getCrossDepartmentCases(req.user, req.query || {}, ctx(req));
  res.render('nodal/case-list', { title: 'Cross-department Cases', cases });
}

async function showCaseDetail(req, res) {
  const data = await nodalService.getCaseCoordinationView(req.params.caseId, ctx(req));
  res.render('nodal/case-detail', { title: data?.caseDoc?.universalCaseId || 'Case Detail', data });
}

async function showSlaDashboard(req, res) {
  const cases = await nodalService.getCrossDepartmentCases(req.user, req.query || {}, ctx(req));
  res.render('nodal/sla-dashboard', { title: 'Nodal SLA Dashboard', cases });
}

async function showEscalations(req, res) {
  const cases = await nodalService.getCrossDepartmentCases(req.user, req.query || {}, ctx(req));
  res.render('nodal/escalations', { title: 'Escalations', cases: cases.filter((item) => item.overdueCount > 0) });
}

async function escalateCase(req, res) {
  await nodalService.escalateCase(req.params.caseId, req.body || {}, ctx(req));
  req.flash('success', 'Case escalated.');
  res.redirect(`/nodal/cases/${req.params.caseId}`);
}

async function addCaseComment(req, res) {
  await nodalService.addNodalComment(req.params.caseId, req.body || {}, ctx(req));
  req.flash('success', 'Coordination note added.');
  res.redirect(`/nodal/cases/${req.params.caseId}`);
}

async function requestDepartmentAction(req, res) {
  await nodalService.requestDepartmentAction(req.params.taskId, req.body || {}, ctx(req));
  req.flash('success', 'Department action requested.');
  res.redirect(req.get('referer') || '/nodal');
}

module.exports = {
  listCases,
  showCaseDetail,
  showSlaDashboard,
  showEscalations,
  escalateCase,
  addCaseComment,
  requestDepartmentAction
};
