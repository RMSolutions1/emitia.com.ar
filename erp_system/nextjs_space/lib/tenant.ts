import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { hasPermission, isSuperadmin, Permission } from '@/lib/rbac';

export type TenantSession = {
  userId: string;
  role: string;
  companyId: string | null;
  companyName: string | null;
  companyPlan: string;
};

export async function getTenantSession(): Promise<TenantSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    userId: session.user.id,
    role: session.user.role,
    companyId: session.user.companyId,
    companyName: session.user.companyName,
    companyPlan: session.user.companyPlan,
  };
}

export function requireTenantSession(tenant: TenantSession | null): TenantSession {
  if (!tenant) {
    throw new TenantAuthError('No autorizado', 401);
  }
  return tenant;
}

export function requireCompanyScope(tenant: TenantSession): string {
  if (isSuperadmin(tenant.role)) {
    throw new TenantAuthError('Operación requiere contexto de empresa', 400);
  }
  if (!tenant.companyId) {
    throw new TenantAuthError('Usuario sin empresa asignada', 403);
  }
  return tenant.companyId;
}

export function resolveCompanyFilter(tenant: TenantSession): { companyId?: string } {
  if (isSuperadmin(tenant.role)) {
    return {};
  }
  return { companyId: requireCompanyScope(tenant) };
}

export function requirePermission(tenant: TenantSession, permission: Permission): void {
  if (!hasPermission(tenant.role, permission)) {
    throw new TenantAuthError('Permiso insuficiente', 403);
  }
}

export class TenantAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function tenantErrorResponse(error: unknown) {
  if (error instanceof TenantAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return null;
}
