function operation(summary, extra = {}) {
  return {
    summary,
    responses: {
      200: { description: 'Successful response' },
      400: { description: 'Validation or bad request error' },
      401: { description: 'Authentication required or token invalid' },
      403: { description: 'Access denied' },
      404: { description: 'Resource not found' }
    },
    ...extra
  };
}

function getPaths() {
  return {
    '/health': { get: operation('Gateway health') },
    '/ready': { get: operation('Gateway readiness') },
    '/cases': {
      post: operation('Create case'),
      get: operation('List cases')
    },
    '/cases/{caseId}': {
      get: operation('Get case by ID'),
      patch: operation('Update case')
    },
    '/cases/{caseId}/submit': { post: operation('Submit case') },
    '/cases/{caseId}/amend': { post: operation('Amend case') },
    '/cases/{caseId}/timeline': { get: operation('Get case timeline') },
    '/cases/{caseId}/tasks': { get: operation('List case tasks') },
    '/cases/{caseId}/documents': { get: operation('List case documents') },
    '/cases/{caseId}/grievances': { get: operation('List case grievances') },
    '/cases/{caseId}/events': { get: operation('List case events') },
    '/cases/{caseId}/certificates': { get: operation('List case certificates') },
    '/tasks': { get: operation('List tasks') },
    '/tasks/{taskId}': {
      get: operation('Get task by ID'),
      patch: operation('Update task')
    },
    '/tasks/{taskId}/actions/assign': { post: operation('Assign task') },
    '/tasks/{taskId}/actions/raise-query': { post: operation('Raise task query') },
    '/tasks/{taskId}/actions/respond-query': {
      post: operation('Respond to task query')
    },
    '/tasks/{taskId}/actions/schedule-inspection': {
      post: operation('Schedule inspection for task')
    },
    '/tasks/{taskId}/actions/approve': { post: operation('Approve task') },
    '/tasks/{taskId}/actions/reject': { post: operation('Reject task') },
    '/documents': { post: operation('Upload or register document metadata') },
    '/documents/{documentId}': {
      get: operation('Get document by ID'),
      patch: operation('Update document metadata')
    },
    '/documents/{documentId}/verify': { post: operation('Verify document') },
    '/documents/{documentId}/supersede': { post: operation('Supersede document') },
    '/events/ingest': { post: operation('Ingest CloudEvents-style payload') },
    '/events/{eventId}': { get: operation('Get event by ID') },
    '/certificates/verify': { post: operation('Verify certificate') },
    '/certificates/{certificateNumber}': {
      get: operation('Get certificate by number')
    },
    '/grievances': {
      post: operation('Create grievance'),
      get: operation('List grievances')
    },
    '/grievances/{grievanceId}': { get: operation('Get grievance by ID') },
    '/grievances/{grievanceId}/messages': {
      post: operation('Add grievance message')
    },
    '/grievances/{grievanceId}/status': {
      patch: operation('Update grievance status')
    },
    '/dashboard/investor': { get: operation('Investor dashboard') },
    '/dashboard/department': { get: operation('Department dashboard') },
    '/dashboard/nodal': { get: operation('Nodal dashboard') },
    '/dashboard/admin': { get: operation('Admin dashboard') },
    '/dashboard/audit': { get: operation('Audit dashboard') },
    '/dashboard/public-metrics': { get: operation('Public metrics dashboard') },
    '/integrations/{departmentCode}/callback': {
      post: operation('Receive department integration callback')
    },
    '/integrations/{departmentCode}/health': {
      get: operation('Get department integration health')
    },
    '/webhooks/n8n/{workflowCode}': { post: operation('Receive n8n webhook') },
    '/webhooks/departments/{departmentCode}': {
      post: operation('Receive department webhook')
    }
  };
}

module.exports = { getPaths };
