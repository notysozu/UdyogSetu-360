const Comment = require('../models/Comment');

function create(data, session = null) {
  return Comment.create([data], session ? { session } : {}).then(([comment]) => comment);
}

function listByResource(resourceType, resourceId, filter = {}, pagination = {}) {
  return Comment.find({
    resourceType,
    resourceId,
    isDeleted: false,
    ...filter
  })
    .sort({ createdAt: 1 })
    .limit(Number(pagination.limit || 100))
    .skip(Number(pagination.skip || 0));
}

module.exports = {
  create,
  listByResource
};
