function buildMockInvestorPortalData(user = {}) {
  const organisationName = user.organisation || 'Setu Manufacturing Private Limited';
  const cases = [
    {
      caseId: 'US360-KA-2026-000001',
      universalCaseId: 'US360-KA-2026-000001',
      title: 'Demo Factory Approval',
      projectName: 'Demo Factory Approval',
      status: 'under_scrutiny',
      currentStage: 'Department scrutiny',
      departmentCodes: ['pollution', 'fire', 'labour'],
      lastActivityAt: new Date(),
      submittedAt: new Date(Date.now() - 7 * 86400000),
      applicantName: user.name || 'Investor User',
      organisationName
    }
  ];
  const tasks = [
    {
      _id: 'task-1',
      caseId: cases[0].caseId,
      departmentCode: 'pollution',
      title: 'Pollution consent review',
      status: 'query_raised',
      dueAt: new Date(Date.now() + 5 * 86400000),
      checklist: [{ status: 'completed' }, { status: 'pending' }],
      metadata: {
        queryMessage: 'Please upload the latest effluent handling note.',
        inspectionStatus: 'Not scheduled',
        feeStatus: 'Not applicable',
        certificateStatus: 'Pending'
      }
    },
    {
      _id: 'task-2',
      caseId: cases[0].caseId,
      departmentCode: 'fire',
      title: 'Fire NOC review',
      status: 'inspection_scheduled',
      dueAt: new Date(Date.now() + 12 * 86400000),
      checklist: [{ status: 'completed' }, { status: 'completed' }]
    }
  ];
  const notifications = [
    {
      _id: 'notif-1',
      title: 'Query raised by Pollution Control',
      message: 'Please submit a revised project report.',
      caseId: cases[0].caseId,
      createdAt: new Date(Date.now() - 3600000),
      readAt: null
    }
  ];
  const certificates = [
    {
      _id: 'cert-1',
      certificateNumber: 'CERT-US360-0001',
      caseId: cases[0].caseId,
      departmentName: 'Fire Services',
      holderName: user.name || 'Investor User',
      enterpriseName: organisationName,
      issuedAt: new Date(Date.now() - 30 * 86400000),
      expiresAt: new Date(Date.now() + 45 * 86400000),
      status: 'valid',
      verificationToken: 'verify-demo-token'
    }
  ];
  const grievances = [
    {
      _id: 'grv-1',
      caseId: cases[0].caseId,
      subject: 'Delay in inspection scheduling',
      message: 'Inspection date has not been confirmed yet.',
      status: 'open',
      createdAt: new Date(Date.now() - 2 * 86400000),
      responses: []
    }
  ];
  return { cases, tasks, notifications, certificates, grievances };
}

module.exports = { buildMockInvestorPortalData };
