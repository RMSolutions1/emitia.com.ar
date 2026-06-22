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

export async function GET() {
  try {
    const tenant = requireTenantSession(await getTenantSession());
    requirePermission(tenant, 'branches.manage');

    const companyId = requireCompanyScope(tenant);
    const branches = await prisma.branch.findMany({
      where: { companyId },
      include: {
        warehouses: { where: { isActive: true }, orderBy: { name: 'asc' } },
        _count: { select: { posPoints: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(branches);
  } catch (error) {
    const authResponse = tenantErrorResponse(error);
    if (authResponse) return authResponse;
    console.error('Error al listar sucursales:', error);
    return NextResponse.json({ error: 'Error al listar sucursales' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const tenant = requireTenantSession(await getTenantSession());
    requirePermission(tenant, 'branches.manage');
    const companyId = requireCompanyScope(tenant);

    const body = await req.json();
    const { code, name, address, city, province, phone, isDefault } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const branchCode = (code || name).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 20);

    if (isDefault) {
      await prisma.branch.updateMany({
        where: { companyId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        companyId,
        code: branchCode,
        name: name.trim(),
        address: address || null,
        city: city || null,
        province: province || null,
        phone: phone || null,
        isDefault: Boolean(isDefault),
        isActive: true,
      },
    });

    const meta = getRequestMeta(req);
    await logAuditEvent({
      companyId,
      userId: tenant.userId,
      action: 'branch.create',
      entity: 'Branch',
      entityId: branch.id,
      metadata: { code: branch.code, name: branch.name },
      ...meta,
    });

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    const authResponse = tenantErrorResponse(error);
    if (authResponse) return authResponse;
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una sucursal con ese código' }, { status: 400 });
    }
    console.error('Error al crear sucursal:', error);
    return NextResponse.json({ error: 'Error al crear sucursal' }, { status: 500 });
  }
}
