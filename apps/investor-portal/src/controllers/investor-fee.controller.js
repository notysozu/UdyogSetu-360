const caseService = require('../services/investor-case-view.service');

function buildFees(tasks = []) {
  return tasks
    .filter((item) => ['fee_demanded', 'fee_paid'].includes(item.status) || item.metadata?.feeAmount)
    .map((item) => ({
      _id: String(item._id),
      caseId: item.caseId,
      departmentCode: item.departmentCode,
      amount: item.metadata?.feeAmount || 25000,
      dueAt: item.dueAt,
      status: item.status === 'fee_paid' ? 'paid' : 'pending',
      receiptNumber: item.metadata?.receiptNumber || null
    }));
}

async function listFees(req, res) {
  const cases = await caseService.getInvestorCases(req.user, {}, {});
  const fees = buildFees((await Promise.all(cases.map((item) => caseService.getTaskWiseProgress(req.user, item.caseId)))).flat());
  res.render('fees/fee-list', {
    title: 'Fees',
    fees
  });
}

async function listCaseFees(req, res) {
  const fees = buildFees(await caseService.getTaskWiseProgress(req.user, req.params.caseId));
  res.render('fees/fee-list', {
    title: 'Case Fees',
    fees,
    caseId: req.params.caseId
  });
}

async function showFee(req, res) {
  const cases = await caseService.getInvestorCases(req.user, {}, {});
  const fees = buildFees((await Promise.all(cases.map((item) => caseService.getTaskWiseProgress(req.user, item.caseId)))).flat());
  const fee = fees.find((item) => item._id === req.params.feeId);
  if (!fee) {
    const error = new Error('Fee record not found.');
    error.status = 404;
    throw error;
  }
  res.render('fees/fee-detail', {
    title: 'Fee Detail',
    fee
  });
}

function payFeePlaceholder(req, res) {
  req.flash('success', 'Online payment integration placeholder. No transaction was processed.');
  res.redirect(`/fees/${req.params.feeId}`);
}

module.exports = {
  listFees,
  listCaseFees,
  showFee,
  payFeePlaceholder
};
