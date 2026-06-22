import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  getMPFullConfig,
  getMPAccountInfo,
  isQRConfigured,
} from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const full = await getMPFullConfig(companyId);
    if (!full) {
      return NextResponse.json({ configured: false, needsConfig: true });
    }

    let account: Record<string, unknown> | null = null;
    let accountError: string | null = null;
    try {
      const me = await getMPAccountInfo(companyId);
      account = {
        id: me.id,
        nickname: me.nickname,
        email: me.email,
        siteId: me.site_id,
        testUser: me.test_data?.test_user ?? false,
      };
    } catch (e) {
      accountError = e instanceof Error ? e.message : 'No se pudo validar la cuenta';
    }

    const pendingSales = await prisma.sale.count({
      where: { companyId, status: 'pending_payment', paymentMethod: 'mercadopago' },
    });
    const transactions = await prisma.paymentTransaction.count({
      where: { companyId, provider: 'mercadopago' },
    });

    const baseUrl = process.env.NEXTAUTH_URL || '';
    const isPublicHttps = baseUrl.startsWith('https://') && !baseUrl.includes('localhost');

    return NextResponse.json({
      configured: true,
      environment: full.environment,
      account,
      accountError,
      qrConfigured: isQRConfigured(full.metadata),
      metadata: full.metadata,
      stats: { pendingSales, transactions },
      webhook: {
        configured: !!full.webhookSecret,
        url: isPublicHttps ? `${baseUrl}/api/payments/mercadopago/webhook` : null,
        publicRequired: !isPublicHttps,
      },
      quality: {
        checklistUrl: 'https://www.mercadopago.com.ar/developers/panel/app',
        minScore: 73,
        tips: [
          'Usá credenciales de prueba para desarrollo',
          'Completá un pago sandbox con titular APRO',
          'Registrá el webhook en HTTPS público',
          'Enviá payer.email cuando el cliente tenga correo',
        ],
      },
    });
  } catch (error) {
    console.error('MP status error:', error);
    return NextResponse.json({ error: 'Error al obtener estado' }, { status: 500 });
  }
}
