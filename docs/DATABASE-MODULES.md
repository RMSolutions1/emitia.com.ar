# Emitia ERP — Modelo de datos (extensión)

## Entidades existentes (v1)

Company, User, Product, Category, Customer, Supplier, Sale, Invoice, Ticket, PurchaseOrder, CashRegister, Quote, PriceList, BankAccount, Check, DocumentSequence, PaymentTransaction, Subscription

## Entidades a agregar (v2)

### Organización

```prisma
model Branch {
  id        String @id @default(cuid())
  companyId String
  name      String
  address   String?
  isActive  Boolean @default(true)
  warehouses Warehouse[]
  posPoints  PointOfSale[]
}

model Warehouse {
  id        String @id @default(cuid())
  companyId String
  branchId  String?
  name      String
  code      String
  stockItems StockLevel[]
}

model PointOfSale {
  id        String @id @default(cuid())
  companyId String
  branchId  String?
  number    Int    // número AFIP
  name      String
}
```

### Inventario avanzado

```prisma
model StockLevel {
  id          String @id @default(cuid())
  productId   String
  warehouseId String
  quantity    Decimal
  reserved    Decimal @default(0)
  minStock    Decimal?
  maxStock    Decimal?
  @@unique([productId, warehouseId])
}

model StockMovement {
  id          String @id @default(cuid())
  companyId   String
  productId   String
  warehouseId String
  type        String // in, out, adjust, transfer
  quantity    Decimal
  reference   String?
  createdAt   DateTime @default(now())
}
```

### Contabilidad

```prisma
model ChartAccount {
  id        String @id @default(cuid())
  companyId String
  code      String
  name      String
  type      String // asset, liability, equity, income, expense
}

model JournalEntry {
  id        String @id @default(cuid())
  companyId String
  date      DateTime
  description String
  sourceType  String? // invoice, payment, manual
  sourceId    String?
  lines     JournalLine[]
}

model JournalLine {
  id        String @id @default(cuid())
  entryId   String
  accountId String
  debit     Decimal @default(0)
  credit    Decimal @default(0)
}
```

### CRM

```prisma
model Lead {
  id        String @id @default(cuid())
  companyId String
  name      String
  email     String?
  stage     String // prospect, qualified, proposal, won, lost
  value     Decimal?
}

model Activity {
  id        String @id @default(cuid())
  companyId String
  entityType String
  entityId   String
  type       String // call, email, meeting, task
  dueAt      DateTime?
  completed  Boolean @default(false)
}
```

### SaaS Platform

```prisma
model PlatformPlan {
  id          String @id @default(cuid())
  code        String @unique // starter, pro, business, enterprise
  name        String
  priceMonthly Decimal
  limits      Json   // { invoices: 100, users: 3, pos: 1 }
}

model AuditEvent {
  id        String @id @default(cuid())
  companyId String?
  userId    String?
  action    String
  entity    String
  entityId  String?
  metadata  Json?
  ip        String?
  createdAt DateTime @default(now())
}
```

## Índices críticos

- `(companyId, createdAt)` en Invoice, Sale, StockMovement
- `(companyId, customerId)` en Invoice
- `(companyId, status)` en todas las entidades transaccionales
- Partial index facturas pendientes CAE

## RLS (PostgreSQL)

```sql
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON invoices
  USING (company_id = current_setting('app.current_company_id')::text);
```
