const service = require('../services/message-template.service');

function contextFromRequest(req) {
  return {
    userId: req.get('x-user-id') || null,
    correlationId: req.correlationId || null
  };
}

async function listTemplates(req, res, next) {
  try {
    const data = await require('../repositories/message-template.repository').listTemplates({}, {
      page: req.query.page || 1,
      limit: req.query.limit || 50
    });
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function getTemplate(req, res, next) {
  try {
    const template = await service.getActiveTemplate(req.params.templateCode, req.query.channel || 'in_app', req.query.locale || 'en');
    if (!template) return res.status(404).json({ success: false, data: null, error: { message: 'Template not found.' } });
    res.json({ success: true, data: template, error: null });
  } catch (error) {
    next(error);
  }
}

async function createTemplate(req, res, next) {
  try {
    const data = await service.createTemplate(req.body, contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function patchTemplate(req, res, next) {
  try {
    const data = await service.updateTemplate(req.params.templateCode, req.body, contextFromRequest(req));
    if (!data) return res.status(404).json({ success: false, data: null, error: { message: 'Template not found.' } });
    res.json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

async function seedDefaults(req, res, next) {
  try {
    const data = await service.seedDefaultTemplates(contextFromRequest(req));
    res.status(201).json({ success: true, data, error: null });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  patchTemplate,
  seedDefaults
};
