# Security Tests

Security checks should include:
- dependency audit
- secret scanning
- auth and access-control negative tests
- header and CORS checks
- webhook signature checks
- document permission checks
- public dashboard privacy checks

Run placeholders:
```bash
node --test tests/security/*.test.js
```
