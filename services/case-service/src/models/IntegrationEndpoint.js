const mongoose = require('mongoose');
const {
  createOperationalSchema,
  DEPARTMENT_CODE_VALUES,
  INTEGRATION_TYPE_VALUES,
  ADAPTER_TYPE_VALUES,
  ADAPTER_CAPABILITY_VALUES
} = require('../../../../packages/shared/src');

const retryPolicySchema = new mongoose.Schema(
  {
    maxAttempts: { type: Number, default: 5, min: 0 },
    backoffSeconds: { type: Number, default: 60, min: 0 },
    baseDelayMs: { type: Number, default: 5000, min: 0 },
    maxDelayMs: { type: Number, default: 300000, min: 0 },
    backoffMultiplier: { type: Number, default: 2, min: 1 },
    jitterEnabled: { type: Boolean, default: true },
    retryableErrorCodes: [{ type: String, trim: true }],
    nonRetryableErrorCodes: [{ type: String, trim: true }],
    retryableHttpStatuses: [{ type: Number }],
    nonRetryableHttpStatuses: [{ type: Number }],
    deadLetterQueue: String
  },
  { _id: false }
);

const endpointConfigSchema = new mongoose.Schema(
  {
    submitApplication: { type: String, trim: true },
    getStatus: { type: String, trim: true },
    pushDocument: { type: String, trim: true },
    healthCheck: { type: String, trim: true }
  },
  { _id: false }
);

const authConfigSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, default: 'none' },
    secretRef: { type: String, trim: true },
    headerName: { type: String, trim: true },
    usernameRef: { type: String, trim: true },
    passwordRef: { type: String, trim: true },
    tokenUrl: { type: String, trim: true },
    scopes: [{ type: String, trim: true }]
  },
  { _id: false }
);

const signatureConfigSchema = new mongoose.Schema(
  {
    algorithm: { type: String, trim: true },
    secretRef: { type: String, trim: true },
    headerName: { type: String, trim: true, default: 'x-us360-signature' },
    timestampHeaderName: { type: String, trim: true, default: 'x-us360-timestamp' },
    toleranceSeconds: { type: Number, default: 300, min: 0 },
    apiKeyHeaderName: { type: String, trim: true }
  },
  { _id: false }
);

const fileDropConfigSchema = new mongoose.Schema(
  {
    host: { type: String, trim: true },
    port: { type: Number, min: 1 },
    usernameRef: { type: String, trim: true },
    privateKeyRef: { type: String, trim: true },
    passwordRef: { type: String, trim: true },
    inboundPath: { type: String, trim: true },
    outboundPath: { type: String, trim: true },
    archivePath: { type: String, trim: true },
    errorPath: { type: String, trim: true },
    fileNamePattern: { type: String, trim: true },
    fileFormat: { type: String, trim: true },
    pollingIntervalMs: { type: Number, min: 0 }
  },
  { _id: false }
);

const databaseConfigSchema = new mongoose.Schema(
  {
    connectionRef: { type: String, trim: true },
    dialect: { type: String, trim: true },
    submitProcedure: { type: String, trim: true },
    statusQuery: { type: String, trim: true },
    callbackTable: { type: String, trim: true },
    pollingIntervalMs: { type: Number, min: 0 }
  },
  { _id: false }
);

const webhookConfigSchema = new mongoose.Schema(
  {
    inboundPath: { type: String, trim: true },
    outboundWebhookUrl: { type: String, trim: true },
    signatureSecretRef: { type: String, trim: true },
    allowedIps: [{ type: String, trim: true }],
    eventTypes: [{ type: String, trim: true }]
  },
  { _id: false }
);

const rpaConfigSchema = new mongoose.Schema(
  {
    botName: { type: String, trim: true },
    botEndpoint: { type: String, trim: true },
    credentialRef: { type: String, trim: true },
    scriptName: { type: String, trim: true },
    timeoutMs: { type: Number, min: 0 },
    screenshotCaptureEnabled: { type: Boolean, default: false }
  },
  { _id: false }
);

const humanAssistedConfigSchema = new mongoose.Schema(
  {
    queueName: { type: String, trim: true },
    officerInstructionTemplate: { type: String, trim: true },
    expectedManualFields: [{ type: String, trim: true }],
    checklist: [{ type: String, trim: true }],
    escalationAfterHours: { type: Number, min: 0 }
  },
  { _id: false }
);

const IntegrationEndpointSchema = createOperationalSchema({
  departmentCode: { type: String, enum: DEPARTMENT_CODE_VALUES, required: true, index: true },
  name: { type: String, required: true, trim: true },
  integrationType: { type: String, enum: INTEGRATION_TYPE_VALUES, required: true, index: true },
  adapterCode: { type: String, trim: true, index: true },
  adapterType: { type: String, enum: ADAPTER_TYPE_VALUES, trim: true, index: true },
  displayName: { type: String, trim: true },
  description: { type: String, trim: true },
  version: { type: String, trim: true, default: 'v1' },
  environment: { type: String, trim: true, default: 'development', index: true },
  baseUrl: { type: String, trim: true },
  endpoints: { type: endpointConfigSchema, default: () => ({}) },
  auth: { type: authConfigSchema, default: () => ({ type: 'none' }) },
  secretsRef: { type: String, trim: true },
  signature: { type: signatureConfigSchema, default: null },
  mappingProfile: { type: mongoose.Schema.Types.Mixed, default: null },
  authType: { type: String, trim: true, default: 'api_key_ref' },
  credentialsRef: { type: String, trim: true },
  webhookSecretRef: { type: String, trim: true },
  isActive: { type: Boolean, default: true, index: true },
  rateLimit: { type: Number, min: 0 },
  timeoutMs: { type: Number, default: 15000, min: 1000 },
  capabilities: [{ type: String, enum: ADAPTER_CAPABILITY_VALUES }],
  fileDrop: { type: fileDropConfigSchema, default: null },
  database: { type: databaseConfigSchema, default: null },
  webhook: { type: webhookConfigSchema, default: null },
  rpa: { type: rpaConfigSchema, default: null },
  humanAssisted: { type: humanAssistedConfigSchema, default: null },
  healthCheck: { type: mongoose.Schema.Types.Mixed, default: null },
  retryPolicy: { type: retryPolicySchema, default: () => ({}) },
  lastHealthCheckAt: Date,
  lastHealthStatus: { type: String, trim: true, default: 'unknown' }
});

IntegrationEndpointSchema.index(
  { departmentCode: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
IntegrationEndpointSchema.index(
  { departmentCode: 1, adapterCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      adapterCode: { $type: 'string' }
    }
  }
);
IntegrationEndpointSchema.index({ departmentCode: 1, isActive: 1 });
IntegrationEndpointSchema.index({ adapterType: 1, isActive: 1 });

module.exports =
  mongoose.models.IntegrationEndpoint ||
  mongoose.model('IntegrationEndpoint', IntegrationEndpointSchema);
