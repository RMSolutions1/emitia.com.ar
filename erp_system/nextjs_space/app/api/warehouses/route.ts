import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { logAuditEvent, getRequestMeta } from '@/lib/audit';
import {
  getTenantSession,
  requireTenantSession,
  requireCompanyScope,
  requirePermission,
  tenantErrorResponse,
} from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const tenant = requireTenantSession(await getTenantSession());
    requirePermission(tenant, 'warehouses.manage');

    const companyId = requireCompanyScope(tenant);
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    const warehouses = await prisma.warehouse.findMany({
      where: {
        companyId,
        ...(branchId ? { branchId } : {}),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { stockLevels: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    const authResponse = tenantErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al listar depósitos:', error);
    return NextResponse.json({ error: 'Error al listar depósitos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenant = requireTenantSession(await getTenantSession());
    requirePermission(tenant, 'warehouses.manage');
    const companyId = requireCompanyScope(tenant);

    const body = await req.json();
    const { code, name, branchId, isDefault } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const warehouseCode = (code || name).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 20);

    if (branchId) {
      const branch = await prisma.branch.findFirst({
        where: { id: branchId, companyId },
      });
      if (!branch) {
        return NextResponse.json({ error: 'Sucursal inválida' }, { status: 400 });
      }
    }

    if (isDefault) {
      await prisma.warehouse.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        companyId,
        branchId: branchId || null,
        code: warehouseCode,
        name: name.trim(),
        isDefault: Boolean(isDefault),
        isActive: true,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    const meta = getRequestMeta(req);
    await logAuditEvent({
      companyId,
      userId: tenant.userId,
      action: 'warehouse.create',
      entity: 'Warehouse',
      entityId: warehouse.id,
      metadata: { code: warehouse.code, name: warehouse.name },
      ...meta,
    });

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error: any) {
    const authResponse = tenantErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un depósito con ese código' }, { status: 400 });
    }
    console.error('Error al crear depósito:', error);
    return NextResponse.json({ error: 'Error al crear depósito' }, { status: 500 });
  }
}
