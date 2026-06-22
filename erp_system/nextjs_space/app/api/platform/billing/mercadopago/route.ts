import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { createMPPreference, getMPCredentials } from '@/lib/mercadopago';
import { mpRefForSaas } from '@/lib/mp-reference';

export const dynamic = 'force-dynamic';

/** Cobro del plan SaaS EMITIA vía Mercado Pago (credenciales de plataforma) */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userRole = (session.user as any).role;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }

    const amount = company.subscriptionPrice || 0;
    if (amount <= 0) {
      return NextResponse.json({ error: 'Plan sin precio configurado. Contactá soporte EMITIA.' }, { status: 400 });
    }

    const platformCompanyId = process.env.EMITIA_PLATFORM_COMPANY_ID || companyId;
    const credentials = await getMPCredentials(platformCompanyId);
    if (!credentials) {
      return NextResponse.json(
        { error: 'Mercado Pago de plataforma no configurado', needsConfig: true },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const isPublicHttps = baseUrl.startsWith('https://') && !baseUrl.includes('localhost');
    const externalRef = mpRefForSaas(companyId);

    const preference = await createMPPreference(
      {
        items: [{
          title: `Plan EMITIA — ${company.name}`,
          quantity: 1,
          unit_price: amount,
        }],
        statement_descriptor: 'EMITIA PLAN',
        external_reference: externalRef,
        ...(isPublicHttps
          ? {
              notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
              back_urls: {
                success: `${baseUrl}/configuracion/plan?payment=success`,
                failure: `${baseUrl}/configuracion/plan?payment=failure`,
                pending: `${baseUrl}/configuracion/plan?payment=pending`,
              },
              auto_return: 'approved',
            }
          : {}),
      },
      platformCompanyId
    );

    if (!preference) {
      return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
    }

    await prisma.paymentTransaction.create({
      data: {
        companyId,
        provider: 'mercadopago',
        preferenceId: preference.id,
        status: 'pending',
        amount,
        currency: 'ARS',
        checkoutUrl:
          credentials.environment === 'production'
            ? preference.init_point
            : preference.sandbox_init_point,
        metadata: JSON.stringify({ type: 'saas', companyId, external_reference: externalRef }),
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl:
        credentials.environment === 'production'
          ? preference.init_point
          : preference.sandbox_init_point,
      amount,
      planStatus: company.paymentStatus,
    });
  } catch (error) {
    console.error('SaaS billing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar pago del plan' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        subscriptionPrice: true,
        paymentStatus: true,
        paymentMethod: true,
        nextBillingDate: true,
        plan: true,
      },
    });

    return NextResponse.json({ company });
  } catch (error) {
    return NextResponse.json({ error: 'Error al consultar plan' }, { status: 500 });
  }
}
