import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  createMPStore,
  createMPPos,
  getMPAccountInfo,
  getMPFullConfig,
  updateMPMetadata,
} from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'company_admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const companyId = (session.user as any).companyId;
    const full = await getMPFullConfig(companyId);
    if (!full) {
      return NextResponse.json({ error: 'MercadoPago no configurado' }, { status: 400 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'auto_setup') {
      const [company, account] = await Promise.all([
        prisma.company.findUnique({ where: { id: companyId } }),
        getMPAccountInfo(companyId).catch(() => null),
      ]);

      const userId = account?.id || full.metadata.collectorUserId;
      if (!userId) {
        return NextResponse.json({ error: 'No se pudo obtener user_id de MercadoPago' }, { status: 400 });
      }

      const storeExternalId = `emitia-${companyId.slice(-8)}-store`;
      const posExternalId = `emitia-${companyId.slice(-8)}-pos`;

      const store = await createMPStore(
        userId,
        {
          name: company?.name || 'Sucursal EMITIA',
          external_id: storeExternalId,
          street_name: company?.address?.split(',')[0] || 'Av. Corrientes',
          street_number: '1000',
          city_name: company?.city || 'Buenos Aires',
          state_name: company?.province || 'AR-C',
        },
        companyId
      );

      const pos = await createMPPos(
        {
          name: `Caja ${company?.name || 'Principal'}`,
          store_id: store.id,
          external_id: posExternalId,
          fixed_amount: false,
        },
        companyId
      );

      const metadata = await updateMPMetadata(companyId, {
        collectorUserId: String(userId),
        storeId: String(store.id),
        storeExternalId,
        posId: String(pos.id),
        externalPosId: posExternalId,
      });

      return NextResponse.json({
        success: true,
        store,
        pos,
        metadata,
        message: 'Sucursal y caja creadas en MercadoPago',
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('MP stores error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error al configurar sucursal/caja',
    }, { status: 500 });
  }
}
