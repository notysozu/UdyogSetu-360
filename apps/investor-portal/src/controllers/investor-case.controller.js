const caseService = require('../services/investor-case-view.service');
const documentService = require('../services/investor-document-view.service');
const grievanceService = require('../services/investor-grievance-view.service');

function ctx(req) {
  return {
    user: req.user,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function listCases(req, res) {
  const cases = await caseService.getInvestorCases(req.user, req.query || {}, {}, ctx(req));
  res.render('cases/case-list', {
    title: 'My Cases',
    cases,
    filters: req.query || {}
  });
}

function showNewCaseRedirectOrForm(req, res) {
  res.render('cases/new-case', {
    title: 'Start New Application'
  });
}

async function showCaseDetail(req, res) {
  const caseDoc = await caseService.getInvestorCaseDetail(req.user, req.params.caseId, ctx(req));
  const [timeline, tasks, documents, queries, responses, grievances] = await Promise.all([
    caseService.getInvestorCaseTimeline(req.user, req.params.caseId, ctx(req)),
    caseService.getTaskWiseProgress(req.user, req.params.caseId, ctx(req)),
    documentService.getCaseDocuments(req.user, caseDoc?.caseId || req.params.caseId, ctx(req)),
    caseService.getRaisedQueries(req.user, req.params.caseId, ctx(req)),
    caseService.getSubmittedResponses(req.user, req.params.caseId, ctx(req)),
    grievanceService.getInvestorGrievances(req.user, {}, ctx(req))
  ]);
  if (!caseDoc) {
    const error = new Error('Case not found.');
    error.status = 404;
    throw error;
  }
  res.render('cases/case-detail', {
    title: caseDoc.universalCaseId || caseDoc.caseId,
    caseDoc,
    timeline,
    tasks,
    documents,
    queries,
    responses,
    grievances: grievances.filter((item) => item.caseId === caseDoc.caseId)
  });
}

async function showCaseTimeline(req, res) {
  const caseDoc = await caseService.getInvestorCaseDetail(req.user, req.params.caseId, ctx(req));
  const timeline = await caseService.getInvestorCaseTimeline(req.user, req.params.caseId, ctx(req));
  res.render('cases/case-timeline', {
    title: `Timeline ${caseDoc?.caseId || ''}`,
    caseDoc,
    timeline
  });
}

async function showCaseTasks(req, res) {
  const caseDoc = await caseService.getInvestorCaseDetail(req.user, req.params.caseId, ctx(req));
  const tasks = await caseService.getTaskWiseProgress(req.user, req.params.caseId, ctx(req));
  res.render('cases/case-tasks', {
    title: `Tasks ${caseDoc?.caseId || ''}`,
    caseDoc,
    tasks
  });
}

async function printCase(req, res) {
  const caseDoc = await caseService.getInvestorCaseDetail(req.user, req.params.caseId, ctx(req));
  const timeline = await caseService.getInvestorCaseTimeline(req.user, req.params.caseId, ctx(req));
  res.render('cases/case-print', {
    title: `Print ${caseDoc?.caseId || ''}`,
    caseDoc,
    timeline,
    printMode: true
  });
}

async function showAcknowledgement(req, res) {
  const caseDoc = await caseService.getInvestorCaseDetail(req.user, req.params.caseId, ctx(req));
  res.render('cases/acknowledgement', {
    title: `Acknowledgement ${caseDoc?.caseId || ''}`,
    caseDoc
  });
}

async function showResponses(req, res) {
  const caseDoc = await caseService.getInvestorCaseDetail(req.user, req.params.caseId, ctx(req));
  const [queries, responses] = await Promise.all([
    caseService.getRaisedQueries(req.user, req.params.caseId, ctx(req)),
    caseService.getSubmittedResponses(req.user, req.params.caseId, ctx(req))
  ]);
  res.render('cases/case-responses', {
    title: `Responses ${caseDoc?.caseId || ''}`,
    caseDoc,
    queries,
    responses
  });
}

async function submitResponse(req, res) {
  await caseService.submitQueryResponse(req.user, req.body.queryId || req.params.caseId, {
    caseId: req.params.caseId,
    message: req.body.message,
    attachments: []
  }, ctx(req));
  req.flash('success', 'Response submitted successfully.');
  res.redirect(`/cases/${req.params.caseId}/responses`);
}

module.exports = {
  listCases,
  showNewCaseRedirectOrForm,
  showCaseDetail,
  showCaseTimeline,
  showCaseTasks,
  printCase,
  showAcknowledgement,
  showResponses,
  submitResponse
};
