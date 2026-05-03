const DOCUMENT_TYPES = Object.freeze({
  PAN_CARD: 'pan_card',
  GST_CERTIFICATE: 'gst_certificate',
  UDYAM_CERTIFICATE: 'udyam_certificate',
  LAND_DOCUMENT: 'land_document',
  PROJECT_REPORT: 'project_report',
  LAYOUT_PLAN: 'layout_plan',
  POLLUTION_CONTROL_DOCUMENT: 'pollution_control_document',
  FIRE_SAFETY_PLAN: 'fire_safety_plan',
  FACTORY_SAFETY_DOCUMENT: 'factory_safety_document',
  LABOUR_DOCUMENT: 'labour_document',
  AUTHORISATION_LETTER: 'authorisation_letter',
  FEE_RECEIPT: 'fee_receipt',
  INSPECTION_REPORT: 'inspection_report',
  APPROVAL_ORDER: 'approval_order',
  CERTIFICATE: 'certificate',
  GRIEVANCE_ATTACHMENT: 'grievance_attachment',
  QUERY_RESPONSE_ATTACHMENT: 'query_response_attachment',
  OTHER: 'other'
});

const DOCUMENT_TYPE_VALUES = Object.freeze(Object.values(DOCUMENT_TYPES));

const DOCUMENT_VISIBILITIES = Object.freeze({
  PRIVATE: 'private',
  ORGANISATION: 'organisation',
  DEPARTMENT: 'department',
  PUBLIC_VERIFICATION: 'public_verification',
  INTERNAL_ONLY: 'internal_only'
});

const DOCUMENT_VISIBILITY_VALUES = Object.freeze(Object.values(DOCUMENT_VISIBILITIES));

const DOCUMENT_VERIFICATION_STATUSES = Object.freeze({
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed',
  MANUALLY_VERIFIED: 'manually_verified',
  DIGILOCKER_VERIFIED: 'digilocker_verified'
});

const DOCUMENT_VERIFICATION_STATUS_VALUES = Object.freeze(
  Object.values(DOCUMENT_VERIFICATION_STATUSES)
);

const DOCUMENT_STORAGE_PROVIDERS = Object.freeze({
  S3: 's3',
  MINIO: 'minio',
  LOCAL: 'local',
  DIGILOCKER_REFERENCE: 'digilocker_reference'
});

const DOCUMENT_STORAGE_PROVIDER_VALUES = Object.freeze(Object.values(DOCUMENT_STORAGE_PROVIDERS));

const DOCUMENT_SCAN_STATUSES = Object.freeze({
  NOT_SCANNED: 'not_scanned',
  PENDING: 'pending',
  CLEAN: 'clean',
  INFECTED: 'infected',
  FAILED: 'failed',
  SKIPPED: 'skipped'
});

const DOCUMENT_SCAN_STATUS_VALUES = Object.freeze(Object.values(DOCUMENT_SCAN_STATUSES));

module.exports = {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_VALUES,
  DOCUMENT_VISIBILITIES,
  DOCUMENT_VISIBILITY_VALUES,
  DOCUMENT_VERIFICATION_STATUSES,
  DOCUMENT_VERIFICATION_STATUS_VALUES,
  DOCUMENT_STORAGE_PROVIDERS,
  DOCUMENT_STORAGE_PROVIDER_VALUES,
  DOCUMENT_SCAN_STATUSES,
  DOCUMENT_SCAN_STATUS_VALUES
};
