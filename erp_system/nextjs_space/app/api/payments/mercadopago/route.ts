import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { createMPPreference, getMPCredentials, buildMPPreferencePayer, getMPFullConfig, isQRConfigured } from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const credentials = await getMPCredentials((session.user as any).companyId);
    if (!credentials) {
      return NextResponse.json({ 
        error: 'MercadoPago no está configurado',
        needsConfig: true 
      }, { status: 400 });
    }

    const body = await req.json();
    const { saleId, items, customer, total } = body;

    if (!saleId) {
      return NextResponse.json({ error: 'saleId requerido. Cree la venta pendiente antes del pago.' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items requeridos' }, { status: 400 });
    }

    const companyId = (session.user as any).companyId;
    const userRole = (session.user as any).role;
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }
    if (userRole !== 'superadmin' && sale.companyId !== companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    if (sale.status !== 'pending_payment') {
      return NextResponse.json({ error: 'La venta no está pendiente de pago' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    const successUrl = `${baseUrl}/pos?payment=success&saleId=${saleId}`;
    const isPublicHttps = baseUrl.startsWith('https://') && !baseUrl.includes('localhost');

    const preference = await createMPPreference({
      items: items.map((item: { name?: string; title?: string; description?: string; quantity: number; price?: number; unit_price?: number }) => ({
        title: item.name || item.title || 'Producto',
        description: item.description || item.name || item.title || 'Producto',
        quantity: item.quantity,
        unit_price: item.price ?? item.unit_price ?? 0,
      })),
      statement_descriptor: (company?.name || 'EMITIA').slice(0, 22),
      payer: buildMPPreferencePayer(customer),
      back_urls: {
        success: successUrl,
        failure: `${baseUrl}/pos?payment=failure&saleId=${saleId}`,
        pending: `${baseUrl}/pos?payment=pending&saleId=${saleId}`,
      },
      ...(isPublicHttps ? { auto_return: 'approved' } : {}),
      external_reference: saleId,
      ...(isPublicHttps ? { notification_url: `${baseUrl}/api/payments/mercadopago/webhook` } : {}),
    }, companyId);

    if (!preference) {
      return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 });
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        companyId,
        saleId,
        provider: 'mercadopago',
        preferenceId: preference.id,
        status: 'pending',
        amount: total || items.reduce((sum: number, item: { quantity: number; price?: number; unit_price?: number }) => 
          sum + item.quantity * (item.price || item.unit_price || 0), 0),
        currency: 'ARS',
        checkoutUrl: credentials.environment === 'production' 
          ? preference.init_point 
          : preference.sandbox_init_point,
        metadata: JSON.stringify({ companyId, saleId }),
      }
    });

    return NextResponse.json({
      success: true,
      preferenceId: preference.id,
      checkoutUrl: credentials.environment === 'production' 
        ? preference.init_point 
        : preference.sandbox_init_point,
      transactionId: transaction.id
    });
  } catch (error) {
    console.error('Error creating MP payment:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al procesar pago' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const full = await getMPFullConfig(companyId);
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    const isPublicHttps = baseUrl.startsWith('https://') && !baseUrl.includes('localhost');

    return NextResponse.json({
      configured: !!full,
      environment: full?.environment || null,
      publicKey: full?.publicKey || null,
      qrConfigured: full ? isQRConfigured(full.metadata) : false,
      metadata: full?.metadata || null,
      webhookUrl: isPublicHttps ? `${baseUrl}/api/payments/mercadopago/webhook` : null,
      services: {
        checkoutPro: full?.metadata.enabledServices?.checkoutPro ?? true,
        qrInstore: full?.metadata.enabledServices?.qrInstore ?? false,
        paymentLink: full?.metadata.enabledServices?.paymentLink ?? true,
        point: full?.metadata.enabledServices?.point ?? false,
      },
    });
  } catch (error) {
    console.error('Error checking MP config:', error);
    return NextResponse.json({ error: 'Error al verificar configuración' }, { status: 500 });
  }
}
