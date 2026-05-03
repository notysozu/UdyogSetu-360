const caseService = require('../services/investor-case-view.service');

function ctx(req) {
  return {
    user: req.user,
    correlationId: req.correlationId
  };
}

async function listQueries(req, res) {
  const cases = await caseService.getInvestorCases(req.user, {}, {}, ctx(req));
  const queries = (await Promise.all(cases.map((item) => caseService.getRaisedQueries(req.user, item.caseId, ctx(req))))).flat();
  res.render('queries/query-list', {
    title: 'Raised Queries',
    queries
  });
}

async function listCaseQueries(req, res) {
  const queries = await caseService.getRaisedQueries(req.user, req.params.caseId, ctx(req));
  res.render('queries/query-list', {
    title: 'Case Queries',
    queries,
    caseId: req.params.caseId
  });
}

async function showQuery(req, res) {
  const cases = await caseService.getInvestorCases(req.user, {}, {}, ctx(req));
  const allQueries = (await Promise.all(cases.map((item) => caseService.getRaisedQueries(req.user, item.caseId, ctx(req))))).flat();
  const query = allQueries.find((item) => String(item._id) === req.params.queryId);
  if (!query) {
    const error = new Error('Query not found.');
    error.status = 404;
    throw error;
  }
  res.render('queries/query-detail', {
    title: query.title,
    query
  });
}

async function respondToQuery(req, res) {
  await caseService.submitQueryResponse(req.user, req.params.queryId, {
    caseId: req.body.caseId,
    message: req.body.message
  }, ctx(req));
  req.flash('success', 'Query response submitted.');
  res.redirect(req.body.caseId ? `/cases/${req.body.caseId}/responses` : '/queries');
}

module.exports = {
  listQueries,
  listCaseQueries,
  showQuery,
  respondToQuery
};
