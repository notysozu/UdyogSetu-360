const mongoose = require('mongoose');
const {
  createOperationalSchema,
  ORGANISATION_TYPE_VALUES,
  validateGstin,
  validatePan
} = require('../../../../packages/shared/src');

const addressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    locality: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  { _id: false }
);

const contactSchema = new mongoose.Schema(
  {
    name: String,
    designation: String,
    email: String,
    phone: String
  },
  { _id: false }
);

const OrganisationSchema = createOperationalSchema({
  legalName: { type: String, required: true, trim: true },
  tradeName: { type: String, trim: true },
  organisationType: { type: String, required: true, enum: ORGANISATION_TYPE_VALUES, index: true },
  registrationNumber: { type: String, trim: true },
  pan: {
    type: String,
    trim: true,
    uppercase: true,
    validate: { validator: validatePan, message: 'Invalid PAN format.' }
  },
  gstin: {
    type: String,
    trim: true,
    uppercase: true,
    validate: { validator: validateGstin, message: 'Invalid GSTIN format.' }
  },
  udyamNumber: { type: String, trim: true, uppercase: true },
  address: addressSchema,
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String, trim: true },
  authorisedSignatory: contactSchema,
  status: {
    type: String,
    enum: ['draft', 'active', 'suspended', 'blacklisted', 'archived'],
    default: 'draft',
    index: true
  }
});

OrganisationSchema.index({ legalName: 'text', tradeName: 'text' });
OrganisationSchema.index(
  { registrationNumber: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } }
);
OrganisationSchema.index(
  { gstin: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } }
);
OrganisationSchema.index(
  { udyamNumber: 1 },
  { unique: true, sparse: true, partialFilterExpression: { isDeleted: false } }
);

module.exports = mongoose.models.Organisation || mongoose.model('Organisation', OrganisationSchema);
