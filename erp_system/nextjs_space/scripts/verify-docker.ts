import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ensureCompanyDefaults } from '../lib/company-setup';
import { ensurePlatformPlans } from '../lib/platform-plans';
import { migrateCompanyStockToLevels, setProductStockInDefaultWarehouse } from '../lib/stock';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function main() {
  console.log('=== Verificación Emitia ERP (Docker local) ===\n');

  await ensurePlatformPlans();
  const plans = await prisma.platformPlan.findMany({ orderBy: { sortOrder: 'asc' } });
  console.log(`✓ Planes SaaS: ${plans.length} (${plans.map((p) => p.code).join(', ')})`);

  const existing = await prisma.company.findFirst({ where: { email: 'verify@emitia.local' } });
  let company = existing;

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Emitia Verify Co',
        legalName: 'Emitia Verify SRL',
        cuit: '20999999993',
        email: 'verify@emitia.local',
        plan: 'free',
        status: 'active',
      },
    });

    const hash = await bcrypt.hash('verify1234', 10);
    await prisma.user.create({
      data: {
        name: 'Usuario Verificación',
        email: 'verify@emitia.local',
        password: hash,
        role: 'company_admin',
        companyId: company.id,
        status: 'active',
      },
    });
    console.log('✓ Empresa y usuario de prueba creados');
  } else {
    console.log('✓ Empresa de prueba ya existía');
  }

  const { branch, warehouse } = await ensureCompanyDefaults(company.id, prisma);
  console.log(`✓ Sucursal default: ${branch.name} (${branch.code})`);
  console.log(`✓ Depósito default: ${warehouse.name} (${warehouse.code})`);

  const pos = await prisma.pointOfSale.findFirst({ where: { companyId: company.id, number: 1 } });
  console.log(`✓ POS: ${pos?.name ?? 'no encontrado'}`);

  let product = await prisma.product.findFirst({
    where: { companyId: company.id, sku: 'VERIFY-001' },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        companyId: company.id,
        name: 'Producto Verificación',
        sku: 'VERIFY-001',
        price: 1000,
        cost: 500,
        stock: 25,
        minStock: 5,
      },
    });
    await setProductStockInDefaultWarehouse(product.id, company.id, 25, 5);
    console.log('✓ Producto de prueba creado con stock en depósito');
  }

  const migration = await migrateCompanyStockToLevels(company.id);
  console.log(`✓ Migración stock: ${migration.migrated}/${migration.total} productos`);

  const stockLevel = await prisma.stockLevel.findFirst({
    where: { productId: product!.id, warehouseId: warehouse.id },
  });
  console.log(`✓ StockLevel depósito principal: ${stockLevel?.quantity ?? 0} unidades`);

  const tables = ['Branch', 'Warehouse', 'StockLevel', 'AuditEvent', 'PlatformPlan', 'PointOfSale'];
  for (const table of tables) {
    const count = await (prisma as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
    console.log(`  · ${table}: ${count} registros`);
  }

  await prisma.auditEvent.create({
    data: {
      companyId: company.id,
      action: 'verify.docker_check',
      entity: 'System',
      metadata: JSON.stringify({ ok: true, at: new Date().toISOString() }),
    },
  });
  console.log('\n✅ Todas las comprobaciones pasaron contra Postgres local (Docker).');
}

main()
  .catch((e) => {
    console.error('\n❌ Verificación fallida:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
