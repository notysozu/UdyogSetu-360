const departmentTasks = [
  'pollution',
  'power',
  'fire',
  'industrial_safety',
  'labour'
].map((departmentCode, index) => ({
  _id: `mock-task-${index + 1}`,
  caseId: 'mock-case-1',
  universalCaseId: 'US360-KA-2026-000001',
  departmentCode,
  title: `${departmentCode.replace(/_/g, ' ')} review`,
  status: index === 0 ? 'query_raised' : index === 1 ? 'under_review' : 'assigned',
  priority: 'normal',
  dueAt: new Date(Date.now() + (index + 1) * 86400000),
  checklist: [
    { code: 'doc_basic', label: 'Basic document check', required: true, status: 'satisfied', reviewedAt: new Date() },
    { code: 'site_details', label: 'Site detail review', required: true, status: index === 0 ? 'needs_clarification' : 'pending' }
  ],
  queryThread: index === 0 ? [{ _id: 'q-1', message: 'Please upload the revised plan.', raisedAt: new Date(), status: 'open' }] : [],
  createdAt: new Date(Date.now() - 3 * 86400000),
  updatedAt: new Date(),
  metadata: {
    recommendedAction: index === 0 ? 'Await investor response' : 'Continue scrutiny'
  }
}));

const mockCase = {
  _id: 'mock-case-1',
  caseId: 'US360-KA-2026-000001',
  universalCaseId: 'US360-KA-2026-000001',
  title: 'Demo Factory Approval',
  status: 'under_scrutiny',
  currentStage: 'Department review',
  createdAt: new Date(Date.now() - 8 * 86400000),
  lastActivityAt: new Date()
};

const comments = [
  {
    _id: 'comment-1',
    resourceType: 'task',
    resourceId: 'mock-task-1',
    caseId: 'mock-case-1',
    taskId: 'mock-task-1',
    universalCaseId: 'US360-KA-2026-000001',
    authorRole: 'department_officer',
    departmentCode: 'pollution',
    body: 'Investor clarification is awaited.',
    visibility: 'internal',
    createdAt: new Date()
  }
];

const documents = departmentTasks.map((task, index) => ({
  _id: `doc-${index + 1}`,
  caseId: 'mock-case-1',
  universalCaseId: 'US360-KA-2026-000001',
  taskId: task._id,
  departmentCode: task.departmentCode,
  documentType: 'project_report',
  title: `Project report ${index + 1}`,
  status: 'uploaded',
  version: 1,
  file: { originalName: `project-report-${index + 1}.pdf`, sizeBytes: 120000 },
  verification: { status: index === 0 ? 'pending' : 'verified' },
  createdAt: new Date()
}));

const slaTimers = departmentTasks.map((task, index) => ({
  _id: `sla-${index + 1}`,
  taskId: task._id,
  universalCaseId: 'US360-KA-2026-000001',
  departmentCode: task.departmentCode,
  status: index === 4 ? 'breached' : index === 0 ? 'warning' : 'running',
  dueAt: task.dueAt,
  startsAt: new Date(Date.now() - 2 * 86400000),
  escalationLevel: index === 4 ? 2 : 0
}));

module.exports = {
  demoUsers: {
    officer: { id: 'officer-1', name: 'Demo Officer', primaryRole: 'department_officer', departmentCode: 'pollution' },
    supervisor: { id: 'supervisor-1', name: 'Demo Supervisor', primaryRole: 'department_supervisor', departmentCode: 'pollution' },
    nodal: { id: 'nodal-1', name: 'Demo Nodal Lead', primaryRole: 'nodal_officer' },
    auditor: { id: 'auditor-1', name: 'Demo Auditor', primaryRole: 'auditor' }
  },
  departmentTasks,
  mockCase,
  comments,
  documents,
  slaTimers,
  inspections: [],
  fees: [],
  certificates: [],
  auditEvents: [],
  timelineEvents: []
};
