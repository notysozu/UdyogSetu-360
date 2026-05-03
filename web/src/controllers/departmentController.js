const Case = require('../models/Case');
const Department = require('../models/Department');
const { submitDepartmentAction } = require('../services/caseService');

async function queue(req, res) {
  const currentUser = req.user || req.session.user;
  let departmentId = currentUser.department;
  const selectedCode = req.query.department;

  if (!departmentId && selectedCode) {
    const department = await Department.findOne({ code: selectedCode });
    departmentId = department?._id;
  }

  const query = departmentId
    ? { 'approvals.department': departmentId }
    : {};

  const cases = await Case.find(query).sort({ updatedAt: -1 }).limit(50).populate('approvals.department');
  const departments = await Department.find({ active: true }).sort({ name: 1 });
  return res.render('pages/department-queue', { title: 'Department Queue', cases, departments, departmentId });
}

async function updateTask(req, res) {
  const currentUser = req.user || req.session.user;
  const { departmentId, status, note, certificateRef } = req.body;
  await submitDepartmentAction({
    caseId: req.params.caseId,
    departmentId,
    status,
    note,
    certificateRef,
    user: currentUser,
    correlationId: req.correlationId
  });
  req.flash('success', `Case ${req.params.caseId} updated.`);
  return res.redirect('/department/queue');
}

module.exports = { queue, updateTask };
