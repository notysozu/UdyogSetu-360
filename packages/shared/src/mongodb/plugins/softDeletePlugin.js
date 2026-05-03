function softDeletePlugin(schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: schema.base.Schema.Types.ObjectId, ref: 'User', default: null }
  });

  schema.query.active = function active() {
    return this.where({ isDeleted: false });
  };

  schema.statics.softDeleteById = function softDeleteById(id, deletedBy = null) {
    return this.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy
        }
      },
      { new: true }
    );
  };

  schema.statics.findActive = function findActive(filter = {}) {
    return this.find({ ...filter, isDeleted: false });
  };
}

module.exports = { softDeletePlugin };
