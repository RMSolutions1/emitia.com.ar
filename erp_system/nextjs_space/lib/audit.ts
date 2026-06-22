import prisma from '@/lib/db';

type AuditInput = {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function logAuditEvent(input: AuditInput): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        companyId: input.companyId ?? null,
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
}

export function getRequestMeta(req: Request) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
  };
}
