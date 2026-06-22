# Emitia ERP — Estructura monorepo objetivo

```
emitia/
├── apps/
│   ├── web/                 # Next.js 15 — panel + landing (actual nextjs_space)
│   ├── admin/               # Super Admin SaaS (futuro)
│   ├── portal-client/       # Portal clientes B2B
│   └── mobile/              # Flutter (repo separado recomendado)
├── packages/
│   ├── ui/                  # Shadcn + design system Emitia
│   ├── database/            # Prisma schema + client
│   ├── auth/                # JWT, MFA, RBAC helpers
│   ├── fiscal-ar/           # SDK ARCA (WSAA, WSFE, padron)
│   ├── types/               # TypeScript shared types
│   └── config/              # ESLint, TSConfig compartidos
├── services/                # NestJS (fase 2)
│   ├── api-gateway/
│   ├── auth-service/
│   ├── fiscal-service/
│   ├── sales-service/
│   ├── inventory-service/
│   └── notification-service/
├── infra/
│   ├── docker/
│   ├── k8s/
│   └── terraform/
├── docs/
└── docker-compose.dev.yml
```

## Migración desde repo actual

1. Renombrar `erp_system/nextjs_space` → `apps/web`
2. Extraer `lib/afip` → `packages/fiscal-ar`
3. Mover `prisma/` → `packages/database`
4. Mantener API Routes en Fase 1; extraer a NestJS por dominio en Fase 2
