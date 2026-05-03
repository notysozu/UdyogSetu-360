# Demo Data Plan

## Demo Users
The demo seed creates:
- `investor@udyogsetu.local`
- `officer.pollution@udyogsetu.local`
- `officer.power@udyogsetu.local`
- `officer.fire@udyogsetu.local`
- `officer.industrial@udyogsetu.local`
- `officer.labour@udyogsetu.local`
- `supervisor.pollution@udyogsetu.local`
- `supervisor.power@udyogsetu.local`
- `supervisor.fire@udyogsetu.local`
- `supervisor.industrial@udyogsetu.local`
- `supervisor.labour@udyogsetu.local`
- `nodal@udyogsetu.local`
- `admin@udyogsetu.local`
- `auditor@udyogsetu.local`
- `system@udyogsetu.local`

Demo-only password: `password123`.

The script must be explicitly enabled with `DEMO_SEED_ENABLED=true` and must not run automatically in production.

## Demo Cases
The demo case seed covers:
1. Draft CAF case.
2. Submitted manufacturing case with universal case ID.
3. Case with five department tasks.
4. Case with pollution query raised.
5. Case with fire inspection scheduled.
6. Case with power fee demanded.
7. Case with labour approval.
8. Case with certificate issued.
9. Case with grievance open.
10. Case with SLA warning/breach example.

Sample IDs:
- `US360-KA-2026-000001`
- `US360-KA-2026-000002`
- `US360-KA-2026-000003`

## Commands
```bash
DEMO_SEED_ENABLED=true node scripts/seed-demo-users.js
DEMO_SEED_ENABLED=true node scripts/seed-demo-cases.js
DEMO_SEED_ENABLED=true node scripts/seed-pilot-departments.js
```
