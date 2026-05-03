const slaService = require('../../../../services/notification-service/src/services/sla-monitoring.service');

function ctx(req) {
  return {
    user: req.user,
    userId: req.user?.id || req.user?._id || null,
    role: req.user?.primaryRole || req.user?.role,
    departmentCode: req.user?.departmentCode || null,
    correlationId: req.correlationId || null,
    requestId: req.requestId || null
  };
}

async function showDepartmentSla(req, res) {
  const [approval, grievance] = await Promise.all([
    slaService.getApprovalAgeingDashboard(req.user, req.query || {}, ctx(req)),
    slaService.getGrievanceAgeingDashboard(req.user, req.query || {}, ctx(req))
  ]);
  res.render('sla/sla-dashboard', { title: 'Department SLA', approval, grievance });
}

async function showSupervisorSla(req, res) {
  return showDepartmentSla(req, res);
}

async function showNodalSla(req, res) {
  return showDepartmentSla(req, res);
}

async function showAdminSla(req, res) {
  return showDepartmentSla(req, res);
}

async function showDepartmentGrievanceAgeing(req, res) {
  const grievance = await slaService.getGrievanceAgeingDashboard(req.user, req.query || {}, ctx(req));
  res.render('department/grievances/ageing-dashboard', { title: 'Grievance Ageing', grievance });
}

async function showAdminGrievanceAgeing(req, res) {
  return showDepartmentGrievanceAgeing(req, res);
}

module.exports = {
  showDepartmentSla,
  showSupervisorSla,
  showNodalSla,
  showAdminSla,
  showDepartmentGrievanceAgeing,
  showAdminGrievanceAgeing
};
