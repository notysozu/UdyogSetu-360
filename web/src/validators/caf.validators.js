const PROTECTED_FIELDS = new Set([
  'status',
  'universalCaseId',
  'submittedAt',
  'approvalTracks',
  'requiredDepartments',
  'acknowledgement',
  'createdBy',
  'updatedBy'
]);

const PHONE_PATTERN = /^[6-9]\d{9}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;
const PINCODE_PATTERN = /^\d{6}$/;

function cleanString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalised = cleanString(value).toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(normalised);
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toDate(value) {
  const cleaned = cleanString(value);
  if (!cleaned) return null;
  const date = new Date(cleaned);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeAttachment(item = {}) {
  return {
    documentType: cleanString(item.documentType).toLowerCase(),
    title: cleanString(item.title) || cleanString(item.documentType),
    fileName: cleanString(item.fileName),
    mimeType: cleanString(item.mimeType) || 'application/pdf',
    fileSize: Math.max(0, toNumber(item.fileSize) || 0),
    checksum: cleanString(item.checksum),
    objectKey: cleanString(item.objectKey),
    metadata: typeof item.metadata === 'object' && item.metadata ? item.metadata : {}
  };
}

function sanitizeInput(input = {}) {
  const safe = {};

  Object.keys(input || {}).forEach((key) => {
    if (!PROTECTED_FIELDS.has(key)) {
      safe[key] = input[key];
    }
  });

  const enterprise = safe.enterprise || {};
  const project = safe.project || {};
  const land = safe.land || {};
  const environment = safe.environment || {};
  const power = safe.power || {};
  const fire = safe.fire || {};
  const industrialSafety = safe.industrialSafety || safe.factorySafety || {};
  const labour = safe.labour || {};

  return {
    enterprise: {
      legalName: cleanString(enterprise.legalName),
      tradeName: cleanString(enterprise.tradeName),
      organisationType: cleanString(enterprise.organisationType).toLowerCase(),
      registrationNumber: cleanString(enterprise.registrationNumber),
      pan: cleanString(enterprise.pan).toUpperCase(),
      gstin: cleanString(enterprise.gstin).toUpperCase(),
      udyamNumber: cleanString(enterprise.udyamNumber).toUpperCase(),
      contactEmail: cleanString(enterprise.contactEmail).toLowerCase(),
      contactPhone: cleanString(enterprise.contactPhone),
      registeredAddress: cleanString(enterprise.registeredAddress),
      district: cleanString(enterprise.district),
      taluk: cleanString(enterprise.taluk),
      pincode: cleanString(enterprise.pincode),
      authorisedSignatoryName: cleanString(enterprise.authorisedSignatoryName),
      authorisedSignatoryDesignation: cleanString(enterprise.authorisedSignatoryDesignation),
      authorisedSignatoryEmail: cleanString(enterprise.authorisedSignatoryEmail).toLowerCase(),
      authorisedSignatoryPhone: cleanString(enterprise.authorisedSignatoryPhone)
    },
    project: {
      projectName: cleanString(project.projectName),
      projectType: cleanString(project.projectType),
      sector: cleanString(project.sector),
      investmentAmount: toNumber(project.investmentAmount),
      employmentExpected: toNumber(project.employmentExpected),
      projectDescription: cleanString(project.projectDescription),
      proposedStartDate: toDate(project.proposedStartDate),
      proposedCommercialOperationDate: toDate(project.proposedCommercialOperationDate),
      projectAddress: cleanString(project.projectAddress),
      projectDistrict: cleanString(project.projectDistrict),
      projectTaluk: cleanString(project.projectTaluk),
      projectPincode: cleanString(project.projectPincode),
      landAreaSqM: toNumber(project.landAreaSqM),
      builtUpAreaSqM: toNumber(project.builtUpAreaSqM),
      powerRequirementKw: toNumber(project.powerRequirementKw),
      waterRequirementKld: toNumber(project.waterRequirementKld),
      hazardousProcess: toBoolean(project.hazardousProcess),
      boilerInstalled: toBoolean(project.boilerInstalled),
      workersCount: toNumber(project.workersCount),
      shiftsCount: toNumber(project.shiftsCount)
    },
    land: {
      landOwnershipType: cleanString(land.landOwnershipType),
      landSurveyNumber: cleanString(land.landSurveyNumber),
      landUseType: cleanString(land.landUseType),
      zoningStatus: cleanString(land.zoningStatus),
      buildingPlanAvailable: toBoolean(land.buildingPlanAvailable),
      occupancyCertificateAvailable: toBoolean(land.occupancyCertificateAvailable)
    },
    environment: {
      pollutionCategory: cleanString(environment.pollutionCategory).toLowerCase(),
      effluentGenerated: toBoolean(environment.effluentGenerated),
      emissionsGenerated: toBoolean(environment.emissionsGenerated),
      hazardousWasteGenerated: toBoolean(environment.hazardousWasteGenerated),
      waterSource: cleanString(environment.waterSource),
      consentTypeRequested: cleanString(environment.consentTypeRequested)
    },
    power: {
      connectionType: cleanString(power.connectionType),
      connectedLoadKw: toNumber(power.connectedLoadKw),
      contractDemandKva: toNumber(power.contractDemandKva),
      backupGenerator: toBoolean(power.backupGenerator),
      transformerRequired: toBoolean(power.transformerRequired)
    },
    fire: {
      buildingHeightM: toNumber(fire.buildingHeightM),
      occupancyType: cleanString(fire.occupancyType).toLowerCase(),
      fireNocRequired: toBoolean(fire.fireNocRequired),
      storageOfFlammables: toBoolean(fire.storageOfFlammables),
      emergencyExitsProvided: toBoolean(fire.emergencyExitsProvided)
    },
    industrialSafety: {
      factoryLicenseRequired: toBoolean(industrialSafety.factoryLicenseRequired),
      machineryInstalled: toBoolean(industrialSafety.machineryInstalled),
      pressureVessels: toBoolean(industrialSafety.pressureVessels),
      boilers: toBoolean(industrialSafety.boilers),
      workerSafetyPlanAvailable: toBoolean(industrialSafety.workerSafetyPlanAvailable)
    },
    labour: {
      employeeCount: toNumber(labour.employeeCount),
      contractLabourCount: toNumber(labour.contractLabourCount),
      interstateMigrantWorkers: toBoolean(labour.interstateMigrantWorkers),
      shopsEstablishmentRequired: toBoolean(labour.shopsEstablishmentRequired),
      labourRegistrationRequired: toBoolean(labour.labourRegistrationRequired)
    },
    sourceSystem: cleanString(safe.sourceSystem) || 'sws_portal',
    sourceReferenceId: cleanString(safe.sourceReferenceId),
    duplicateOverrideConfirmed: toBoolean(safe.duplicateOverrideConfirmed),
    duplicateOverrideReason: cleanString(safe.duplicateOverrideReason),
    idempotencyKey: cleanString(safe.idempotencyKey),
    attachments: Array.isArray(safe.attachments)
      ? safe.attachments.map(sanitizeAttachment).filter((item) => item.documentType)
      : []
  };
}

function addError(errors, field, message) {
  if (!errors[field]) {
    errors[field] = [];
  }
  errors[field].push(message);
}

function validateDraftInput(input) {
  const data = sanitizeInput(input);
  const errors = {};
  const warnings = [];

  if (!data.enterprise.legalName && !data.project.projectName) {
    addError(errors, 'enterprise.legalName', 'Enter the legal name or project name to save a draft.');
    addError(errors, 'project.projectName', 'Enter the project name or legal name to save a draft.');
  }

  if (data.enterprise.pan && !PAN_PATTERN.test(data.enterprise.pan)) {
    warnings.push('PAN format appears invalid.');
  }
  if (data.enterprise.gstin && !GSTIN_PATTERN.test(data.enterprise.gstin)) {
    warnings.push('GSTIN format appears invalid.');
  }

  return {
    valid: Object.keys(errors).length === 0,
    data,
    errors,
    warnings
  };
}

function validateFinalSubmit(input, requiredAttachments = []) {
  const base = validateDraftInput(input);
  const { data, errors } = base;
  const requiredFields = {
    'enterprise.legalName': data.enterprise.legalName,
    'enterprise.organisationType': data.enterprise.organisationType,
    'enterprise.contactEmail': data.enterprise.contactEmail,
    'enterprise.contactPhone': data.enterprise.contactPhone,
    'enterprise.district': data.enterprise.district,
    'enterprise.authorisedSignatoryName': data.enterprise.authorisedSignatoryName,
    'enterprise.authorisedSignatoryEmail': data.enterprise.authorisedSignatoryEmail,
    'project.projectName': data.project.projectName,
    'project.projectType': data.project.projectType,
    'project.sector': data.project.sector,
    'project.investmentAmount': data.project.investmentAmount,
    'project.employmentExpected': data.project.employmentExpected,
    'project.projectAddress': data.project.projectAddress,
    'project.projectDistrict': data.project.projectDistrict,
    'project.projectTaluk': data.project.projectTaluk,
    'project.projectPincode': data.project.projectPincode,
    'project.landAreaSqM': data.project.landAreaSqM,
    'project.powerRequirementKw': data.project.powerRequirementKw,
    'labour.employeeCount': data.labour.employeeCount
  };

  Object.entries(requiredFields).forEach(([field, value]) => {
    if (value === null || value === undefined || value === '') {
      addError(errors, field, 'This field is required for final submission.');
    }
  });

  if (data.enterprise.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.enterprise.contactEmail)) {
    addError(errors, 'enterprise.contactEmail', 'Enter a valid email address.');
  }
  if (data.enterprise.authorisedSignatoryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.enterprise.authorisedSignatoryEmail)) {
    addError(errors, 'enterprise.authorisedSignatoryEmail', 'Enter a valid authorised signatory email address.');
  }
  if (data.enterprise.contactPhone && !PHONE_PATTERN.test(data.enterprise.contactPhone)) {
    addError(errors, 'enterprise.contactPhone', 'Enter a valid 10-digit mobile number.');
  }
  if (data.enterprise.pan && !PAN_PATTERN.test(data.enterprise.pan)) {
    addError(errors, 'enterprise.pan', 'Enter a valid PAN.');
  }
  if (data.enterprise.gstin && !GSTIN_PATTERN.test(data.enterprise.gstin)) {
    addError(errors, 'enterprise.gstin', 'Enter a valid GSTIN.');
  }
  if (data.enterprise.pincode && !PINCODE_PATTERN.test(data.enterprise.pincode)) {
    addError(errors, 'enterprise.pincode', 'Enter a valid 6-digit pincode.');
  }
  if (data.project.projectPincode && !PINCODE_PATTERN.test(data.project.projectPincode)) {
    addError(errors, 'project.projectPincode', 'Enter a valid 6-digit pincode.');
  }

  const numericChecks = [
    ['project.investmentAmount', data.project.investmentAmount],
    ['project.employmentExpected', data.project.employmentExpected],
    ['project.landAreaSqM', data.project.landAreaSqM],
    ['project.powerRequirementKw', data.project.powerRequirementKw],
    ['labour.employeeCount', data.labour.employeeCount],
    ['labour.contractLabourCount', data.labour.contractLabourCount]
  ];

  numericChecks.forEach(([field, value]) => {
    if (value !== null && value < 0) {
      addError(errors, field, 'Numeric values must be zero or greater.');
    }
  });

  if (data.project.investmentAmount !== null && data.project.investmentAmount <= 0) {
    addError(errors, 'project.investmentAmount', 'Investment amount must be greater than 0.');
  }

  if (
    data.project.proposedStartDate &&
    data.project.proposedCommercialOperationDate &&
    data.project.proposedCommercialOperationDate <= data.project.proposedStartDate
  ) {
    addError(
      errors,
      'project.proposedCommercialOperationDate',
      'Commercial operation date must be after the proposed start date.'
    );
  }

  requiredAttachments.forEach((documentType) => {
    const hasAttachment = data.attachments.some((item) => item.documentType === documentType);
    if (!hasAttachment) {
      addError(
        errors,
        'attachments',
        `Attachment required: ${documentType.replaceAll('_', ' ')}.`
      );
    }
  });

  return {
    valid: Object.keys(errors).length === 0,
    data,
    errors,
    warnings: base.warnings
  };
}

function validateAmendmentInput(input = {}) {
  const reason = cleanString(input.reason);
  const patch = input.patch && typeof input.patch === 'object' ? sanitizeInput(input.patch) : sanitizeInput(input);
  const errors = {};

  if (!reason) {
    addError(errors, 'reason', 'Provide a reason for the amendment request.');
  }

  return { valid: Object.keys(errors).length === 0, data: { reason, patch }, errors };
}

function validateResubmissionInput(input = {}) {
  const reason = cleanString(input.reason);
  const errors = {};

  if (!reason) {
    addError(errors, 'reason', 'Provide a reason for resubmission.');
  }

  return {
    valid: Object.keys(errors).length === 0,
    data: {
      reason,
      changedFields: Array.isArray(input.changedFields) ? input.changedFields.map(cleanString).filter(Boolean) : [],
      responseToQueryId: cleanString(input.responseToQueryId)
    },
    errors
  };
}

function validateDuplicateCheckInput(input = {}) {
  const data = sanitizeInput(input);
  return { valid: true, data, errors: {} };
}

module.exports = {
  PROTECTED_FIELDS,
  sanitizeInput,
  createDraftSchema: validateDraftInput,
  updateDraftSchema: validateDraftInput,
  finalSubmitSchema: validateFinalSubmit,
  amendmentSchema: validateAmendmentInput,
  resubmissionSchema: validateResubmissionInput,
  duplicateCheckSchema: validateDuplicateCheckInput,
  attachmentMetadataSchema: sanitizeAttachment
};
