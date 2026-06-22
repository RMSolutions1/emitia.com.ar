import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { migrateCompanyStockToLevels } from '@/lib/stock';
import { logAuditEvent, getRequestMeta } from '@/lib/audit';
import {
  getTenantSession,
  requireTenantSession,
  requireCompanyScope,
  requirePermission,
  tenantErrorResponse,
} from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const tenant = requireTenantSession(await getTenantSession());
    requirePermission(tenant, 'inventory.write');
    const companyId = requireCompanyScope(tenant);

    const result = await migrateCompanyStockToLevels(companyId);

    const meta = getRequestMeta(req);
    await logAuditEvent({
      companyId,
      userId: tenant.userId,
      action: 'inventory.migrate_stock',
      entity: 'StockLevel',
      metadata: result,
      ...meta,
    });

    return NextResponse.json({
      message: 'Stock migrado al depósito principal',
      ...result,
    });
  } catch (error) {
    const authResponse = tenantErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al migrar stock:', error);
    return NextResponse.json({ error: 'Error al migrar stock' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const tenant = requireTenantSession(await getTenantSession());
    requirePermission(tenant, 'inventory.read');
    const companyId = requireCompanyScope(tenant);

    const [products, stockLevels, warehouse] = await Promise.all([
      prisma.product.count({ where: { companyId, active: true } }),
      prisma.stockLevel.count({ where: { companyId } }),
      prisma.warehouse.findFirst({
        where: { companyId, isDefault: true },
        select: { id: true, name: true, code: true },
      }),
    ]);

    return NextResponse.json({
      products,
      stockLevels,
      warehouse,
      pendingMigration: products > stockLevels,
    });
  } catch (error) {
    const authResponse = tenantErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json({ error: 'Error al consultar migración' }, { status: 500 });
  }
}
