const templateRepository = require('../repositories/message-template.repository');

const DEFAULT_TEMPLATES = [
  'case_submitted',
  'task_query_raised',
  'query_response_submitted',
  'inspection_scheduled',
  'inspection_completed',
  'fee_demanded',
  'fee_paid',
  'task_approved',
  'task_rejected',
  'certificate_issued',
  'grievance_created',
  'grievance_acknowledged',
  'grievance_resolved',
  'grievance_closed',
  'sla_warning',
  'sla_breached',
  'escalation_created',
  'renewal_reminder'
];

function escapeValue(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function interpolate(template, variables = {}) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    if (value === null || value === undefined || value === '') return '-';
    return escapeValue(value);
  });
}

async function getActiveTemplate(templateCode, channel, locale = 'en') {
  return (
    (await templateRepository.findActiveTemplate(templateCode, channel, locale)) ||
    (locale !== 'en' ? await templateRepository.findActiveTemplate(templateCode, channel, 'en') : null)
  );
}

async function renderTemplate(templateCode, channel, locale, variables = {}) {
  const template = await getActiveTemplate(templateCode, channel, locale || 'en');
  if (!template) {
    return {
      subject: interpolate('{{title}}', variables),
      body: interpolate('{{message}}', variables),
      sms: interpolate('{{message}}', variables)
    };
  }
  return {
    subject: interpolate(template.subjectTemplate || '', variables),
    body: interpolate(template.bodyTemplate || '', variables),
    sms: interpolate(template.smsTemplate || '', variables)
  };
}

async function createTemplate(input, context = {}) {
  return templateRepository.create({
    ...input,
    createdBy: context.userId || null,
    updatedBy: context.userId || null
  });
}

async function updateTemplate(templateCode, input, context = {}) {
  const existing = await templateRepository.findOne({ templateCode, channel: input.channel, locale: input.locale || 'en', isActive: true }, { activeOnly: true });
  if (!existing) return null;
  return templateRepository.updateById(existing._id, {
    ...input,
    updatedBy: context.userId || null
  });
}

async function seedDefaultTemplates(context = {}) {
  const jobs = DEFAULT_TEMPLATES.map((templateCode) =>
    templateRepository.findOne({ templateCode, channel: 'in_app', locale: 'en', version: 1, isDeleted: false }).then((existing) => {
      if (existing) return existing;
      return createTemplate(
        {
          templateCode,
          name: templateCode.replace(/_/g, ' '),
          channel: 'in_app',
          locale: 'en',
          subjectTemplate: '{{title}}',
          bodyTemplate: '{{message}}',
          smsTemplate: '{{message}}',
          variables: ['title', 'message'],
          category: templateCode.includes('grievance') ? 'grievance' : templateCode.includes('sla') ? 'sla' : 'system',
          isActive: true,
          version: 1
        },
        context
      );
    })
  );
  return Promise.all(jobs);
}

module.exports = {
  renderTemplate,
  createTemplate,
  updateTemplate,
  getActiveTemplate,
  seedDefaultTemplates
};
