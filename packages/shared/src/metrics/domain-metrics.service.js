const metrics = require('./metrics-registry');

function recordCaseCreated() { metrics.incCounter('cases_created_total'); }
function recordCaseSubmitted() { metrics.incCounter('cases_submitted_total'); }
function recordCaseTransition() { metrics.incCounter('case_transitions_total'); }
function recordStuckCaseFound() { metrics.incCounter('stuck_cases_total'); }
function recordTaskTransition() { metrics.incCounter('task_transitions_total'); }
function recordTaskSlaBreach() { metrics.incCounter('task_sla_breaches_total'); }
function recordNotificationSent() { metrics.incCounter('notifications_sent_total'); }
function recordNotificationFailed() { metrics.incCounter('notifications_failed_total'); }
function recordGrievanceCreated() { metrics.incCounter('grievances_created_total'); }
function recordGrievanceResolved() { metrics.incCounter('grievances_resolved_total'); }
function recordReplayAttempt() { metrics.incCounter('replay_attempts_total'); }
function recordReplayFailure() { metrics.incCounter('replay_failures_total'); }

module.exports = {
  recordCaseCreated,
  recordCaseSubmitted,
  recordCaseTransition,
  recordStuckCaseFound,
  recordTaskTransition,
  recordTaskSlaBreach,
  recordNotificationSent,
  recordNotificationFailed,
  recordGrievanceCreated,
  recordGrievanceResolved,
  recordReplayAttempt,
  recordReplayFailure
};
