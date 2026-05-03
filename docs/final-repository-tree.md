# Final Repository Tree

## Current-Compatible Structure
```text
.
├── apps/
│   ├── gateway/
│   ├── investor-portal/
│   ├── department-portal/
│   └── public-portal/
├── services/
│   ├── case-service/
│   ├── orchestration-service/
│   ├── adapter-runtime/
│   ├── notification-service/
│   ├── audit-service/
│   └── ai-service/
├── packages/
│   ├── shared/
│   └── ui/
├── web/
├── n8n/
├── infra/
├── docs/
├── scripts/
├── tests/
└── docker-compose.yml
```

The `web/` workspace remains for compatibility with legacy Express/EJS paths while monorepo services and portals continue to mature.

## Target Production Monorepo Structure
```text
.
├── apps/
│   ├── gateway/
│   │   ├── src/
│   │   └── Dockerfile
│   ├── investor-portal/
│   │   ├── src/
│   │   └── Dockerfile
│   ├── department-portal/
│   │   ├── src/
│   │   └── Dockerfile
│   └── public-portal/
│       ├── src/
│       └── Dockerfile
├── services/
│   ├── case-service/
│   │   ├── src/
│   │   └── Dockerfile
│   ├── orchestration-service/
│   │   ├── src/
│   │   └── Dockerfile
│   ├── adapter-runtime/
│   │   ├── src/
│   │   └── Dockerfile
│   ├── notification-service/
│   │   ├── src/
│   │   └── Dockerfile
│   ├── audit-service/
│   │   ├── src/
│   │   └── Dockerfile
│   ├── ai-service/
│   │   ├── app/
│   │   ├── prompts/
│   │   ├── training/
│   │   └── Dockerfile
│   └── ai-advisory-service/
│       └── README.md
├── packages/
│   ├── shared/
│   └── ui/
├── n8n/
│   └── workflows/
├── infra/
│   ├── ci/
│   ├── compose/
│   ├── docker/
│   ├── k8s/
│   ├── monitoring/
│   ├── backup/
│   └── secrets/
├── docs/
│   ├── diagrams/
│   └── runbooks/
├── tests/
│   ├── e2e/
│   ├── contract/
│   ├── performance/
│   ├── security/
│   └── fixtures/
├── scripts/
└── .github/
    └── workflows/
```

## AI Advisory Position
The current implementation exposes AI advisory endpoints inside `services/ai-service`. The `services/ai-advisory-service` entry remains a target extraction point if a separate deployment is later required.
