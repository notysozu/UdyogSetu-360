const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectMongo, USER_ROLES, DEPARTMENT_CODES } = require('../../../../packages/shared/src');
const Role = require('../models/Role');
const Department = require('../models/Department');
const User = require('../models/User');
const Organisation = require('../models/Organisation');
const InvestorProfile = require('../models/InvestorProfile');
const Case = require('../models/Case');
const roleRepository = require('../repositories/role.repository');
const departmentRepository = require('../repositories/department.repository');
const { createUser } = require('../services/user.service');
const { createOrganisation } = require('../services/organisation.service');
const caseService = require('../services/case.service');
const projectionService = require('../services/projection.service');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

const DEMO_PASSWORD = 'password123';

const ROLE_SEED = [
  ['investor', 'Investor'],
  ['department_officer', 'Department Officer'],
  ['department_supervisor', 'Department Supervisor'],
  ['nodal_officer', 'Nodal Officer'],
  ['admin', 'Administrator'],
  ['auditor', 'Auditor'],
  ['system', 'System']
];

const DEPARTMENT_SEED = [
  ['pollution', 'Karnataka State Pollution Control Board', 'KSPCB'],
  ['power', 'Bangalore Electricity Supply Company Limited', 'BESCOM'],
  ['fire', 'Karnataka State Fire and Emergency Services', 'FIRE'],
  ['industrial_safety', 'Department of Factories, Boilers, Industrial Safety and Health', 'DISH'],
  ['labour', 'Department of Labour', 'LABOUR']
];

async function upsertRole(code, name) {
  const existing = await Role.findOne({ code, isDeleted: false });
  if (existing) {
    return { record: existing, created: false };
  }
  const record = await roleRepository.create({
    code,
    name,
    description: `${name} role`,
    permissions: [`${code}.access`],
    isSystemRole: code === USER_ROLES.SYSTEM,
    isActive: true,
    metadata: { seeded: true }
  });
  return { record, created: true };
}

async function upsertDepartment(code, name, shortName) {
  const existing = await Department.findOne({ code, isDeleted: false });
  if (existing) {
    return { record: existing, created: false };
  }
  const record = await departmentRepository.create({
    code,
    name,
    shortName,
    description: `${name} pilot department`,
    departmentFamily: code,
    integrationMode: 'rest_api',
    isActive: true,
    slaDefaults: [{ taskType: 'other', dueInHours: 72, warningBeforeHours: 24 }],
    metadata: { seeded: true }
  });
  return { record, created: true };
}

async function upsertUser(input, context) {
  const existing = await User.findOne({ email: input.email.toLowerCase(), isDeleted: false });
  if (existing) {
    return { record: existing, created: false };
  }
  const record = await createUser(input, context);
  return { record, created: true };
}

async function upsertOrganisation(input, context) {
  const existing = await Organisation.findOne({ gstin: input.gstin, isDeleted: false });
  if (existing) {
    return { record: existing, created: false };
  }
  const record = await createOrganisation(input, context);
  return { record, created: true };
}

async function ensureInvestorProfile(userId, organisationId) {
  const existing = await InvestorProfile.findOne({ userId, isDeleted: false });
  if (existing) {
    return { record: existing, created: false };
  }
  const record = await InvestorProfile.create({
    userId,
    organisationId,
    investorType: 'promoter',
    designation: 'Managing Director',
    kycStatus: 'verified',
    preferredLanguage: 'en',
    notificationPreferences: { email: true, sms: false },
    metadata: { seeded: true }
  });
  return { record, created: true };
}

async function ensureCase(universalCaseId, buildInput, submit, context) {
  const existing = await Case.findOne({ universalCaseId, isDeleted: false });
  if (existing) {
    return { record: existing, created: false };
  }
  const draft = await caseService.createDraftCase(
    {
      ...buildInput(),
      universalCaseId
    },
    context
  );
  let record = draft;
  if (submit) {
    record = await caseService.submitCase(draft.id, context);
  }
  return { record, created: true };
}

async function seedDomain() {
  const mongoUri =
    process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360';
  await connectMongo(mongoUri);

  const logs = [];
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const systemContext = {
    correlationId: 'domain-seed-correlation',
    actor: { actorType: 'system', actorId: 'domain-seed', role: 'system', displayName: 'Domain Seed' }
  };

  for (const [code, name] of ROLE_SEED) {
    const { created } = await upsertRole(code, name);
    logs.push(`${created ? 'created' : 'skipped'} role:${code}`);
  }

  const seededDepartments = {};
  for (const [code, name, shortName] of DEPARTMENT_SEED) {
    const { record, created } = await upsertDepartment(code, name, shortName);
    seededDepartments[code] = record;
    logs.push(`${created ? 'created' : 'skipped'} department:${code}`);
  }

  const { record: organisation, created: organisationCreated } = await upsertOrganisation(
    {
      legalName: 'Setu Manufacturing Private Limited',
      tradeName: 'Setu Manufacturing',
      organisationType: 'private_limited',
      gstin: '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      udyamNumber: 'UDYAM-KR-00-0000001',
      registrationNumber: 'CIN-U12345KA2026PTC000001',
      status: 'active',
      contactEmail: 'contact@setumanufacturing.local',
      contactPhone: '9876543210',
      address: {
        line1: 'Plot 42, Industrial Area',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '560001'
      },
      metadata: { seeded: true }
    },
    systemContext
  );
  logs.push(`${organisationCreated ? 'created' : 'skipped'} organisation:${organisation.legalName}`);

  const investorUser = await upsertUser(
    {
      name: 'Asha Investor',
      email: 'investor@udyogsetu.local',
      passwordHash,
      roles: ['investor'],
      primaryRole: 'investor',
      organisationId: organisation._id,
      status: 'active',
      locale: 'en-IN',
      timezone: 'Asia/Kolkata'
    },
    systemContext
  );
  logs.push(`${investorUser.created ? 'created' : 'skipped'} user:investor@udyogsetu.local`);

  const investorProfile = await ensureInvestorProfile(investorUser.record._id, organisation._id);
  logs.push(`${investorProfile.created ? 'created' : 'skipped'} investor-profile:${investorUser.record.email}`);

  await User.updateOne(
    { _id: investorUser.record._id },
    { $set: { investorId: investorProfile.record._id } }
  );

  const officerConfigs = [
    ['officer.pollution@udyogsetu.local', 'Pollution Officer', 'pollution'],
    ['officer.power@udyogsetu.local', 'Power Officer', 'power'],
    ['officer.fire@udyogsetu.local', 'Fire Officer', 'fire'],
    ['officer.industrial@udyogsetu.local', 'Industrial Safety Officer', 'industrial_safety'],
    ['officer.labour@udyogsetu.local', 'Labour Officer', 'labour']
  ];

  for (const [email, name, departmentCode] of officerConfigs) {
    const result = await upsertUser(
      {
        name,
        email,
        passwordHash,
        roles: ['department_officer'],
        primaryRole: 'department_officer',
        departmentId: seededDepartments[departmentCode]._id,
        status: 'active',
        locale: 'en-IN',
        timezone: 'Asia/Kolkata'
      },
      systemContext
    );
    logs.push(`${result.created ? 'created' : 'skipped'} user:${email}`);
  }

  for (const [email, name, role] of [
    ['admin@udyogsetu.local', 'Platform Admin', 'admin'],
    ['auditor@udyogsetu.local', 'Audit Officer', 'auditor']
  ]) {
    const result = await upsertUser(
      {
        name,
        email,
        passwordHash,
        roles: [role],
        primaryRole: role,
        status: 'active',
        locale: 'en-IN',
        timezone: 'Asia/Kolkata'
      },
      systemContext
    );
    logs.push(`${result.created ? 'created' : 'skipped'} user:${email}`);
  }

  const baseCaseInput = () => ({
    sourceSystem: 'single_window_system',
    organisationId: organisation._id,
    investorId: investorProfile.record._id,
    applicantUserId: investorUser.record._id,
    caseType: 'common_application',
    title: 'Setu Manufacturing Unified Approval Application',
    description: 'Pilot manufacturing unit requiring unified clearances.',
    requiredDepartments: Object.values(DEPARTMENT_CODES).map((departmentCode) => ({
      departmentCode,
      reason: 'Pilot unified governance flow',
      requiredApprovalType: 'other',
      isMandatory: true
    })),
    aiInsights: {
      delayRiskScore: 0.31,
      routeRecommendation: Object.values(DEPARTMENT_CODES),
      summary: 'All five pilot departments are required.',
      lastAnalysedAt: new Date()
    },
    metadata: { seeded: true }
  });

  const draftCase = await ensureCase('US360-DEMO-DRAFT-0001', baseCaseInput, false, systemContext);
  logs.push(`${draftCase.created ? 'created' : 'skipped'} case:US360-DEMO-DRAFT-0001`);

  const submittedCase = await ensureCase('US360-DEMO-SUBMITTED-0001', baseCaseInput, true, systemContext);
  logs.push(`${submittedCase.created ? 'created' : 'skipped'} case:US360-DEMO-SUBMITTED-0001`);

  await projectionService.upsertCaseProjection(draftCase.record, [], {
    organisationName: organisation.legalName,
    applicantName: investorUser.record.name
  });

  await recordAuditEvent(
    {
      actor: { actorType: 'system', actorId: 'domain-seed', role: 'system', displayName: 'Domain Seed' },
      action: 'created',
      resourceType: 'case',
      resourceId: String(draftCase.record._id),
      universalCaseId: draftCase.record.universalCaseId,
      correlationId: systemContext.correlationId,
      after: { status: draftCase.record.status }
    },
    systemContext
  );
  await recordAuditEvent(
    {
      actor: { actorType: 'system', actorId: 'domain-seed', role: 'system', displayName: 'Domain Seed' },
      action: 'submitted',
      resourceType: 'case',
      resourceId: String(submittedCase.record._id),
      universalCaseId: submittedCase.record.universalCaseId,
      correlationId: systemContext.correlationId,
      after: { status: submittedCase.record.status }
    },
    systemContext
  );

  logs.forEach((line) => console.log(line));
  console.log(`Domain seed completed. Demo password for seeded users: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

seedDomain().catch(async (error) => {
  console.error('Domain seed failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
