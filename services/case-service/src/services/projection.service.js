const projectionRepository = require('../repositories/projection.repository');

async function upsertCaseProjection(caseDoc, tasks = [], context = {}) {
  return projectionRepository.upsertCaseSummary(
    { universalCaseId: caseDoc.universalCaseId },
    {
      universalCaseId: caseDoc.universalCaseId,
      caseId: caseDoc._id,
      organisationName: context.organisationName || '',
      applicantName: context.applicantName || '',
      status: caseDoc.status,
      currentStage: caseDoc.currentStage,
      departments: caseDoc.requiredDepartments.map((item) => item.departmentCode),
      pendingTasks: tasks.filter((task) => !['approved', 'rejected', 'closed'].includes(task.status)).length,
      completedTasks: tasks.filter((task) => ['approved', 'rejected', 'closed'].includes(task.status)).length,
      overdueTasks: tasks.filter((task) => task.dueAt && task.dueAt < new Date()).length,
      lastActivityAt: caseDoc.lastActivityAt || caseDoc.updatedAt,
      dueAt: caseDoc.slaSummary?.dueAt,
      riskScore: caseDoc.aiInsights?.delayRiskScore || 0
    },
    { session: context.session }
  );
}

module.exports = { upsertCaseProjection };
