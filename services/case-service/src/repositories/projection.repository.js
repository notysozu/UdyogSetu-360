const CaseSummaryProjection = require('../models/CaseSummaryProjection');
const DepartmentWorkloadProjection = require('../models/DepartmentWorkloadProjection');
const PublicMetricsProjection = require('../models/PublicMetricsProjection');
const SlaBreachProjection = require('../models/SlaBreachProjection');

module.exports = {
  upsertCaseSummary(filter, update, options = {}) {
    return CaseSummaryProjection.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      session: options.session
    });
  },
  upsertDepartmentWorkload(filter, update, options = {}) {
    return DepartmentWorkloadProjection.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      session: options.session
    });
  },
  upsertPublicMetrics(filter, update, options = {}) {
    return PublicMetricsProjection.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      session: options.session
    });
  },
  upsertSlaBreach(filter, update, options = {}) {
    return SlaBreachProjection.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      session: options.session
    });
  }
};
