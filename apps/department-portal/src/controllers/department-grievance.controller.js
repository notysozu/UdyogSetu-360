const grievanceService = require('../../../../services/case-service/src/services/grievance.service');

function ctx(req) {
  return {
    user: req.user,
    userId: req.user?.id || req.user?._id || null,
    role: req.user?.primaryRole || req.user?.role,
    departmentCode: req.user?.departmentCode || null,
    correlationId: req.correlationId || null,
    requestId: req.requestId || null,
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null
  };
}

async function list(req, res) {
  const data = await grievanceService.listGrievances(req.user, req.query || {}, {
    page: req.query.page || 1,
    limit: req.query.limit || 25
  }, ctx(req));
  res.render('department/grievances/grievance-inbox', {
    title: 'Department Grievances',
    grievances: data.items || [],
    pagination: { page: data.page, limit: data.limit, total: data.total }
  });
}

async function detail(req, res) {
  const grievance = await grievanceService.getGrievanceDetail(req.user, req.params.grievanceId, ctx(req));
  res.render('department/grievances/grievance-detail', {
    title: grievance.subject || 'Grievance Detail',
    grievance
  });
}

async function acknowledge(req, res) {
  await grievanceService.acknowledgeGrievance(req.params.grievanceId, ctx(req));
  req.flash('success', 'Grievance acknowledged.');
  res.redirect(`/department/grievances/${req.params.grievanceId}`);
}

async function assign(req, res) {
  await grievanceService.assignGrievance(req.params.grievanceId, req.body || {}, ctx(req));
  req.flash('success', 'Grievance assigned.');
  res.redirect(`/department/grievances/${req.params.grievanceId}`);
}

async function internalComment(req, res) {
  await grievanceService.addInternalComment(req.params.grievanceId, {
    body: req.body.body,
    attachments: req.body.attachments || []
  }, ctx(req));
  req.flash('success', 'Internal comment added.');
  res.redirect(`/department/grievances/${req.params.grievanceId}`);
}

async function externalReply(req, res) {
  await grievanceService.addExternalReply(req.params.grievanceId, {
    body: req.body.body,
    attachments: req.body.attachments || []
  }, ctx(req));
  req.flash('success', 'External reply added.');
  res.redirect(`/department/grievances/${req.params.grievanceId}`);
}

async function resolve(req, res) {
  await grievanceService.resolveGrievance(req.params.grievanceId, {
    reason: req.body.reason,
    resolutionSummary: req.body.resolutionSummary,
    satisfactionRating: req.body.satisfactionRating
  }, ctx(req));
  req.flash('success', 'Grievance resolved.');
  res.redirect(`/department/grievances/${req.params.grievanceId}`);
}

async function close(req, res) {
  await grievanceService.closeGrievance(req.params.grievanceId, {
    reason: req.body.reason,
    closureReason: req.body.closureReason
  }, ctx(req));
  req.flash('success', 'Grievance closed.');
  res.redirect(`/department/grievances/${req.params.grievanceId}`);
}

async function escalate(req, res) {
  await grievanceService.escalateGrievance(req.params.grievanceId, {
    reason: req.body.reason,
    currentEscalationOwner: req.body.currentEscalationOwner
  }, ctx(req));
  req.flash('success', 'Grievance escalated.');
  res.redirect(`/department/grievances/${req.params.grievanceId}`);
}

module.exports = {
  list,
  detail,
  acknowledge,
  assign,
  internalComment,
  externalReply,
  resolve,
  close,
  escalate
};
