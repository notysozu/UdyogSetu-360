require('dotenv').config();

const mongoose = require('mongoose');
const { connectMongo } = require('../packages/shared/src');
const AnalyticsDailyRollup = require('../services/case-service/src/models/AnalyticsDailyRollup');
const DepartmentTurnaroundProjection = require('../services/case-service/src/models/DepartmentTurnaroundProjection');
const BottleneckProjection = require('../services/case-service/src/models/BottleneckProjection');
const DocumentDefectProjection = require('../services/case-service/src/models/DocumentDefectProjection');
const RejectionReasonProjection = require('../services/case-service/src/models/RejectionReasonProjection');
const QueryAgeingProjection = require('../services/case-service/src/models/QueryAgeingProjection');
const OfficerWorkloadProjection = require('../services/case-service/src/models/OfficerWorkloadProjection');
const EscalationFrequencyProjection = require('../services/case-service/src/models/EscalationFrequencyProjection');
const InvestorHistoryProjection = require('../services/case-service/src/models/InvestorHistoryProjection');

const departments = ['pollution', 'power', 'fire', 'industrial_safety', 'labour'];

function monthStart(offset = 0) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - offset);
  return d;
}

async function seed() {
  await connectMongo();
  for (let i = 0; i < 12; i += 1) {
    const date = monthStart(i);
    for (const departmentCode of departments) {
      await AnalyticsDailyRollup.updateOne(
        { date, granularity: 'monthly', scopeType: 'department', scopeId: departmentCode, departmentCode },
        {
          $set: {
            district: 'bengaluru_urban',
            sector: 'manufacturing',
            applicationsReceived: 60 + i,
            applicationsSubmitted: 52 + i,
            applicationsApproved: 35 + i,
            applicationsRejected: 9 + (i % 4),
            applicationsClosed: 25 + i,
            activeCases: 18 + (i % 6),
            certificatesIssued: 22 + i,
            grievancesOpened: 6 + (i % 4),
            grievancesResolved: 5 + (i % 4),
            queriesRaised: 14 + (i % 6),
            queriesResponded: 12 + (i % 6),
            inspectionsScheduled: 8 + (i % 3),
            inspectionsCompleted: 7 + (i % 3),
            feesDemanded: 11 + (i % 5),
            feesPaid: 10 + (i % 4),
            slaWarnings: 4 + (i % 3),
            slaBreaches: 2 + (i % 2),
            escalationsRaised: 1 + (i % 3),
            averageTurnaroundHours: 130 - i,
            medianTurnaroundHours: 110 - i,
            averageQueryAgeHours: 39 - i / 2,
            averageGrievanceResolutionHours: 62 - i / 3
          }
        },
        { upsert: true }
      );
    }
  }

  for (const departmentCode of departments) {
    const periodStart = monthStart(2);
    const periodEnd = monthStart(0);
    await DepartmentTurnaroundProjection.updateOne(
      { departmentCode, periodStart, periodEnd },
      {
        $set: {
          totalTasks: 240,
          completedTasks: 188,
          pendingTasks: 52,
          approvedTasks: 130,
          rejectedTasks: 28,
          returnedTasks: 30,
          averageTurnaroundHours: 102,
          medianTurnaroundHours: 87,
          p75TurnaroundHours: 130,
          p90TurnaroundHours: 180,
          slaWarningCount: 14,
          slaBreachCount: 9,
          slaComplianceRate: 95.2,
          ageingBuckets: { '0_2_days': 12, '3_7_days': 18, '8_15_days': 13, '16_30_days': 7, '31_plus_days': 2 },
          stageBreakdown: {},
          bottleneckScore: 37
        }
      },
      { upsert: true }
    );
  }

  await BottleneckProjection.updateOne(
    { bottleneckId: 'BTL-fire-1' },
    {
      $set: {
        periodStart: monthStart(1),
        periodEnd: monthStart(0),
        scopeType: 'department',
        scopeId: 'fire',
        departmentCode: 'fire',
        stage: 'inspection_pending',
        caseType: 'fire_safety_noc',
        severity: 'high',
        bottleneckScore: 78,
        affectedCaseCount: 22,
        averageWaitHours: 120,
        medianWaitHours: 98,
        p90WaitHours: 220,
        oldestPendingHours: 340,
        slaBreachCount: 7,
        queueDepth: 22,
        trendDirection: 'up',
        likelyCause: 'Inspector shortage',
        recommendedAction: 'Allocate shared inspection team',
        evidence: { source: 'seed' },
        status: 'open',
        detectedAt: new Date()
      }
    },
    { upsert: true }
  );

  await DocumentDefectProjection.updateOne(
    { defectId: 'DEF-fire-unsigned' },
    {
      $set: {
        periodStart: monthStart(1),
        periodEnd: monthStart(0),
        documentType: 'fire_building_plan',
        departmentCode: 'fire',
        defectCategory: 'unsigned',
        defectReason: 'Missing authorized signatory signature',
        occurrenceCount: 18,
        affectedCaseCount: 13,
        rejectionRate: 12.5,
        averageCorrectionTimeHours: 49,
        repeatedByOrganisationCount: 4,
        trendDirection: 'up',
        severity: 'high',
        examples: [],
        recommendedAction: 'Add pre-submission signature check'
      }
    },
    { upsert: true }
  );

  await RejectionReasonProjection.updateOne(
    { departmentCode: 'pollution', rejectionCategory: 'compliance_gap', rejectionReason: 'ETP layout mismatch', periodStart: monthStart(1), periodEnd: monthStart(0) },
    { $set: { caseType: 'consent_to_establish', taskType: 'scrutiny', rejectionCount: 11, affectedCaseCount: 9, percentageOfRejections: 22, trendDirection: 'up', examples: [] } },
    { upsert: true }
  );

  await QueryAgeingProjection.updateOne(
    { departmentCode: 'power', queryType: 'task_query', periodStart: monthStart(1), periodEnd: monthStart(0) },
    { $set: { openQueries: 17, respondedQueries: 31, overdueQueries: 6, averageAgeHours: 54, medianAgeHours: 32, oldestAgeHours: 210, averageResponseHours: 41, ageingBuckets: { '0_2_days': 8, '3_7_days': 7, '8_15_days': 4, '16_30_days': 3, '31_plus_days': 1 }, slaBreachCount: 6 } },
    { upsert: true }
  );

  await OfficerWorkloadProjection.updateOne(
    { departmentCode: 'labour', officerUserId: 'officer-lab-01', periodStart: monthStart(1), periodEnd: monthStart(0) },
    { $set: { officerDisplayName: 'Officer L-01', officerRole: 'department_officer', assignedTaskCount: 43, activeTaskCount: 11, completedTaskCount: 32, overdueTaskCount: 4, averageHandlingHours: 81, approvalCount: 22, rejectionCount: 6, queryRaisedCount: 9, inspectionHandledCount: 5, workloadScore: 74, imbalanceFlag: true } },
    { upsert: true }
  );

  await EscalationFrequencyProjection.updateOne(
    { departmentCode: 'industrial_safety', escalationType: 'sla', escalationLevel: 2, periodStart: monthStart(1), periodEnd: monthStart(0) },
    { $set: { escalationCount: 7, affectedCaseCount: 5, averageTimeToEscalationHours: 122, repeatedEntities: ['US360-KA-2026-000001'], topReasons: ['Pending inspection report'], resolutionRate: 57 } },
    { upsert: true }
  );

  await InvestorHistoryProjection.updateOne(
    { organisationId: 'ORG-US360-001' },
    {
      $set: {
        investorId: 'INV-US360-001',
        organisationDisplayName: 'Acme Industrial Private Limited',
        maskedOrganisationName: 'Acm***d',
        sector: 'manufacturing',
        district: 'bengaluru_urban',
        totalCases: 14,
        activeCases: 4,
        approvedCases: 8,
        rejectedCases: 2,
        withdrawnCases: 0,
        certificatesIssued: 7,
        grievancesRaised: 1,
        documentsRejected: 5,
        averageTurnaroundHours: 101,
        repeatDefectCount: 2,
        riskFlags: ['repeated_document_defects'],
        lastApplicationAt: monthStart(0),
        lastActivityAt: new Date()
      }
    },
    { upsert: true }
  );

  // eslint-disable-next-line no-console
  console.log('Analytics seed completed.');
  await mongoose.connection.close();
}

seed().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await mongoose.connection.close();
  process.exit(1);
});
