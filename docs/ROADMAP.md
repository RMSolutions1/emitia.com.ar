# Emitia ERP — Roadmap de producto

## Fase 0 — Fundación (Mes 1-2) ✅ en curso

- [x] Monolito Next.js multi-tenant base
- [x] Prisma + PostgreSQL (~42 tablas)
- [x] Facturación ARCA (WSAA, WSFEv1)
- [x] POS, inventario, tesorería básica
- [x] Landing + suscripciones base
- [ ] Migración Next.js 15 + React 19
- [ ] JWT propio + MFA
- [ ] Docker Compose local (PG, Redis, RabbitMQ)
- [ ] `.env` secrets fuera del repo
- [ ] RLS PostgreSQL

## Fase 1 — MVP comercial (Mes 3-6)

**Objetivo:** Competir con Colppy/Xubio en facturación + gestión PyME

| Módulo | Entregables |
|--------|-------------|
| Fiscal | Todos comprobantes A/B/C/E/MiPyME, NC/ND, recibos, reintentos CAE |
| POS | Offline-first PWA, impresoras térmicas, cierre caja |
| Ventas | Presupuesto → pedido → remito → factura → cobro |
| Stock | Multi-depósito, mín/máx, ajustes |
| Tesorería | Caja, bancos, cheques, conciliación manual |
| Contabilidad | Asientos auto desde facturas, libro IVA |
| SaaS Billing | Planes Starter/Pro/Business, MercadoPago + Stripe |
| Portal cliente | Ver facturas, PDF, pagar online |

## Fase 2 — Growth (Mes 7-12)

- NestJS extracción: `fiscal-service`, `sales-service`, `auth-service`
- CRM + embudos
- Compras completo
- Ecommerce: Tiendanube, WooCommerce, Mercado Libre
- IA: chat contable, predicción stock, alertas deuda
- WhatsApp Business API
- App Flutter (POS + ventas)
- GraphQL API + SDK TypeScript

## Fase 3 — Enterprise (Mes 13-24)

- Producción + trazabilidad lotes/series
- Picking + logística
- Marketplace B2B
- White label
- Multi-país (MX, CL, UY)
- ISO 27001 prep
- Kubernetes production AWS

## Fase 4 — Unicorn scale (24+ meses)

- 50k empresas
- BI avanzado (MRR, EBITDA, cohortes)
- Workflow engine visual
- HR completo
- SAP/Odoo migration tools

## KPIs por fase

| Fase | MRR target | Empresas activas | NPS |
|------|------------|------------------|-----|
| 1 | USD 50k | 500 | > 40 |
| 2 | USD 300k | 3.000 | > 50 |
| 3 | USD 1M | 10.000 | > 55 |
