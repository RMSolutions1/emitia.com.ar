# Emitia ERP — Arquitectura Cloud (v2.0)

> Decisión ejecutiva del equipo: **Marca = Emitia ERP** · Holding = Grupo Emprenor  
> Posicionamiento: *ERP Cloud fiscal-first para Argentina y LatAm*

## 1. Visión

Emitia ERP es una plataforma SaaS multi-tenant modular que unifica facturación ARCA, ventas, compras, stock, tesorería, contabilidad, CRM, ecommerce e IA en un único producto escalable.

### Principios

| Principio | Implementación |
|-----------|----------------|
| Fiscal-first | ARCA/AFIP como núcleo, no add-on |
| Multi-tenant estricto | Aislamiento por `tenantId` / `companyId` en todas las capas |
| Modular | Dominios desacoplados, activables por plan |
| API-first | REST + GraphQL + Webhooks + SDK |
| Evolutivo | Migración desde monolito Next.js actual sin reescritura big-bang |

## 2. Stack objetivo

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENTES                                                    │
│  Web (Next.js 15) · Mobile (Flutter) · Portales B2B         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────────┐
│  EDGE — Cloudflare (CDN, WAF, Rate Limit, DDoS)             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  API GATEWAY — Kong / AWS ALB                                │
│  Auth JWT · Tenant resolution · Request tracing              │
└───────┬─────────────────────────────┬───────────────────────┘
        │                             │
┌───────▼──────────┐         ┌────────▼─────────┐
│  BFF / Web App   │         │  NestJS Services │
│  Next.js 15      │         │  (modular)       │
│  App Router      │         │                  │
└───────┬──────────┘         └────────┬─────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼───┐      ┌───────▼──────┐    ┌──────▼──────┐
│Postgres│      │    Redis     │    │  RabbitMQ   │
│  RLS   │      │ cache/queue  │    │  events     │
└────────┘      └──────────────┘    └─────────────┘
                       │
                ┌──────▼──────┐
                │  S3 / MinIO │
                │  documentos │
                └─────────────┘
```

### Fase actual → Fase objetivo

| Capa | Hoy (MVP) | Objetivo 12 meses |
|------|-----------|-------------------|
| Frontend | Next.js 14 monolito | Next.js 15 + React 19 |
| Backend | API Routes + Prisma | NestJS microservicios por dominio |
| Auth | NextAuth JWT | JWT + Refresh + MFA |
| Realtime | — | WebSockets (Socket.io) |
| Infra | Single deploy | Docker → K8s AWS |

## 3. Multi-tenant

### Modelo: **Shared DB, tenant column + RLS**

- Cada fila de negocio incluye `companyId`
- PostgreSQL Row Level Security por tenant
- Super Admin bypass con rol de plataforma
- Certificados AFIP cifrados por empresa (AES-256-GCM)

### Jerarquía organizacional

```
Platform (Emitia SaaS)
 └── Organization (opcional — grupos holding)
      └── Company (tenant fiscal)
           ├── Branch (sucursal)
           ├── Warehouse (depósito)
           ├── POS (punto de venta)
           └── Users + Roles
```

### Roles RBAC

`super_admin` · `owner` · `manager` · `accountant` · `admin` · `seller` · `cashier` · `purchasing` · `warehouse` · `customer_portal` · `supplier_portal`

Permisos granulares: `module:action:resource` (ej. `invoices:emit:fac_b`)

## 4. Módulos (bounded contexts)

| Dominio | Servicio NestJS | Prioridad |
|---------|-----------------|-----------|
| Identity & Access | `auth-service` | P0 |
| Billing SaaS | `subscription-service` | P0 |
| Fiscal ARCA | `fiscal-service` | P0 |
| Sales & POS | `sales-service` | P0 |
| Inventory | `inventory-service` | P1 |
| Treasury | `treasury-service` | P1 |
| Accounting | `accounting-service` | P1 |
| CRM | `crm-service` | P2 |
| Purchases | `purchases-service` | P2 |
| Ecommerce | `integration-service` | P2 |
| Documents | `dms-service` | P2 |
| Workflows | `workflow-service` | P3 |
| HR | `hr-service` | P3 |
| BI | `analytics-service` | P2 |
| AI | `ai-service` | P2 |
| Notifications | `notification-service` | P1 |

## 5. Integraciones fiscales (Argentina)

- **WSAA** — autenticación certificados
- **WSFEv1 / WSMTXCA** — facturación electrónica
- **WS_SR_PADRON_A13** — consulta CUIT
- **Libro IVA digital** — exportación RG
- Ambientes: homologación / producción por empresa
- Cola de reintentos CAE con idempotencia

## 6. Seguridad

- MFA (TOTP + backup codes)
- Secrets en AWS Secrets Manager / Vault
- Audit log inmutable (`AuditEvent`)
- WAF + rate limiting por tenant/IP
- Cifrado at-rest (RDS) + in-transit (TLS 1.3)
- OWASP Top 10 en CI (SAST + dependency scan)
- Backups diarios + PITR PostgreSQL

## 7. Observabilidad

- **Logs**: structured JSON → CloudWatch / Loki
- **Metrics**: Prometheus + Grafana
- **Traces**: OpenTelemetry → Tempo
- **Alertas**: PagerDuty para fiscal down / CAE failures

## 8. CI/CD

```
GitHub Actions
 ├── lint + test + build
 ├── prisma migrate (staging)
 ├── deploy preview (PR)
 └── deploy production (main, manual approval)
```

## 9. Escalabilidad objetivo

| Métrica | Target |
|---------|--------|
| Empresas | 50.000 |
| Usuarios | 500.000 |
| Facturas/mes | 10M+ |
| Latencia API p95 | < 300ms |
| Uptime SLA | 99.9% |

Estrategia: read replicas PostgreSQL, Redis cache hot data, workers async para CAE/PDF/email, sharding por región (AR, MX, CL) en fase 3.
