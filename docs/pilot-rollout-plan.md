# Pilot Rollout Plan

## Pilot Departments
| Department | Current integration assumption | Pilot adapter type | Data required | Callback method | Roles |
|---|---|---|---|---|---|
| pollution | Consent and pollution control checks may start through mock or sandbox APIs. | REST/mock adapter | application, project report, pollution control document | signed webhook | officer, supervisor |
| power | Load and connection approval may use sandbox or human-assisted adapter. | REST/human-assisted | load, land document, fee data | signed webhook or batch status | officer, supervisor |
| fire | Fire NOC and inspection workflows need schedule and result callbacks. | REST/mock adapter | layout plan, fire safety plan, inspection data | signed webhook | officer, supervisor |
| industrial_safety | Factory safety and boiler/hazard checks may require staged integration. | human-assisted/mock adapter | machinery, boiler and hazardous process data | webhook or manual callback capture | officer, supervisor |
| labour | Labour registration and workforce thresholds can start with mock/sandbox. | REST/mock adapter | workers count, labour document, establishment details | signed webhook | officer, supervisor |

## Department Test Scenarios
- Southbound application dispatch.
- Acknowledgement capture and external reference storage.
- Document push or reference handoff.
- Status callback.
- Query callback.
- Inspection callback where applicable.
- Fee demand/payment status where applicable.
- Approval/rejection/certificate callback where applicable.
- Retry and dead-letter recovery.

## Rollback Plan
- Disable department adapter config.
- Pause outbound RabbitMQ workers.
- Keep imported pilot cases read-only if needed.
- Continue SWS/manual department processing.
- Record rollback audit event.
- Export affected case/timeline data for reconciliation.

## Pilot Acceptance Criteria
- Pilot cases submit and route correctly.
- Department acknowledgements reconcile.
- Callbacks update tasks only through Node orchestration.
- Audit events exist for all privileged actions.
- No unauthorised department access.
- Queue backlog remains stable.
- Public dashboard exposes no PII.

## Phases
### Phase 0: Discovery And Mapping
Entry criteria: department owners nominated and pilot scope approved.
Activities: map fields, statuses, documents, callbacks, test users and fallback process.
Exit criteria: signed mapping sheet and adapter mode chosen.
Risks: incomplete department data dictionary.
Rollback strategy: remain in documentation-only mode.

### Phase 1: Mock Adapter Validation
Entry criteria: canonical mappings drafted.
Activities: run mock adapters, seed demo cases, execute contract and E2E paths.
Exit criteria: mock flow passes for all five departments.
Risks: canonical model gaps.
Rollback strategy: adjust mock mappings before external connection.

### Phase 2: Department Sandbox Integration
Entry criteria: sandbox credentials and webhook URLs ready.
Activities: connect adapters, verify signatures, run southbound/northbound callbacks.
Exit criteria: sandbox callbacks reconcile without manual DB changes.
Risks: callback shape drift.
Rollback strategy: switch pilot adapter back to mock.

### Phase 3: Parallel Run
Entry criteria: sandbox flows stable.
Activities: process selected cases in UdyogSetu while existing process remains authoritative.
Exit criteria: status and audit reconciliation accepted by departments.
Risks: duplicate notifications.
Rollback strategy: disable outward notifications and continue shadow processing.

### Phase 4: Controlled Pilot With Selected Cases
Entry criteria: parallel run accepted.
Activities: enable pilot cases, run daily monitoring, collect officer/investor feedback.
Exit criteria: pilot success criteria met for agreed period.
Risks: operational backlog or integration outage.
Rollback strategy: pause adapters and return affected cases to manual path.

### Phase 5: Review And Scale Decision
Entry criteria: pilot metrics and audit exports available.
Activities: review throughput, failures, support load, data quality and stakeholder feedback.
Exit criteria: scale, extend pilot or remediate decision recorded.
Risks: unresolved policy or integration ownership gaps.
Rollback strategy: keep pilot contained and do not onboard new departments.
