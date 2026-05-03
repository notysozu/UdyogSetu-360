const reminderService = require('../services/reminder.service');

async function runReminderDispatchJob(context = {}) {
  return reminderService.executeDueReminders(new Date(), context);
}

module.exports = { runReminderDispatchJob };
