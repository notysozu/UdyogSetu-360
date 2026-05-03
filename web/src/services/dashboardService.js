const Case = require('../models/Case');
const Department = require('../models/Department');
const Grievance = require('../models/Grievance');
const EventLog = require('../models/EventLog');

async function getAdminMetrics() {
  const [totalCases, totalDepartments, openGrievances, recentEvents, statusBuckets] = await Promise.all([
    Case.countDocuments({ softDeletedAt: null }),
    Department.countDocuments({ active: true }),
    Grievance.countDocuments({ status: { $in: ['open', 'in_review'] } }),
    EventLog.find().sort({ occurredAt: -1 }).limit(8),
    Case.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
  ]);

  return { totalCases, totalDepartments, openGrievances, recentEvents, statusBuckets };
}

module.exports = { getAdminMetrics };
