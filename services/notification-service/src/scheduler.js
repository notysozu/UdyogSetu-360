const { runNotificationDispatchJob } = require('./jobs/notification-dispatch.job');
const { runReminderDispatchJob } = require('./jobs/reminder-dispatch.job');
const { runSlaMonitoringJob } = require('./jobs/sla-monitoring.job');
const { runGrievanceAgeingRollupJob } = require('./jobs/grievance-ageing-rollup.job');
const { runApprovalAgeingRollupJob } = require('./jobs/approval-ageing-rollup.job');

let started = false;
const timers = [];

function safeRunner(name, fn) {
  return async () => {
    try {
      console.info(`[scheduler] ${name} started`);
      await fn({ user: { actorType: 'system', actorId: 'notification-service', role: 'system' } });
      console.info(`[scheduler] ${name} completed`);
    } catch (error) {
      console.error(`[scheduler] ${name} failed`, error.message);
    }
  };
}

function startScheduler() {
  if (started || String(process.env.SCHEDULED_JOBS_ENABLED || 'true') !== 'true') return;
  started = true;
  timers.push(setInterval(safeRunner('notification-dispatch', runNotificationDispatchJob), Number(process.env.NOTIFICATION_DISPATCH_INTERVAL_SECONDS || 30) * 1000));
  timers.push(setInterval(safeRunner('reminder-dispatch', runReminderDispatchJob), Number(process.env.REMINDER_DISPATCH_INTERVAL_SECONDS || 60) * 1000));
  timers.push(setInterval(safeRunner('sla-monitoring', runSlaMonitoringJob), Number(process.env.SLA_MONITORING_INTERVAL_MINUTES || 15) * 60000));
  timers.push(setInterval(safeRunner('grievance-ageing-rollup', runGrievanceAgeingRollupJob), Number(process.env.AGEING_ROLLUP_INTERVAL_MINUTES || 60) * 60000));
  timers.push(setInterval(safeRunner('approval-ageing-rollup', runApprovalAgeingRollupJob), Number(process.env.AGEING_ROLLUP_INTERVAL_MINUTES || 60) * 60000));
}

function stopScheduler() {
  while (timers.length) clearInterval(timers.pop());
  started = false;
}

module.exports = { startScheduler, stopScheduler };
