# Communication and Grievance Checklist

- [x] In-app notifications work
- [x] Email provider abstraction exists
- [x] SMS provider abstraction exists
- [x] Templates and rendering service exist
- [x] Reminder service and dispatch job exist
- [x] Escalation policy/service exists
- [x] Grievance creation, acknowledge, assign, resolve, close, reopen, escalate exist
- [x] Internal comments and external replies are separated
- [x] Status history updates on transitions
- [x] SLA warning and breach evaluation exist
- [x] Overdue escalation flow exists
- [x] Approval/grievance ageing endpoints exist
- [x] API routes for notifications/grievances/SLA exist
- [x] EJS views for investor + department grievance and SLA dashboards exist
- [x] Seed script added (`npm run seed:communication`)
- [x] Events and audit hooks added for important actions
- [x] Existing portals/routes preserved with compatibility wiring

## Manual Flow
1. `npm run seed:communication`
2. Open `/notifications` as investor and mark read.
3. Open `/grievances/new`, submit, then add message.
4. Open `/department/grievances` as department user.
5. Acknowledge, comment internally, reply externally.
6. Resolve and close with required reasons.
7. Open `/department/sla` and `/department/grievances/ageing`.
8. Trigger SLA evaluation and verify warning/breach/escalation behavior.
