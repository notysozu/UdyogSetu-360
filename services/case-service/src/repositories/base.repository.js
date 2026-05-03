function buildPagination({ page = 1, limit = 25 } = {}) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    page: safePage
  };
}

function createRepository(model) {
  return {
    model,
    async create(input, options = {}) {
      const [created] = await model.create([input], options.session ? { session: options.session } : {});
      return created;
    },
    findById(id, options = {}) {
      const query = model.findById(id);
      return options.activeOnly ? query.active() : query;
    },
    findOne(filter = {}, options = {}) {
      const query = model.findOne(filter);
      return options.activeOnly ? query.active() : query;
    },
    async updateById(id, update, options = {}) {
      return model.findByIdAndUpdate(id, update, { new: true, session: options.session });
    },
    async softDeleteById(id, deletedBy) {
      return model.softDeleteById(id, deletedBy);
    },
    async paginate(filter = {}, options = {}) {
      const { skip, limit, page } = buildPagination(options.pagination);
      let query = model.find(filter);
      if (options.activeOnly) {
        query = query.active();
      }
      if (options.sort) {
        query = query.sort(options.sort);
      }
      const [items, total] = await Promise.all([
        query.skip(skip).limit(limit).lean(),
        model.countDocuments(options.activeOnly ? { ...filter, isDeleted: false } : filter)
      ]);
      return {
        items,
        total,
        page,
        limit
      };
    }
  };
}

module.exports = { createRepository, buildPagination };
