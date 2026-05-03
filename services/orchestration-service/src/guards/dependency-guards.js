const { AppError } = require('../../../../packages/shared/src');
const { WORKFLOW_DEPENDENCIES } = require('../workflows/workflow-dependencies');

function hasDocumentWithType(caseDoc, type) {
  const documents = caseDoc?.metadata?.documents || [];
  return documents.some((document) => document.documentType === type);
}

function hasFactoryDetails(caseDoc) {
  return Boolean(caseDoc?.metadata?.factoryDetailsProvided || caseDoc?.metadata?.cafData?.industrialSafety);
}

function hasEmployeeData(caseDoc) {
  const labour = caseDoc?.metadata?.cafData?.labour || {};
  return Number.isFinite(Number(labour.employeeCount)) && Number(labour.employeeCount) >= 0;
}

function isCaseFinalForClosure(caseDoc) {
  return ['certificate_issued', 'rejected'].includes(caseDoc?.status);
}

function getBlockingDependencies(caseDoc, taskDoc, nextStatus) {
  return WORKFLOW_DEPENDENCIES.filter((rule) => {
    const departmentMatches =
      !rule.sourceDepartment ||
      rule.sourceDepartment === '*' ||
      rule.sourceDepartment === taskDoc?.departmentCode;
    const transitionMatches =
      !rule.blocksTransition || rule.blocksTransition.includes(nextStatus);
    if (!departmentMatches || !transitionMatches) {
      return false;
    }

    switch (rule.key) {
      case 'fire_requires_layout_documents':
        return !hasDocumentWithType(caseDoc, 'layout_plan');
      case 'industrial_safety_requires_factory_details':
        return !hasFactoryDetails(caseDoc);
      case 'labour_requires_employee_data':
        return !hasEmployeeData(caseDoc);
      case 'certificate_requires_approval':
        return taskDoc?.status !== 'approved';
      case 'closure_requires_finality':
        return !isCaseFinalForClosure(caseDoc);
      case 'fee_paid_requires_fee_demand':
        return taskDoc?.status !== 'fee_demanded';
      case 'inspection_completed_requires_schedule':
        return taskDoc?.status !== 'inspection_scheduled';
      default:
        return false;
    }
  });
}

function assertDependenciesSatisfied(caseDoc, taskDoc, nextStatus) {
  const blockingDependencies = getBlockingDependencies(caseDoc, taskDoc, nextStatus).filter(
    (dependency) => dependency.blocksTransition
  );

  if (blockingDependencies.length) {
    throw new AppError(
      blockingDependencies.map((dependency) => dependency.message).join(' '),
      409,
      blockingDependencies
    );
  }

  return [];
}

module.exports = {
  getBlockingDependencies,
  assertDependenciesSatisfied
};
