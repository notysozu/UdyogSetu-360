const dashboardService = require('../services/department-dashboard.service');

async function showOfficerDashboard(req, res) {
  const dashboard = await dashboardService.getOfficerDashboard(req.user, {});
  res.render('officer/dashboard', { title: 'Department Dashboard', dashboard });
}

async function showSupervisorDashboard(req, res) {
  const dashboard = await dashboardService.getSupervisorDashboard(req.user, {});
  res.render('supervisor/dashboard', { title: 'Supervisor Dashboard', dashboard });
}

async function showNodalDashboard(req, res) {
  const dashboard = await dashboardService.getNodalDashboard(req.user, {});
  res.render('nodal/dashboard', { title: 'Nodal Dashboard', dashboard });
}

async function showAuditorDashboard(req, res) {
  const dashboard = await dashboardService.getAuditorDashboard(req.user, {});
  res.render('auditor/dashboard', { title: 'Audit Dashboard', dashboard });
}

module.exports = {
  showOfficerDashboard,
  showSupervisorDashboard,
  showNodalDashboard,
  showAuditorDashboard
};
