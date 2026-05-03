const DEFAULT_SLA_DAYS = {
  pollution: 30,
  power: 21,
  fire: 15,
  industrial_safety: 30,
  labour: 15
};

function unique(array) {
  return [...new Set(array)];
}

function buildTrack(departmentCode, taskType, title, reason, extra = {}) {
  return {
    departmentCode,
    taskType,
    title,
    slaDays: DEFAULT_SLA_DAYS[departmentCode] || 15,
    explanation: reason,
    requiredAttachments: extra.requiredAttachments || [],
    isMandatory: extra.isMandatory !== false
  };
}

function calculateApprovalTracks(cafData = {}) {
  const requiredDepartments = [];
  const approvalTracks = [];
  const requiredAttachments = ['project_report'];
  const explanations = [];

  const project = cafData.project || {};
  const environment = cafData.environment || {};
  const power = cafData.power || {};
  const fire = cafData.fire || {};
  const industrialSafety = cafData.industrialSafety || {};
  const labour = cafData.labour || {};

  const pollutionNeeded =
    ['red', 'orange', 'green'].includes(environment.pollutionCategory) ||
    environment.effluentGenerated ||
    environment.emissionsGenerated ||
    environment.hazardousWasteGenerated ||
    (project.waterRequirementKld || 0) > 5;

  if (pollutionNeeded) {
    const reason = 'Pollution consent required because environmental discharge or category data is declared.';
    requiredDepartments.push({
      departmentCode: 'pollution',
      reason,
      requiredApprovalType: 'consent',
      isMandatory: true
    });
    approvalTracks.push(
      buildTrack('pollution', 'consent', 'Pollution Consent Review', reason, {
        requiredAttachments: ['pollution_control_documents']
      })
    );
    requiredAttachments.push('pollution_control_documents');
    explanations.push(reason);
  }

  const powerNeeded =
    (project.powerRequirementKw || 0) > 0 ||
    (power.connectedLoadKw || 0) > 0 ||
    (power.contractDemandKva || 0) > 0 ||
    power.transformerRequired;

  if (powerNeeded) {
    const reason = 'Power connection approval required because electrical load or transformer details are declared.';
    requiredDepartments.push({
      departmentCode: 'power',
      reason,
      requiredApprovalType: 'power_connection',
      isMandatory: true
    });
    approvalTracks.push(
      buildTrack('power', 'power_connection', 'Power Connection Review', reason)
    );
    explanations.push(reason);
  }

  const fireNeeded =
    fire.fireNocRequired ||
    (fire.buildingHeightM || 0) >= 15 ||
    fire.storageOfFlammables ||
    ['industrial', 'warehouse', 'public'].includes(fire.occupancyType);

  if (fireNeeded) {
    const reason = 'Fire NOC required because occupancy, height, or flammable storage criteria are met.';
    requiredDepartments.push({
      departmentCode: 'fire',
      reason,
      requiredApprovalType: 'fire_noc',
      isMandatory: true
    });
    approvalTracks.push(
      buildTrack('fire', 'fire_noc', 'Fire Safety Review', reason, {
        requiredAttachments: ['fire_safety_plan', 'layout_plan']
      })
    );
    requiredAttachments.push('fire_safety_plan', 'layout_plan');
    explanations.push(reason);
  }

  const industrialSafetyNeeded =
    industrialSafety.factoryLicenseRequired ||
    industrialSafety.machineryInstalled ||
    industrialSafety.boilers ||
    industrialSafety.pressureVessels ||
    project.hazardousProcess ||
    (labour.employeeCount || 0) >= 10;

  if (industrialSafetyNeeded) {
    const reason = 'Industrial safety clearance required because machinery, boilers, hazardous process, or workforce thresholds are met.';
    requiredDepartments.push({
      departmentCode: 'industrial_safety',
      reason,
      requiredApprovalType: 'factory_license',
      isMandatory: true
    });
    approvalTracks.push(
      buildTrack(
        'industrial_safety',
        'factory_license',
        'Industrial Safety and Factory Licence Review',
        reason,
        { requiredAttachments: ['factory_safety_documents'] }
      )
    );
    requiredAttachments.push('factory_safety_documents');
    explanations.push(reason);
  }

  const labourNeeded =
    (labour.employeeCount || 0) >= 10 ||
    (labour.contractLabourCount || 0) > 0 ||
    labour.interstateMigrantWorkers ||
    labour.shopsEstablishmentRequired ||
    labour.labourRegistrationRequired;

  if (labourNeeded) {
    const reason = 'Labour registration required because workforce and labour deployment thresholds are declared.';
    requiredDepartments.push({
      departmentCode: 'labour',
      reason,
      requiredApprovalType: 'labour_registration',
      isMandatory: true
    });
    approvalTracks.push(
      buildTrack('labour', 'labour_registration', 'Labour Registration Review', reason, {
        requiredAttachments: ['labour_documents']
      })
    );
    requiredAttachments.push('labour_documents');
    explanations.push(reason);
  }

  return {
    requiredDepartments,
    approvalTracks,
    requiredAttachments: unique(requiredAttachments),
    explanations,
    slaDefaults: { ...DEFAULT_SLA_DAYS }
  };
}

function getRequiredAttachments(approvalTracks = []) {
  return unique(
    approvalTracks.flatMap((track) => track.requiredAttachments || []).concat(['project_report'])
  );
}

function buildInitialTasks(caseDoc, approvalTracks = [], context = {}) {
  const now = new Date();

  return approvalTracks.map((track) => {
    const dueAt = new Date(now.getTime() + track.slaDays * 24 * 60 * 60 * 1000);
    const warningAt = new Date(now.getTime() + Math.floor(track.slaDays * 0.8) * 24 * 60 * 60 * 1000);

    return {
      caseId: caseDoc.caseId,
      universalCaseId: caseDoc.universalCaseId || null,
      departmentCode: track.departmentCode,
      taskType: track.taskType,
      title: track.title,
      status: 'pending',
      priority: caseDoc.priority || 'normal',
      checklist: [
        {
          code: 'initial_scrutiny',
          label: 'Initial scrutiny completed',
          required: true,
          status: 'pending'
        },
        {
          code: 'required_documents',
          label: 'Required documents verified',
          required: true,
          status: 'pending'
        }
      ],
      dueAt,
      warningAt,
      correlationId: context.correlationId || caseDoc.correlationId || null,
      metadata: {
        reason: track.explanation,
        requiredAttachments: track.requiredAttachments || []
      }
    };
  });
}

module.exports = {
  DEFAULT_SLA_DAYS,
  calculateApprovalTracks,
  getRequiredAttachments,
  buildInitialTasks
};
