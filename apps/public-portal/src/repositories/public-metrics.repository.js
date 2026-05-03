const mongoose = require('mongoose');
const Case = require('../../../../services/case-service/src/models/Case');
const ApprovalTask = require('../../../../services/case-service/src/models/ApprovalTask');
const Certificate = require('../../../../services/case-service/src/models/Certificate');
const Grievance = require('../../../../services/case-service/src/models/Grievance');
const PublicMetricsProjection = require('../../../../services/case-service/src/models/PublicMetricsProjection');
const DepartmentWorkloadProjection = require('../../../../services/case-service/src/models/DepartmentWorkloadProjection');

function buildDateMatch(filters = {}, fieldName) {
  const range = {};
  if (filters.fromDate) range.$gte = filters.fromDate;
  if (filters.toDate) range.$lte = filters.toDate;
  return Object.keys(range).length ? { [fieldName]: range } : {};
}

async function listPublicProjectionDocs(filters = {}) {
  if (mongoose.connection.readyState !== 1) return [];
  return PublicMetricsProjection.find({
    ...buildDateMatch(filters, 'date'),
    ...(filters.departmentCode ? { 'departmentBreakdown.departmentCode': filters.departmentCode } : {})
  }).sort({ date: 1 }).lean();
}

async function listDepartmentProjectionDocs(filters = {}) {
  if (mongoose.connection.readyState !== 1) return [];
  return DepartmentWorkloadProjection.find({
    ...buildDateMatch(filters, 'date'),
    ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {})
  }).sort({ date: -1 }).lean();
}

async function getOverviewMetrics(filters = {}) {
  const docs = await listPublicProjectionDocs(filters);
  if (docs.length) return docs;
  if (mongoose.connection.readyState !== 1) return [];
  const [caseStats, certStats, grievanceStats] = await Promise.all([
    Case.aggregate([
      { $match: { isDeleted: false, status: { $ne: 'draft' }, ...buildDateMatch(filters, 'submittedAt') } },
      {
        $group: {
          _id: null,
          totalApplicationsReceived: { $sum: 1 },
          activeApplications: {
            $sum: { $cond: [{ $in: ['$status', ['submitted', 'under_scrutiny', 'query_raised', 'inspection_scheduled', 'fee_demanded', 'fee_paid']] }, 1, 0] }
          },
          approvedApplications: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejectedApplications: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]),
    Certificate.aggregate([
      { $match: { isDeleted: false, ...buildDateMatch(filters, 'issuedAt') } },
      { $group: { _id: null, certificatesIssued: { $sum: 1 } } }
    ]),
    Grievance.aggregate([
      { $match: { isDeleted: false, ...buildDateMatch(filters, 'createdAt') } },
      {
        $group: {
          _id: null,
          grievancesOpened: { $sum: 1 },
          grievancesResolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } }
        }
      }
    ])
  ]);
  return [{
    date: new Date(),
    totalApplicationsReceived: caseStats[0]?.totalApplicationsReceived || 0,
    activeApplications: caseStats[0]?.activeApplications || 0,
    approvedApplications: caseStats[0]?.approvedApplications || 0,
    rejectedApplications: caseStats[0]?.rejectedApplications || 0,
    certificatesIssued: certStats[0]?.certificatesIssued || 0,
    grievancesOpened: grievanceStats[0]?.grievancesOpened || 0,
    grievancesResolved: grievanceStats[0]?.grievancesResolved || 0
  }];
}

async function getApplicationStageCounts(filters = {}) {
  const docs = await listPublicProjectionDocs(filters);
  if (docs.length && docs.some((doc) => doc.stageCounts && Object.keys(doc.stageCounts).length)) return docs;
  if (mongoose.connection.readyState !== 1) return [];
  return Case.aggregate([
    { $match: { isDeleted: false, status: { $ne: 'draft' }, ...buildDateMatch(filters, 'submittedAt') } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { _id: 0, stage: '$_id', count: 1 } },
    { $sort: { stage: 1 } }
  ]);
}

async function getDepartmentTurnaroundMetrics(filters = {}) {
  const docs = await listDepartmentProjectionDocs(filters);
  if (docs.length) return docs;
  if (mongoose.connection.readyState !== 1) return [];
  return ApprovalTask.aggregate([
    { $match: { isDeleted: false, status: { $ne: 'pending' }, ...buildDateMatch(filters, 'createdAt'), ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {}) } },
    {
      $group: {
        _id: '$departmentCode',
        applicationsHandled: { $sum: 1 },
        approvedCount: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejectedCount: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        activePendingCount: { $sum: { $cond: [{ $in: ['$status', ['assigned', 'under_review', 'query_raised', 'inspection_scheduled', 'fee_demanded']] }, 1, 0] } },
        averageTurnaroundHours: {
          $avg: {
            $cond: [
              { $and: ['$createdAt', '$completedAt'] },
              { $divide: [{ $subtract: ['$completedAt', '$createdAt'] }, 3600000] },
              null
            ]
          }
        }
      }
    }
  ]);
}

async function getApprovalRateMetrics(filters = {}) {
  return {
    stages: await getApplicationStageCounts(filters),
    departments: await getDepartmentTurnaroundMetrics(filters),
    monthly: await listPublicProjectionDocs(filters)
  };
}

async function getCertificateIssuanceMetrics(filters = {}) {
  const docs = await listPublicProjectionDocs(filters);
  if (docs.length && docs.some((doc) => doc.certificateBreakdown && Object.keys(doc.certificateBreakdown).length)) return docs;
  if (mongoose.connection.readyState !== 1) return [];
  return Certificate.aggregate([
    { $match: { isDeleted: false, ...buildDateMatch(filters, 'issuedAt'), ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {}) } },
    {
      $group: {
        _id: '$departmentCode',
        certificatesIssued: { $sum: 1 },
        activeCount: { $sum: { $cond: [{ $eq: ['$status', 'issued'] }, 1, 0] } },
        revokedCount: { $sum: { $cond: [{ $eq: ['$status', 'revoked'] }, 1, 0] } },
        expiredCount: {
          $sum: { $cond: [{ $and: [{ $eq: ['$status', 'issued'] }, { $lt: ['$validUntil', new Date()] }] }, 1, 0] }
        }
      }
    }
  ]);
}

async function getGrievanceTrendMetrics(filters = {}) {
  const docs = await listPublicProjectionDocs(filters);
  if (docs.length && docs.some((doc) => doc.grievanceBreakdown && Object.keys(doc.grievanceBreakdown).length)) return docs;
  if (mongoose.connection.readyState !== 1) return [];
  return Grievance.aggregate([
    { $match: { isDeleted: false, ...buildDateMatch(filters, 'createdAt'), ...(filters.departmentCode ? { departmentCode: filters.departmentCode } : {}) } },
    {
      $group: {
        _id: '$departmentCode',
        grievancesOpened: { $sum: 1 },
        grievancesResolved: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } },
        openGrievances: { $sum: { $cond: [{ $in: ['$status', ['open', 'acknowledged', 'in_review', 'escalated']] }, 1, 0] } }
      }
    }
  ]);
}

async function getMonthlyApplicationTrend(filters = {}) {
  return listPublicProjectionDocs(filters);
}

module.exports = {
  getOverviewMetrics,
  getApplicationStageCounts,
  getDepartmentTurnaroundMetrics,
  getApprovalRateMetrics,
  getCertificateIssuanceMetrics,
  getGrievanceTrendMetrics,
  getMonthlyApplicationTrend
};
