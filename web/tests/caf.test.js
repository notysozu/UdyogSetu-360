const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const {
  sanitizeInput,
  createDraftSchema,
  finalSubmitSchema
} = require('../src/validators/caf.validators');
const {
  calculateApprovalTracks
} = require('../src/services/approval-track.service');
const {
  buildDuplicateDetectionService
} = require('../src/services/duplicate-detection.service');
const { buildCafService } = require('../src/services/caf.service');

const originalStartSession = mongoose.startSession;

test.afterEach(() => {
  mongoose.startSession = originalStartSession;
});

function buildValidCafData() {
  return sanitizeInput({
    enterprise: {
      legalName: 'Setu Manufacturing Private Limited',
      organisationType: 'private_limited',
      contactEmail: 'contact@setu.example',
      contactPhone: '9876543210',
      district: 'Bengaluru Urban',
      pan: 'ABCDE1234F',
      gstin: '29ABCDE1234F1Z5',
      authorisedSignatoryName: 'Asha Investor',
      authorisedSignatoryEmail: 'asha@example.com'
    },
    project: {
      projectName: 'Integrated Industrial Unit',
      projectType: 'new_unit',
      sector: 'manufacturing',
      investmentAmount: 25000000,
      employmentExpected: 125,
      projectAddress: 'Plot 42, Industrial Area',
      projectDistrict: 'Bengaluru Urban',
      projectTaluk: 'Anekal',
      projectPincode: '560100',
      landAreaSqM: 2000,
      powerRequirementKw: 450,
      waterRequirementKld: 10,
      hazardousProcess: true,
      projectDescription: 'Integrated unit',
      proposedStartDate: '2026-06-01',
      proposedCommercialOperationDate: '2027-01-01'
    },
    environment: {
      pollutionCategory: 'red',
      effluentGenerated: true,
      emissionsGenerated: true,
      hazardousWasteGenerated: true
    },
    power: {
      connectedLoadKw: 320,
      contractDemandKva: 500,
      transformerRequired: true
    },
    fire: {
      fireNocRequired: true,
      buildingHeightM: 18,
      occupancyType: 'industrial',
      storageOfFlammables: true
    },
    industrialSafety: {
      factoryLicenseRequired: true,
      machineryInstalled: true,
      pressureVessels: true,
      boilers: true
    },
    labour: {
      employeeCount: 125,
      contractLabourCount: 12,
      interstateMigrantWorkers: true,
      labourRegistrationRequired: true
    },
    attachments: [
      { documentType: 'project_report', title: 'Project report', fileName: 'project-report.pdf', objectKey: 'draft/project-report.pdf', checksum: 'abc123' },
      { documentType: 'pollution_control_documents', title: 'Pollution pack', fileName: 'pollution.pdf', objectKey: 'draft/pollution.pdf', checksum: 'def456' },
      { documentType: 'fire_safety_plan', title: 'Fire plan', fileName: 'fire-plan.pdf', objectKey: 'draft/fire-plan.pdf', checksum: 'ghi789' },
      { documentType: 'layout_plan', title: 'Layout plan', fileName: 'layout.pdf', objectKey: 'draft/layout.pdf', checksum: 'jkl012' },
      { documentType: 'factory_safety_documents', title: 'Safety pack', fileName: 'safety.pdf', objectKey: 'draft/safety.pdf', checksum: 'mno345' },
      { documentType: 'labour_documents', title: 'Labour docs', fileName: 'labour.pdf', objectKey: 'draft/labour.pdf', checksum: 'pqr678' }
    ]
  });
}

function makeCaseDoc(overrides = {}) {
  const doc = {
    caseId: 'US360-20260501-12345',
    universalCaseId: null,
    createdBy: 'user-1',
    applicantUserId: 'user-1',
    status: 'draft',
    caseType: 'combined_application_form',
    title: 'Integrated Industrial Unit',
    description: 'Integrated unit',
    cafData: buildValidCafData(),
    amendmentHistory: [],
    resubmissionHistory: [],
    submissionIdempotencyKeys: [],
    metadata: {},
    requiredDepartments: [],
    approvalTracks: [],
    acknowledgemenent: null,
    toObject() {
      return JSON.parse(JSON.stringify({ ...this, toObject: undefined }));
    }
  };

  return Object.assign(doc, overrides);
}

test('draft can save with minimal data', () => {
  const result = createDraftSchema({
    enterprise: { legalName: 'Setu Manufacturing' }
  });
  assert.equal(result.valid, true);
});

test('final submit fails when required fields are missing', () => {
  const result = finalSubmitSchema({ enterprise: { legalName: 'Setu' }, project: {} }, []);
  assert.equal(result.valid, false);
  assert.ok(result.errors['project.projectName']);
  assert.ok(result.errors['enterprise.contactEmail']);
});

test('PAN and GSTIN validation works', () => {
  const result = finalSubmitSchema(
    {
      enterprise: {
        legalName: 'Setu',
        organisationType: 'private_limited',
        contactEmail: 'contact@example.com',
        contactPhone: '9876543210',
        district: 'Bengaluru',
        authorisedSignatoryName: 'Asha',
        authorisedSignatoryEmail: 'asha@example.com',
        pan: 'BADPAN',
        gstin: 'BADGSTIN'
      },
      project: {
        projectName: 'Project',
        projectType: 'new_unit',
        sector: 'manufacturing',
        investmentAmount: 1,
        employmentExpected: 1,
        projectAddress: 'Address',
        projectDistrict: 'Bengaluru',
        projectTaluk: 'Anekal',
        projectPincode: '560100',
        landAreaSqM: 1,
        powerRequirementKw: 1
      },
      labour: { employeeCount: 1 }
    },
    []
  );

  assert.ok(result.errors['enterprise.pan']);
  assert.ok(result.errors['enterprise.gstin']);
});

test('numeric validation works', () => {
  const data = buildValidCafData();
  data.project.investmentAmount = -10;
  const result = finalSubmitSchema(data, []);
  assert.ok(result.errors['project.investmentAmount']);
});

test('protected fields are ignored during sanitisation', () => {
  const result = sanitizeInput({
    status: 'approved',
    universalCaseId: 'SHOULD-NOT-STICK',
    enterprise: { legalName: 'Setu' }
  });

  assert.equal(result.status, undefined);
  assert.equal(result.universalCaseId, undefined);
  assert.equal(result.enterprise.legalName, 'Setu');
});

test('all five approval tracks are created for a full industrial project', () => {
  const result = calculateApprovalTracks(buildValidCafData());
  assert.equal(result.approvalTracks.length, 5);
  assert.deepEqual(
    result.approvalTracks.map((item) => item.departmentCode).sort(),
    ['fire', 'industrial_safety', 'labour', 'pollution', 'power']
  );
});

test('duplicate detection blocks same source reference', async () => {
  const service = buildDuplicateDetectionService({
    caseRepository: {
      findPotentialDuplicates: async () => [
        makeCaseDoc({ sourceSystem: 'sws_portal', sourceReferenceId: 'SRC-001' })
      ]
    }
  });

  const result = await service.checkDuplicate(
    {
      ...buildValidCafData(),
      sourceSystem: 'sws_portal',
      sourceReferenceId: 'SRC-001'
    },
    { user: { id: 'user-1' } }
  );

  assert.equal(result.blocking, true);
  assert.equal(result.isDuplicate, true);
});

test('duplicate detection warns for similar project and district', async () => {
  const service = buildDuplicateDetectionService({
    caseRepository: {
      findPotentialDuplicates: async () => [
        makeCaseDoc()
      ]
    }
  });

  const result = await service.checkDuplicate(buildValidCafData(), { user: { id: 'user-1' } });
  assert.equal(result.isDuplicate, true);
  assert.equal(result.blocking, false);
});

test('submission generates universal case ID, tasks, events, audits, and acknowledgement', async () => {
  const state = {
    caseDoc: makeCaseDoc(),
    tasks: [],
    events: [],
    audits: []
  };

  mongoose.startSession = async () => ({
    withTransaction: async (fn) => fn(),
    endSession: async () => {}
  });

  const service = buildCafService({
    caseRepository: {
      findById: async () => state.caseDoc,
      markSubmitted: async (_caseId, patch) => {
        Object.assign(state.caseDoc, patch);
        return state.caseDoc;
      }
    },
    approvalTaskRepository: {
      createMany: async (tasks) => {
        state.tasks.push(...tasks.map((task, index) => ({ _id: `task-${index + 1}`, ...task })));
        return state.tasks;
      },
      findByCaseId: async () => state.tasks
    },
    documentRepository: {
      findByCaseId: async () => state.caseDoc.cafData.attachments.map((item, index) => ({ _id: `doc-${index + 1}`, ...item })),
      findRequiredByCaseId: async (_caseId, requiredTypes) =>
        state.caseDoc.cafData.attachments.filter((item) => requiredTypes.includes(item.documentType))
    },
    domainEventRepository: {
      append: async (event) => state.events.push(event),
      appendMany: async (events) => state.events.push(...events)
    },
    auditEventRepository: {
      append: async (audit) => state.audits.push(audit)
    },
    duplicateDetectionService: {
      checkDuplicate: async () => ({ isDuplicate: false, confidence: 0, matchedCases: [], reasons: [], blocking: false })
    },
    generateUniversalCaseId: async () => 'US360-KA-2026-000001',
    attachmentService: {
      attachDocumentMetadata: async () => [],
      validateRequiredAttachments: async () => ({ valid: true, missing: [], documents: [] })
    }
  });

  const result = await service.submitCase(state.caseDoc.caseId, {}, {
    user: { id: 'user-1', _id: 'user-1', primaryRole: 'investor' },
    correlationId: 'corr-1',
    requestId: 'req-1',
    idempotencyKey: 'submit-key-1'
  });

  assert.equal(result.caseDoc.status, 'submitted');
  assert.match(result.caseDoc.universalCaseId, /^US360-KA-\d{4}-\d{6}$/);
  assert.equal(result.tasks.length, 5);
  assert.ok(state.events.some((event) => event.eventName === 'case.submitted.v1'));
  assert.ok(state.events.some((event) => event.eventName === 'acknowledgement.generated.v1'));
  assert.ok(state.audits.some((audit) => audit.action === 'case.submitted'));
  assert.ok(result.acknowledgement.acknowledgementNumber.startsWith('ACK-US360-KA-'));
});

test('duplicate idempotent submit does not duplicate tasks', async () => {
  const caseDoc = makeCaseDoc({
    status: 'submitted',
    universalCaseId: 'US360-KA-2026-000001',
    submissionIdempotencyKeys: ['submit-key-1'],
    acknowledgement: { acknowledgementNumber: 'ACK-US360-KA-2026-000001' }
  });

  const service = buildCafService({
    caseRepository: { findById: async () => caseDoc },
    approvalTaskRepository: { findByCaseId: async () => [{ _id: 'task-1', departmentCode: 'pollution' }] }
  });

  const result = await service.submitCase(caseDoc.caseId, {}, {
    user: { id: 'user-1', _id: 'user-1' },
    idempotencyKey: 'submit-key-1'
  });

  assert.equal(result.replayed, true);
  assert.equal(result.tasks.length, 1);
});

test('amendment history is added and amendment event is created', async () => {
  const state = { caseDoc: makeCaseDoc({ status: 'submitted' }), events: [], audits: [] };
  const service = buildCafService({
    caseRepository: {
      findById: async () => state.caseDoc,
      updateDraft: async (_caseId, patch) => {
        Object.assign(state.caseDoc, patch);
        return state.caseDoc;
      }
    },
    domainEventRepository: { append: async (event) => state.events.push(event) },
    auditEventRepository: { append: async (audit) => state.audits.push(audit) }
  });

  const result = await service.amendCase(
    state.caseDoc.caseId,
    { reason: 'Corrected project district', project: { projectDistrict: 'Mysuru' } },
    { user: { id: 'user-1', _id: 'user-1' } }
  );

  assert.equal(result.caseDoc.amendmentHistory.length, 1);
  assert.ok(state.events.some((event) => event.eventName === 'case.amended.v1'));
});

test('resubmission is allowed only for valid statuses and emits event', async () => {
  const state = { caseDoc: makeCaseDoc({ status: 'query_raised' }), events: [], audits: [] };
  const service = buildCafService({
    caseRepository: {
      findById: async () => state.caseDoc,
      updateDraft: async (_caseId, patch) => {
        Object.assign(state.caseDoc, patch);
        return state.caseDoc;
      }
    },
    domainEventRepository: { append: async (event) => state.events.push(event) },
    auditEventRepository: { append: async (audit) => state.audits.push(audit) }
  });

  const result = await service.resubmitCase(
    state.caseDoc.caseId,
    { reason: 'Responded to query', changedFields: ['project.projectDescription'] },
    { user: { id: 'user-1', _id: 'user-1' } }
  );

  assert.equal(result.caseDoc.status, 'response_submitted');
  assert.ok(state.events.some((event) => event.eventName === 'case.resubmitted.v1'));
});
