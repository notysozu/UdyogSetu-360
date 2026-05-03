const mongoose = require('mongoose');
const { createOperationalSchema } = require('../../../../packages/shared/src');

const InvestorProfileSchema = createOperationalSchema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  organisationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation', required: true, index: true },
  investorType: {
    type: String,
    enum: ['promoter', 'consultant', 'authorised_representative', 'company_admin'],
    required: true
  },
  designation: { type: String, trim: true },
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'verified', 'rejected'],
    default: 'not_started',
    index: true
  },
  preferredLanguage: { type: String, default: 'en' },
  notificationPreferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  linkedCases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Case' }]
});

InvestorProfileSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

module.exports =
  mongoose.models.InvestorProfile || mongoose.model('InvestorProfile', InvestorProfileSchema);
