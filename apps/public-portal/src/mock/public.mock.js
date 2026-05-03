const now = new Date();

const stageCounts = [
  ['submitted', 42],
  ['under_scrutiny', 27],
  ['query_raised', 11],
  ['response_submitted', 8],
  ['inspection_scheduled', 9],
  ['inspection_completed', 7],
  ['fee_demanded', 6],
  ['fee_paid', 5],
  ['approved', 21],
  ['rejected', 7],
  ['certificate_issued', 18],
  ['closed', 16]
].map(([stage, count]) => ({ stage, count }));

const departmentTurnaround = [
  ['pollution', 21, 14, 3, 19.5, 17, 8.5, 4],
  ['power', 16, 10, 2, 15.1, 13, 7.2, 3],
  ['fire', 18, 13, 1, 10.4, 9, 4.1, 2],
  ['industrial_safety', 12, 8, 2, 20.6, 18, 10.3, 3],
  ['labour', 14, 9, 2, 11.8, 10, 6.4, 2]
].map(([departmentCode, applicationsHandled, approvedCount, rejectedCount, averageTurnaroundDays, medianTurnaroundDays, slaBreachPercentage, activePendingCount]) => ({
  departmentCode,
  applicationsHandled,
  approvedCount,
  rejectedCount,
  averageTurnaroundDays,
  medianTurnaroundDays,
  slaBreachPercentage,
  activePendingCount
}));

const overview = {
  totalApplicationsReceived: 84,
  applicationsSubmittedThisMonth: 12,
  activeApplications: 39,
  approvedApplications: 21,
  rejectedApplications: 7,
  certificatesIssued: 18,
  grievancesOpened: 14,
  grievancesResolved: 9,
  averageTurnaroundDays: 15.6
};

const approvalRates = {
  overallApprovalRate: 75,
  rejectionRate: 25,
  departmentWise: departmentTurnaround.map((item) => ({
    departmentCode: item.departmentCode,
    approvalRate: Number(((item.approvedCount / Math.max(item.approvedCount + item.rejectedCount, 1)) * 100).toFixed(1))
  })),
  monthlyTrend: Array.from({ length: 6 }).map((_, index) => ({
    month: new Date(now.getFullYear(), now.getMonth() - (5 - index), 1).toISOString(),
    approvalRate: 68 + index * 3,
    rejectionRate: 32 - index * 3
  }))
};

const certificateMetrics = {
  totalIssued: 18,
  byDepartment: departmentTurnaround.map((item, index) => ({
    departmentCode: item.departmentCode,
    certificatesIssued: [4, 3, 5, 2, 4][index]
  })),
  byMonth: Array.from({ length: 6 }).map((_, index) => ({
    month: new Date(now.getFullYear(), now.getMonth() - (5 - index), 1).toISOString(),
    certificatesIssued: 2 + index
  })),
  activeCount: 16,
  expiredCount: 1,
  revokedCount: 1,
  publicVerificationCount: 22
};

const grievanceMetrics = {
  grievancesOpened: 14,
  grievancesResolved: 9,
  averageResolutionHours: 56,
  openGrievances: 5,
  closureRate: 64.3,
  byDepartment: departmentTurnaround.map((item, index) => ({
    departmentCode: item.departmentCode,
    grievanceCount: [3, 2, 2, 4, 3][index]
  })),
  monthlyTrend: Array.from({ length: 6 }).map((_, index) => ({
    month: new Date(now.getFullYear(), now.getMonth() - (5 - index), 1).toISOString(),
    opened: 1 + index,
    resolved: Math.max(1, index)
  }))
};

const monthlyApplications = Array.from({ length: 6 }).map((_, index) => ({
  month: new Date(now.getFullYear(), now.getMonth() - (5 - index), 1).toISOString(),
  applicationsReceived: 8 + index * 2
}));

const sampleCertificate = {
  certificateNumber: 'CERT-US360-2026-000001',
  universalCaseId: 'US360-KA-2026-000001',
  departmentCode: 'fire',
  certificateType: 'fire_safety_noc',
  status: 'issued',
  checksum: 'a3f1f0fd1f50bb22d65c7d6f9b7b4d3f2f8a4d11223344556677889900aabbcc',
  verificationToken: 'DEV-VERIFY-TOKEN-000001',
  issuedAt: new Date(now.getFullYear(), 0, 12).toISOString(),
  validFrom: new Date(now.getFullYear(), 0, 12).toISOString(),
  validUntil: new Date(now.getFullYear() + 1, 0, 11).toISOString(),
  issuingDepartment: 'Karnataka State Fire and Emergency Services'
};

module.exports = {
  overview,
  stageCounts,
  departmentTurnaround,
  approvalRates,
  certificateMetrics,
  grievanceMetrics,
  monthlyApplications,
  sampleCertificate
};
