const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const { connectDb } = require('../../../web/src/config/db');
const PublicMetricsProjection = require('../../../services/case-service/src/models/PublicMetricsProjection');
const DepartmentWorkloadProjection = require('../../../services/case-service/src/models/DepartmentWorkloadProjection');
const Certificate = require('../../../services/case-service/src/models/Certificate');

const departments = ['pollution', 'power', 'fire', 'industrial_safety', 'labour'];

async function seedMetrics() {
  const now = new Date();
  for (let index = 0; index < 12; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthOffset = 11 - index;
    await PublicMetricsProjection.findOneAndUpdate(
      { date, granularity: 'monthly' },
      {
        $set: {
          date,
          granularity: 'monthly',
          applicationsReceived: 40 + monthOffset * 3,
          applicationsSubmitted: 32 + monthOffset * 2,
          activeApplications: 18 + monthOffset,
          approvedApplications: 20 + monthOffset,
          rejectedApplications: 5 + Math.floor(monthOffset / 2),
          averageTurnaroundDays: 14 + (monthOffset % 4),
          certificatesIssued: 12 + monthOffset,
          grievancesOpened: 6 + Math.floor(monthOffset / 2),
          grievancesResolved: 5 + Math.floor(monthOffset / 2),
          stageCounts: {
            submitted: 12 + monthOffset,
            under_scrutiny: 10 + monthOffset,
            query_raised: 6,
            response_submitted: 5,
            inspection_scheduled: 4,
            inspection_completed: 4,
            fee_demanded: 3,
            fee_paid: 3,
            approved: 8 + monthOffset,
            rejected: 2 + Math.floor(monthOffset / 3),
            certificate_issued: 7 + monthOffset,
            closed: 6 + monthOffset
          },
          departmentBreakdown: departments.reduce((acc, departmentCode, depIndex) => {
            acc[departmentCode] = 8 + depIndex + monthOffset;
            return acc;
          }, {}),
          approvalRates: {
            overallApprovalRate: 74 + (monthOffset % 5),
            rejectionRate: 26 - (monthOffset % 5)
          },
          certificateBreakdown: {
            byDepartment: departments.reduce((acc, departmentCode, depIndex) => {
              acc[departmentCode] = 2 + depIndex + Math.floor(monthOffset / 3);
              return acc;
            }, {}),
            activeCount: 10 + monthOffset,
            expiredCount: 1,
            revokedCount: 1,
            publicVerificationCount: 20 + monthOffset
          },
          grievanceBreakdown: {
            byDepartment: departments.reduce((acc, departmentCode, depIndex) => {
              acc[departmentCode] = 1 + depIndex;
              return acc;
            }, {}),
            averageResolutionHours: 36 + monthOffset
          },
          metadata: { seeded: true }
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  for (const [index, departmentCode] of departments.entries()) {
    await DepartmentWorkloadProjection.findOneAndUpdate(
      { departmentCode, date: new Date(now.getFullYear(), now.getMonth(), 1) },
      {
        $set: {
          departmentCode,
          date: new Date(now.getFullYear(), now.getMonth(), 1),
          pendingCount: 3 + index,
          approvedCount: 10 + index,
          rejectedCount: 1 + (index % 2),
          overdueCount: index % 3,
          averageTurnaroundHours: 220 - index * 18,
          avgTurnaroundHours: 220 - index * 18,
          medianTurnaroundHours: 200 - index * 16,
          certificateIssuedCount: 2 + index,
          grievanceCount: 1 + index,
          officerWorkloads: [],
          metadata: { seeded: true }
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await Certificate.findOneAndUpdate(
    { certificateNumber: 'CERT-US360-2026-000001' },
    {
      $set: {
        universalCaseId: 'US360-KA-2026-000001',
        departmentCode: 'fire',
        certificateType: 'fire_safety_noc',
        status: 'issued',
        checksum: 'a3f1f0fd1f50bb22d65c7d6f9b7b4d3f2f8a4d11223344556677889900aabbcc',
        verificationToken: 'DEV-VERIFY-TOKEN-000001',
        issuedAt: new Date(now.getFullYear(), 0, 12),
        validFrom: new Date(now.getFullYear(), 0, 12),
        validUntil: new Date(now.getFullYear() + 1, 0, 11)
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

connectDb()
  .then(seedMetrics)
  .then(() => {
    console.log('Seeded public metrics and verification sample data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed public metrics:', error);
    process.exit(1);
  });
