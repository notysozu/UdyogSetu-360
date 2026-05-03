const CommunicationThread = require('../models/CommunicationThread');
const { createRepository, buildPagination } = require('./base.repository');

const repository = createRepository(CommunicationThread);

repository.findByResource = function findByResource(resourceType, resourceId) {
  return CommunicationThread.findOne({ resourceType, resourceId, isDeleted: false });
};

repository.listMessages = async function listMessages(threadId, pagination = {}) {
  const { skip, limit, page } = buildPagination(pagination);
  const thread = await CommunicationThread.findById(threadId).lean();
  const messages = (thread?.messages || []).slice(skip, skip + limit);
  return {
    items: messages,
    total: thread?.messages?.length || 0,
    page,
    limit
  };
};

module.exports = repository;
