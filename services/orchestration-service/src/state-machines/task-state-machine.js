const {
  TASK_STATUSES,
  PERMISSIONS,
  DOMAIN_EVENT_NAMES
} = require('../../../../packages/shared/src');

const TASK_TRANSITIONS = Object.freeze({
  [TASK_STATUSES.PENDING]: {
    [TASK_STATUSES.ASSIGNED]: {
      permission: PERMISSIONS.TASK_ASSIGN,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_ASSIGNED,
      slaAction: 'start'
    },
    [TASK_STATUSES.CANCELLED]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_STATUS_CHANGED,
      reasonRequired: true
    }
  },
  [TASK_STATUSES.ASSIGNED]: {
    [TASK_STATUSES.UNDER_REVIEW]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_REVIEW_STARTED
    },
    [TASK_STATUSES.CANCELLED]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_STATUS_CHANGED,
      reasonRequired: true
    }
  },
  [TASK_STATUSES.UNDER_REVIEW]: {
    [TASK_STATUSES.QUERY_RAISED]: {
      permission: PERMISSIONS.TASK_RAISE_QUERY,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_QUERY_RAISED,
      slaAction: 'pause'
    },
    [TASK_STATUSES.INSPECTION_REQUIRED]: {
      permission: PERMISSIONS.INSPECTION_SCHEDULE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_INSPECTION_REQUIRED
    },
    [TASK_STATUSES.FEE_DEMANDED]: {
      permission: PERMISSIONS.FEE_CREATE_DEMAND,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_FEE_DEMANDED
    },
    [TASK_STATUSES.APPROVED]: {
      permission: PERMISSIONS.TASK_APPROVE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_APPROVED
    },
    [TASK_STATUSES.REJECTED]: {
      permission: PERMISSIONS.TASK_REJECT,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_REJECTED,
      reasonRequired: true
    },
    [TASK_STATUSES.RETURNED]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_RETURNED,
      reasonRequired: true
    }
  },
  [TASK_STATUSES.QUERY_RAISED]: {
    [TASK_STATUSES.RESPONSE_RECEIVED]: {
      permission: PERMISSIONS.TASK_RESPOND_QUERY,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_RESPONSE_SUBMITTED,
      slaAction: 'resume'
    }
  },
  [TASK_STATUSES.RESPONSE_RECEIVED]: {
    [TASK_STATUSES.UNDER_REVIEW]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_REVIEW_STARTED
    }
  },
  [TASK_STATUSES.INSPECTION_REQUIRED]: {
    [TASK_STATUSES.INSPECTION_SCHEDULED]: {
      permission: PERMISSIONS.INSPECTION_SCHEDULE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_INSPECTION_SCHEDULED
    }
  },
  [TASK_STATUSES.INSPECTION_SCHEDULED]: {
    [TASK_STATUSES.INSPECTION_COMPLETED]: {
      permission: PERMISSIONS.INSPECTION_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_INSPECTION_COMPLETED
    }
  },
  [TASK_STATUSES.INSPECTION_COMPLETED]: {
    [TASK_STATUSES.UNDER_REVIEW]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_REVIEW_STARTED
    }
  },
  [TASK_STATUSES.FEE_DEMANDED]: {
    [TASK_STATUSES.FEE_PAID]: {
      permission: PERMISSIONS.FEE_MARK_PAID,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_FEE_PAID
    }
  },
  [TASK_STATUSES.FEE_PAID]: {
    [TASK_STATUSES.UNDER_REVIEW]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_REVIEW_STARTED
    }
  },
  [TASK_STATUSES.APPROVED]: {
    [TASK_STATUSES.CERTIFICATE_ISSUED]: {
      permission: PERMISSIONS.CERTIFICATE_ISSUE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_CERTIFICATE_ISSUED
    }
  },
  [TASK_STATUSES.CERTIFICATE_ISSUED]: {
    [TASK_STATUSES.CLOSED]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_CLOSED
    }
  },
  [TASK_STATUSES.REJECTED]: {
    [TASK_STATUSES.CLOSED]: {
      permission: PERMISSIONS.TASK_UPDATE,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_CLOSED,
      reasonRequired: true
    }
  },
  [TASK_STATUSES.RETURNED]: {
    [TASK_STATUSES.RESPONSE_RECEIVED]: {
      permission: PERMISSIONS.TASK_RESPOND_QUERY,
      auditRequired: true,
      eventRequired: true,
      eventName: DOMAIN_EVENT_NAMES.TASK_RESPONSE_SUBMITTED,
      slaAction: 'resume'
    }
  }
});

function getTaskTransition(currentStatus, nextStatus) {
  return TASK_TRANSITIONS[currentStatus]?.[nextStatus] || null;
}

module.exports = {
  TASK_TRANSITIONS,
  getTaskTransition
};
