const MessageTemplate = require('../models/MessageTemplate');
const { createRepository, buildPagination } = require('../../../case-service/src/repositories/base.repository');

const repository = createRepository(MessageTemplate);

repository.findActiveTemplate = function findActiveTemplate(templateCode, channel, locale = 'en') {
  return MessageTemplate.findOne({
    templateCode,
    channel,
    locale,
    isActive: true,
    isDeleted: false
  }).sort({ version: -1 });
};

repository.listTemplates = async function listTemplates(filter = {}, pagination = {}) {
  const { skip, limit, page } = buildPagination(pagination);
  const query = { ...filter, isDeleted: false };
  const [items, total] = await Promise.all([
    MessageTemplate.find(query).sort({ templateCode: 1, version: -1 }).skip(skip).limit(limit).lean(),
    MessageTemplate.countDocuments(query)
  ]);
  return { items, total, page, limit };
};

module.exports = repository;
