const POLLUTION_OUTBOUND_PROFILE = {
  profileCode: 'pollution_outbound_v1',
  departmentCode: 'pollution',
  version: 'v1',
  direction: 'outbound',
  fieldMappings: [
    { source: 'application.caseType', target: 'applicationType' },
    { source: 'enterprise.legalName', target: 'industryName' },
    { source: 'departmentSpecific.pollutionCategory', target: 'pollutionCategory' },
    { source: 'project.waterRequirementKld', target: 'waterConsumptionKld' },
    { source: 'departmentSpecific.effluentGenerated', target: 'effluentGenerated' },
    { source: 'departmentSpecific.hazardousWasteGenerated', target: 'hazardousWasteGenerated' },
    { source: 'project.location.district', target: 'siteDistrict' },
    { source: 'documents', target: 'documents' }
  ],
  requiredFields: ['industryName']
};

const POWER_OUTBOUND_PROFILE = {
  profileCode: 'power_outbound_v1',
  departmentCode: 'power',
  version: 'v1',
  direction: 'outbound',
  fieldMappings: [
    { source: 'application.caseType', target: 'serviceType' },
    { source: 'enterprise.legalName', target: 'consumerName' },
    { source: 'departmentSpecific.connectedLoadKw', target: 'connectedLoadKw' },
    { source: 'departmentSpecific.contractDemandKva', target: 'contractDemandKva' },
    { source: 'enterprise.address', target: 'premiseAddress' },
    { source: 'departmentSpecific.transformerRequired', target: 'transformerRequired' },
    { source: 'documents', target: 'documents' }
  ],
  requiredFields: ['consumerName']
};

const FIRE_OUTBOUND_PROFILE = {
  profileCode: 'fire_outbound_v1',
  departmentCode: 'fire',
  version: 'v1',
  direction: 'outbound',
  fieldMappings: [
    { source: 'application.caseType', target: 'nocType' },
    { source: 'project.projectName', target: 'buildingName' },
    { source: 'departmentSpecific.buildingHeightM', target: 'buildingHeightM' },
    { source: 'departmentSpecific.occupancyType', target: 'occupancyType' },
    { source: 'departmentSpecific.flammableStorage', target: 'flammableStorage' },
    { source: 'project.location', target: 'address' },
    { source: 'documents', target: 'documents' }
  ],
  requiredFields: ['buildingName']
};

const INDUSTRIAL_SAFETY_OUTBOUND_PROFILE = {
  profileCode: 'industrial_safety_outbound_v1',
  departmentCode: 'industrial_safety',
  version: 'v1',
  direction: 'outbound',
  fieldMappings: [
    { source: 'application.caseType', target: 'licenseType' },
    { source: 'project.projectName', target: 'factoryName' },
    { source: 'project.employmentExpected', target: 'workersCount' },
    { source: 'departmentSpecific.machineryInstalled', target: 'machineryInstalled' },
    { source: 'departmentSpecific.boilersInstalled', target: 'boilersInstalled' },
    { source: 'departmentSpecific.hazardousProcess', target: 'hazardousProcess' },
    { source: 'project.location', target: 'siteAddress' },
    { source: 'documents', target: 'documents' }
  ],
  requiredFields: ['factoryName']
};

const LABOUR_OUTBOUND_PROFILE = {
  profileCode: 'labour_outbound_v1',
  departmentCode: 'labour',
  version: 'v1',
  direction: 'outbound',
  fieldMappings: [
    { source: 'application.caseType', target: 'registrationType' },
    { source: 'enterprise.legalName', target: 'establishmentName' },
    { source: 'project.employmentExpected', target: 'employeeCount' },
    { source: 'departmentSpecific.contractLabourCount', target: 'contractLabourCount' },
    { source: 'departmentSpecific.interstateMigrantWorkers', target: 'interstateMigrantWorkers' },
    { source: 'enterprise.address', target: 'address' },
    { source: 'documents', target: 'documents' }
  ],
  requiredFields: ['establishmentName']
};

module.exports = {
  POLLUTION_OUTBOUND_PROFILE,
  POWER_OUTBOUND_PROFILE,
  FIRE_OUTBOUND_PROFILE,
  INDUSTRIAL_SAFETY_OUTBOUND_PROFILE,
  LABOUR_OUTBOUND_PROFILE
};
