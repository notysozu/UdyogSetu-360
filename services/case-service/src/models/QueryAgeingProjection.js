const mongoose = require('mongoose');

const QueryAgeingProjectionSchema = new mongoose.Schema(
  {
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    departmentCode: { type: String, required: true, trim: true },
    queryType: { type: String, default: 'task_query', trim: true },
    openQueries: { type: Number, default: 0, min: 0 },
    respondedQueries: { type: Number, default: 0, min: 0 },
    overdueQueries: { type: Number, default: 0, min: 0 },
    averageAgeHours: { type: Number, default: 0, min: 0 },
    medianAgeHours: { type: Number, default: 0, min: 0 },
    oldestAgeHours: { type: Number, default: 0, min: 0 },
    averageResponseHours: { type: Number, default: 0, min: 0 },
    ageingBuckets: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        '0_2_days': 0,
        '3_7_days': 0,
        '8_15_days': 0,
        '16_30_days': 0,
        '31_plus_days': 0
      }
    },
    slaBreachCount: { type: Number, default: 0, min: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: 'query_ageing_projections' }
);

QueryAgeingProjectionSchema.index({ departmentCode: 1, periodEnd: -1 });
QueryAgeingProjectionSchema.index({ overdueQueries: -1, periodEnd: -1 });
QueryAgeingProjectionSchema.index({ averageAgeHours: -1, periodEnd: -1 });

module.exports = mongoose.model('QueryAgeingProjection', QueryAgeingProjectionSchema);
