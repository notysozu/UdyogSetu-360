require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');

const Notification = require(path.join(__dirname, '..', 'services/notification-service/src/models/Notification'));
const MessageTemplate = require(path.join(__dirname, '..', 'services/notification-service/src/models/MessageTemplate'));
const Grievance = require(path.join(__dirname, '..', 'services/case-service/src/models/Grievance'));
const SlaTimer = require(path.join(__dirname, '..', 'services/case-service/src/models/SlaTimer'));
const EscalationPolicy = require(path.join(__dirname, '..', 'services/case-service/src/models/EscalationPolicy'));
const ReminderJob = require(path.join(__dirname, '..', 'services/case-service/src/models/ReminderJob'));

const departments = ['pollution', 'power', 'fire', 'industrial_safety', 'labour'];

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';
  await mongoose.connect(mongoUri);

  const templateDocs = [
    'case_submitted', 'task_query_raised', 'query_response_submitted', 'inspection_scheduled',
    'inspection_completed', 'fee_demanded', 'fee_paid', 'task_approved', 'task_rejected',
    'certificate_issued', 'grievance_created', 'grievance_acknowledged', 'grievance_resolved',
    'grievance_closed', 'sla_warning', 'sla_breached', 'escalation_created', 'renewal_reminder'
  ].map((code) => ({
    templateCode: code,
    name: code,
    description: `Seeded template: ${code}`,
    channel: 'in_app',
    locale: 'en',
    bodyTemplate: `${code} for {{universalCaseId}}`,
    isActive: true,
    version: 1
  }));

  for (const doc of templateDocs) {
    await MessageTemplate.updateOne(
      { templateCode: doc.templateCode, channel: doc.channel, locale: doc.locale, version: doc.version },
      { $set: doc },
      { upsert: true }
    );
  }

  for (const departmentCode of departments) {
    await EscalationPolicy.updateOne(
      { policyCode: `SLA-${departmentCode}-DEFAULT` },
      {
        $set: {
          policyCode: `SLA-${departmentCode}-DEFAULT`,
          name: `${departmentCode} default escalation`,
          entityType: 'task',
          departmentCode,
          isActive: true,
          levels: [
            { level: 1, triggerAfterMinutes: 60, notifyRoles: ['department_officer', 'department_supervisor'], action: 'notify' },
            { level: 2, triggerAfterMinutes: 120, notifyRoles: ['department_supervisor', 'nodal_officer'], action: 'assign_nodal' },
            { level: 3, triggerAfterMinutes: 240, notifyRoles: ['admin'], action: 'escalate_admin' }
          ]
        }
      },
      { upsert: true }
    );
  }

  const now = new Date();
  const grievanceData = [
    {
      grievanceNumber: 'GRV-2026-000101',
      universalCaseId: 'US360-KA-2026-000001',
      departmentCode: 'pollution',
      category: 'delay',
      subject: 'Delayed pollution consent',
      description: 'Pollution consent pending beyond expected SLA.',
      priority: 'high'
    },
    {
      grievanceNumber: 'GRV-2026-000102',
      universalCaseId: 'US360-KA-2026-000001',
      departmentCode: 'fire',
      category: 'inspection_issue',
      subject: 'Fire inspection delay',
      description: 'Inspection date passed with no completion update.',
      priority: 'normal'
    }
  ];

  for (const g of grievanceData) {
    await Grievance.updateOne(
      { grievanceNumber: g.grievanceNumber },
      { $set: { ...g, status: 'open', source: 'investor_portal', dueAt: new Date(now.getTime() + 3 * 86400000), warningAt: new Date(now.getTime() + 2 * 86400000) } },
      { upsert: true }
    );
  }

  await Notification.updateOne(
    { correlationId: 'seed-communication-demo' },
    {
      $set: {
        recipientUserId: 'seed-investor-user',
        recipientRole: 'investor',
        recipientDepartmentCode: 'pollution',
        universalCaseId: 'US360-KA-2026-000001',
        channel: 'in_app',
        templateCode: 'grievance_created',
        title: 'Grievance submitted',
        body: 'Your grievance has been created successfully.',
        priority: 'normal',
        status: 'sent',
        sentAt: now,
        correlationId: 'seed-communication-demo'
      }
    },
    { upsert: true }
  );

  await SlaTimer.updateOne(
    { entityType: 'task', entityId: 'seed-power-task' },
    {
      $set: {
        entityType: 'task',
        entityId: 'seed-power-task',
        taskId: 'seed-power-task',
        departmentCode: 'power',
        timerType: 'approval',
        status: 'warning',
        startsAt: new Date(now.getTime() - 20 * 86400000),
        dueAt: new Date(now.getTime() + 2 * 3600000),
        warningAt: new Date(now.getTime() - 2 * 3600000)
      }
    },
    { upsert: true }
  );

  await SlaTimer.updateOne(
    { entityType: 'task', entityId: 'seed-labour-task' },
    {
      $set: {
        entityType: 'task',
        entityId: 'seed-labour-task',
        taskId: 'seed-labour-task',
        departmentCode: 'labour',
        timerType: 'approval',
        status: 'breached',
        startsAt: new Date(now.getTime() - 20 * 86400000),
        dueAt: new Date(now.getTime() - 24 * 3600000),
        warningAt: new Date(now.getTime() - 48 * 3600000),
        breachedAt: new Date(now.getTime() - 12 * 3600000)
      }
    },
    { upsert: true }
  );

  await ReminderJob.updateOne(
    { jobCode: 'seed-certificate-renewal-reminder' },
    {
      $set: {
        jobCode: 'seed-certificate-renewal-reminder',
        entityType: 'certificate',
        entityId: 'seed-certificate-1',
        reminderType: 'certificate_renewal',
        status: 'scheduled',
        scheduledFor: new Date(now.getTime() + 3600000),
        maxAttempts: 3
      }
    },
    { upsert: true }
  );

  await ReminderJob.updateOne(
    { jobCode: 'seed-query-response-reminder' },
    {
      $set: {
        jobCode: 'seed-query-response-reminder',
        entityType: 'task',
        entityId: 'seed-query-task',
        reminderType: 'query_response_due',
        status: 'scheduled',
        scheduledFor: new Date(now.getTime() + 2 * 3600000),
        maxAttempts: 3
      }
    },
    { upsert: true }
  );

  await mongoose.disconnect();
  console.log('Seeded communication module data.');
}

run().catch(async (error) => {
  console.error(error);
  try { await mongoose.disconnect(); } catch (_error) {}
  process.exit(1);
});
