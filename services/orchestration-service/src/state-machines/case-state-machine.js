const {
  CASE_STATUSES,
  PERMISSIONS,
  DOMAIN_EVENT_NAMES
} = require('../../../../packages/shared/src');

const CASE_TRANSITIONS = Object.freeze({
  [CASE_STATUSES.DRAFT]: {
    [CASE_STATUSES.SUBMITTED]: {
      permission: PERMISSIONS.CASE_SUBMIT,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_SUBMITTED,
      slaAction: 'start',
      systemTriggered: false
    },
    [CASE_STATUSES.WITHDRAWN]: {
      permission: PERMISSIONS.CASE_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_WITHDRAWN,
      systemTriggered: false,
      reasonRequired: true
    }
  },
  [CASE_STATUSES.SUBMITTED]: {
    [CASE_STATUSES.UNDER_SCRUTINY]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_SCRUTINY_STARTED,
      systemTriggered: true
    },
    [CASE_STATUSES.WITHDRAWN]: {
      permission: PERMISSIONS.CASE_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_WITHDRAWN,
      systemTriggered: false,
      reasonRequired: true
    }
  },
  [CASE_STATUSES.UNDER_SCRUTINY]: {
    [CASE_STATUSES.QUERY_RAISED]: {
      permission: PERMISSIONS.TASK_RAISE_QUERY,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_QUERY_RAISED,
      systemTriggered: true,
      requiresAnyTaskStatus: ['query_raised'],
      slaAction: 'pause'
    },
    [CASE_STATUSES.INSPECTION_SCHEDULED]: {
      permission: PERMISSIONS.INSPECTION_SCHEDULE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_INSPECTION_SCHEDULED,
      systemTriggered: true,
      requiresAnyTaskStatus: ['inspection_required', 'inspection_scheduled']
    },
    [CASE_STATUSES.APPROVED]: {
      permission: PERMISSIONS.TASK_APPROVE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_APPROVED,
      systemTriggered: true,
      requiresAllMandatoryTasksStatus: ['approved', 'certificate_issued', 'closed']
    },
    [CASE_STATUSES.REJECTED]: {
      permission: PERMISSIONS.TASK_REJECT,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_REJECTED,
      systemTriggered: true,
      requiresAnyTaskStatus: ['rejected'],
      reasonRequired: true
    },
    [CASE_STATUSES.AMENDMENT_REQUESTED]: {
      permission: PERMISSIONS.CASE_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_AMENDMENT_REQUESTED,
      systemTriggered: false,
      reasonRequired: true
    },
    [CASE_STATUSES.FEE_DEMANDED]: {
      permission: PERMISSIONS.FEE_CREATE_DEMAND,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_FEE_DEMANDED,
      systemTriggered: true,
      requiresAnyTaskStatus: ['fee_demanded']
    }
  },
  [CASE_STATUSES.QUERY_RAISED]: {
    [CASE_STATUSES.RESPONSE_SUBMITTED]: {
      permission: PERMISSIONS.TASK_RESPOND_QUERY,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_RESPONSE_SUBMITTED,
      systemTriggered: false,
      slaAction: 'resume'
    }
  },
  [CASE_STATUSES.RESPONSE_SUBMITTED]: {
    [CASE_STATUSES.UNDER_SCRUTINY]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_SCRUTINY_STARTED,
      systemTriggered: true
    }
  },
  [CASE_STATUSES.INSPECTION_SCHEDULED]: {
    [CASE_STATUSES.INSPECTION_COMPLETED]: {
      permission: PERMISSIONS.INSPECTION_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_INSPECTION_COMPLETED,
      systemTriggered: true,
      requiresAllMandatoryTasksStatus: ['inspection_completed', 'approved', 'rejected', 'fee_demanded', 'fee_paid', 'certificate_issued', 'closed']
    }
  },
  [CASE_STATUSES.INSPECTION_COMPLETED]: {
    [CASE_STATUSES.FEE_DEMANDED]: {
      permission: PERMISSIONS.FEE_CREATE_DEMAND,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_FEE_DEMANDED,
      systemTriggered: true,
      requiresAnyTaskStatus: ['fee_demanded']
    },
    [CASE_STATUSES.APPROVED]: {
      permission: PERMISSIONS.TASK_APPROVE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_APPROVED,
      systemTriggered: true,
      requiresAllMandatoryTasksStatus: ['approved', 'certificate_issued', 'closed']
    },
    [CASE_STATUSES.REJECTED]: {
      permission: PERMISSIONS.TASK_REJECT,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_REJECTED,
      systemTriggered: true,
      requiresAnyTaskStatus: ['rejected'],
      reasonRequired: true
    }
  },
  [CASE_STATUSES.FEE_DEMANDED]: {
    [CASE_STATUSES.FEE_PAID]: {
      permission: PERMISSIONS.FEE_MARK_PAID,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_FEE_PAID,
      systemTriggered: true,
      requiresAllMandatoryTasksStatus: ['fee_paid', 'approved', 'certificate_issued', 'closed']
    }
  },
  [CASE_STATUSES.FEE_PAID]: {
    [CASE_STATUSES.UNDER_SCRUTINY]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_SCRUTINY_STARTED,
      systemTriggered: true
    }
  },
  [CASE_STATUSES.APPROVED]: {
    [CASE_STATUSES.CERTIFICATE_ISSUED]: {
      permission: PERMISSIONS.CERTIFICATE_ISSUE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_CERTIFICATE_ISSUED,
      systemTriggered: true,
      requiresAllMandatoryTasksStatus: ['certificate_issued', 'closed']
    }
  },
  [CASE_STATUSES.CERTIFICATE_ISSUED]: {
    [CASE_STATUSES.CLOSED]: {
      permission: PERMISSIONS.CASE_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_CLOSED,
      systemTriggered: true,
      slaAction: 'complete',
      reasonRequired: true
    }
  },
  [CASE_STATUSES.REJECTED]: {
    [CASE_STATUSES.REOPENED]: {
      permission: PERMISSIONS.CASE_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_REOPENED,
      systemTriggered: false,
      reasonRequired: true
    }
  },
  [CASE_STATUSES.CLOSED]: {
    [CASE_STATUSES.REOPENED]: {
      permission: PERMISSIONS.CASE_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_REOPENED,
      systemTriggered: false,
      reasonRequired: true
    }
  },
  [CASE_STATUSES.REOPENED]: {
    [CASE_STATUSES.UNDER_SCRUTINY]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_SCRUTINY_STARTED,
      systemTriggered: true
    }
  },
  [CASE_STATUSES.AMENDMENT_REQUESTED]: {
    [CASE_STATUSES.AMENDED]: {
      permission: PERMISSIONS.CASE_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_AMENDED,
      systemTriggered: false,
      reasonRequired: true
    }
  },
  [CASE_STATUSES.AMENDED]: {
    [CASE_STATUSES.UNDER_SCRUTINY]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.CASE_SCRUTINY_STARTED,
      systemTriggered: true
    }
  }
});

function getCaseTransition(currentStatus, nextStatus) {
  return CASE_TRANSITIONS[currentStatus]?.[nextStatus] || null;
}

module.exports = { CASE_TRANSITIONS, getCaseTransition };
