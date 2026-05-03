const Grievance = require('../models/Grievance');
const { createRepository } = require('./base.repository');

const repository = createRepository(Grievance);

repository.findByGrievanceNumber = function findByGrievanceNumber(grievanceNumber) {
  return Grievance.findOne({ grievanceNumber, isDeleted: false });
};

repository.listByUserScope = async function listByUserScope(user, filters = {}, pagination = {}) {
  const { buildPagination } = require('./base.repository');
  const { skip, limit, page } = buildPagination(pagination);
  const role = user.primaryRole || user.role;
  const query = { isDeleted: false, ...filters };
  if (role === 'investor') query.organisationId = user.organisationId;
  if (['department_officer', 'department_supervisor'].includes(role)) query.departmentCode = user.departmentCode;
  if (role === 'auditor') query.status = filters.status || { $exists: true };
  const [items, total] = await Promise.all([
    Grievance.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Grievance.countDocuments(query)
  ]);
  return { items, total, page, limit };
};

repository.pushMessage = function pushMessage(grievanceId, message, context = {}) {
  return Grievance.findOneAndUpdate(
    { _id: grievanceId, isDeleted: false },
    {
      $push: { messages: message },
      $set: {
        updatedBy: context.userId || null,
        correlationId: context.correlationId || null
      }
    },
    { new: true }
  );
};

repository.pushStatusHistory = function pushStatusHistory(grievanceId, statusEntry, patch = {}, context = {}) {
  return Grievance.findOneAndUpdate(
    { _id: grievanceId, isDeleted: false },
    {
      $push: { statusHistory: statusEntry },
      $set: {
        ...patch,
        updatedBy: context.userId || null,
        correlationId: context.correlationId || null
      }
    },
    { new: true }
  );
};

module.exports = repository;
