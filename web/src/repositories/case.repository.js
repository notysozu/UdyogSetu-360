const Case = require('../models/Case');

function resolveCaseLookup(caseId) {
  return {
    $or: [{ caseId }, { universalCaseId: caseId }]
  };
}

async function createDraft(data, session = null) {
  const [caseDoc] = await Case.create([data], session ? { session } : undefined);
  return caseDoc;
}

function updateDraft(caseId, patch, session = null) {
  return Case.findOneAndUpdate(resolveCaseLookup(caseId), { $set: patch }, { new: true, session });
}

function findById(caseId) {
  return Case.findOne(resolveCaseLookup(caseId));
}

function findByUniversalCaseId(universalCaseId) {
  return Case.findOne({ universalCaseId });
}

function findPotentialDuplicates(criteria = {}) {
  const query = {
    status: { $in: ['draft', 'submitted', 'under_scrutiny', 'query_raised', 'response_submitted', 'reopened'] },
    createdAt: { $gte: criteria.lookbackDate || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
  };

  const or = [];
  if (criteria.sourceSystem && criteria.sourceReferenceId) {
    or.push({ sourceSystem: criteria.sourceSystem, sourceReferenceId: criteria.sourceReferenceId });
  }
  if (criteria.gstin) or.push({ 'cafData.enterprise.gstin': criteria.gstin });
  if (criteria.pan) or.push({ 'cafData.enterprise.pan': criteria.pan });
  if (criteria.udyamNumber) or.push({ 'cafData.enterprise.udyamNumber': criteria.udyamNumber });
  if (criteria.projectName && criteria.projectDistrict) {
    or.push({
      'cafData.project.projectName': criteria.projectName,
      'cafData.project.projectDistrict': criteria.projectDistrict
    });
  }

  if (or.length) {
    query.$or = or;
  }

  if (criteria.createdBy) {
    query.createdBy = criteria.createdBy;
  }

  return Case.find(query).sort({ createdAt: -1 }).limit(25);
}

function markSubmitted(caseId, patch, session = null) {
  return Case.findOneAndUpdate(resolveCaseLookup(caseId), { $set: patch }, { new: true, session });
}

function appendAmendment(caseId, amendment, session = null) {
  return Case.findOneAndUpdate(
    resolveCaseLookup(caseId),
    {
      $push: { amendmentHistory: amendment },
      $set: { lastActivityAt: new Date() }
    },
    { new: true, session }
  );
}

module.exports = {
  createDraft,
  updateDraft,
  findById,
  findByUniversalCaseId,
  findPotentialDuplicates,
  markSubmitted,
  appendAmendment
};
