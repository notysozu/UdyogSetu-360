const WORKFLOW_DEPENDENCIES = Object.freeze([
  {
    key: 'fire_requires_layout_documents',
    sourceDepartment: 'fire',
    targetDepartment: 'fire',
    requiredState: 'documents_ready',
    blocksTransition: ['inspection_scheduled', 'approved', 'certificate_issued'],
    message: 'Fire workflow requires layout plan and fire safety documents before progression.'
  },
  {
    key: 'industrial_safety_requires_factory_details',
    sourceDepartment: 'industrial_safety',
    targetDepartment: 'industrial_safety',
    requiredState: 'factory_details_ready',
    blocksTransition: ['under_review', 'approved'],
    message: 'Industrial safety workflow requires machinery and factory details before review.'
  },
  {
    key: 'labour_requires_employee_data',
    sourceDepartment: 'labour',
    targetDepartment: 'labour',
    requiredState: 'employee_data_ready',
    blocksTransition: ['under_review', 'approved'],
    message: 'Labour workflow requires employee and labour deployment details before review.'
  },
  {
    key: 'certificate_requires_approval',
    sourceDepartment: '*',
    targetDepartment: '*',
    requiredState: 'approved',
    blocksTransition: ['certificate_issued'],
    message: 'Certificate issuance requires an approved task.'
  },
  {
    key: 'closure_requires_finality',
    sourceDepartment: '*',
    targetDepartment: '*',
    requiredState: 'finalized_case',
    blocksTransition: ['closed'],
    message: 'Cases can close only after certificate issuance or final rejection.'
  },
  {
    key: 'fee_paid_requires_fee_demand',
    sourceDepartment: '*',
    targetDepartment: '*',
    requiredState: 'fee_demanded',
    blocksTransition: ['fee_paid'],
    message: 'Fee payment can only be recorded after a fee demand exists.'
  },
  {
    key: 'inspection_completed_requires_schedule',
    sourceDepartment: '*',
    targetDepartment: '*',
    requiredState: 'inspection_scheduled',
    blocksTransition: ['inspection_completed'],
    message: 'Inspection completion can only follow an inspection schedule.'
  }
]);

module.exports = { WORKFLOW_DEPENDENCIES };
