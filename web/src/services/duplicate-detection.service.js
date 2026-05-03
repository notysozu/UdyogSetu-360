const caseRepository = require('../repositories/case.repository');
const { env } = require('../config/env');

function normaliseCaseValue(value) {
  return String(value || '').trim().toLowerCase();
}

function compareAddress(a, b) {
  const first = normaliseCaseValue(a).replaceAll(/\s+/g, ' ');
  const second = normaliseCaseValue(b).replaceAll(/\s+/g, ' ');
  return first && second && (first === second || first.includes(second) || second.includes(first));
}

function buildDuplicateDetectionService(deps = {}) {
  const repository = deps.caseRepository || caseRepository;

  async function checkDuplicate(input, context = {}) {
    const lookbackDate = new Date(
      Date.now() - (env.CAF_DUPLICATE_LOOKBACK_DAYS || 180) * 24 * 60 * 60 * 1000
    );
    const candidates = await repository.findPotentialDuplicates({
      createdBy: context.user?._id || context.user?.id || null,
      gstin: input.enterprise?.gstin,
      pan: input.enterprise?.pan,
      udyamNumber: input.enterprise?.udyamNumber,
      projectName: input.project?.projectName,
      projectDistrict: input.project?.projectDistrict,
      sourceSystem: input.sourceSystem,
      sourceReferenceId: input.sourceReferenceId,
      lookbackDate
    });

    let confidence = 0;
    let blocking = false;
    const reasons = [];

    const matchedCases = candidates.map((candidate) => {
      const candidateProject = candidate.cafData?.project || {};
      const candidateEnterprise = candidate.cafData?.enterprise || {};
      let score = 0;
      const localReasons = [];

      if (
        input.sourceSystem &&
        input.sourceReferenceId &&
        candidate.sourceSystem === input.sourceSystem &&
        candidate.sourceReferenceId === input.sourceReferenceId
      ) {
        score = 100;
        blocking = true;
        localReasons.push('Matching source system reference already exists.');
      }

      if (
        normaliseCaseValue(candidateProject.projectName) === normaliseCaseValue(input.project?.projectName) &&
        normaliseCaseValue(candidateProject.projectDistrict) === normaliseCaseValue(input.project?.projectDistrict)
      ) {
        score = Math.max(score, 75);
        localReasons.push('Project name and district match an existing case.');
      }

      if (
        input.enterprise?.gstin &&
        normaliseCaseValue(candidateEnterprise.gstin) === normaliseCaseValue(input.enterprise.gstin) &&
        compareAddress(candidateProject.projectAddress, input.project?.projectAddress)
      ) {
        score = Math.max(score, 80);
        localReasons.push('GSTIN and project address closely match an existing case.');
      }

      if (
        String(candidate.createdBy || '') === String(context.user?._id || context.user?.id || '') &&
        candidate.status === 'draft' &&
        normaliseCaseValue(candidateProject.projectName) === normaliseCaseValue(input.project?.projectName)
      ) {
        score = Math.max(score, 70);
        localReasons.push('Existing draft by the same investor looks similar.');
      }

      confidence = Math.max(confidence, score);
      reasons.push(...localReasons);

      return {
        caseId: candidate.caseId,
        universalCaseId: candidate.universalCaseId || null,
        confidence: score,
        reason: localReasons.join(' ')
      };
    });

    return {
      isDuplicate: matchedCases.some((item) => item.confidence > 0),
      confidence,
      matchedCases: matchedCases.filter((item) => item.confidence > 0),
      reasons: [...new Set(reasons)],
      blocking
    };
  }

  async function checkBlockingDuplicate(input, context = {}) {
    const result = await checkDuplicate(input, context);
    return result.blocking ? result : null;
  }

  return { checkDuplicate, checkBlockingDuplicate };
}

module.exports = { ...buildDuplicateDetectionService(), buildDuplicateDetectionService };
