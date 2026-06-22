import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  createMPPreference,
  createMPQROrder,
  getMPFullConfig,
  getMPCredentials,
  buildMPPreferencePayer,
  isQRConfigured,
} from '@/lib/mercadopago';
import { mpRefForInvoice } from '@/lib/mp-reference';

export const dynamic = 'force-dynamic';

function invoiceItemsFromJson(invoice: { items: unknown; total: number; invoiceNumber: string }) {
  const raw = Array.isArray(invoice.items) ? invoice.items : [];
  if (raw.length === 0) {
    return [{
      title: `Comprobante ${invoice.invoiceNumber}`,
      quantity: 1,
      unit_price: invoice.total,
    }];
  }
  return raw.map((item: any) => ({
    title: item.name || item.description || 'Item',
    quantity: item.quantity || 1,
    unit_price: item.unitPrice || item.price || 0,
  }));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const invoiceId = new URL(req.url).searchParams.get('invoiceId');
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId requerido' }, { status: 400 });
    }

    const companyId = (session.user as any).companyId;
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.companyId !== companyId) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    const pending = Math.max(0, invoice.total - invoice.paidAmount);
    const transaction = await prisma.paymentTransaction.findFirst({
      where: { invoiceId, status: { in: ['pending', 'approved'] } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      invoiceId,
      pendingAmount: pending,
      paidAmount: invoice.paidAmount,
      total: invoice.total,
      checkoutUrl: transaction?.checkoutUrl || null,
      qrCode: transaction?.qrCode || null,
      status: transaction?.status || null,
    });
  } catch (error) {
    console.error('Error fetching invoice MP payment:', error);
    return NextResponse.json({ error: 'Error al consultar cobro' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await req.json();
    const { invoiceId, mode = 'both', customerEmail } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId requerido' }, { status: 400 });
    }

    const credentials = await getMPCredentials(companyId);
    if (!credentials) {
      return NextResponse.json({ error: 'MercadoPago no configurado', needsConfig: true }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.companyId !== companyId) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 });
    }

    const pendingAmount = Math.max(0, invoice.total - invoice.paidAmount);
    if (pendingAmount <= 0) {
      return NextResponse.json({ error: 'El comprobante ya está pagado' }, { status: 400 });
    }

    const fullConfig = await getMPFullConfig(companyId);
    const externalRef = mpRefForInvoice(invoiceId);
    const items = invoiceItemsFromJson({
      items: invoice.items,
      total: pendingAmount,
      invoiceNumber: invoice.invoiceNumber,
    });

    let checkoutUrl: string | null = null;
    let preferenceId: string | null = null;
    let qrImage: string | null = null;
    let qrCode: string | null = null;
    let externalId: string | null = null;

    if (mode === 'link' || mode === 'both') {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
      const isPublicHttps = baseUrl.startsWith('https://') && !baseUrl.includes('localhost');
      const company = await prisma.company.findUnique({ where: { id: companyId } });

      const preference = await createMPPreference(
        {
          items: items.map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
          statement_descriptor: (company?.name || 'EMITIA').slice(0, 22),
          payer: buildMPPreferencePayer({
            name: invoice.customerName,
            email: customerEmail,
            document: invoice.customerDocument || undefined,
          }),
          external_reference: externalRef,
          ...(isPublicHttps
            ? {
                notification_url: `${baseUrl}/api/payments/mercadopago/webhook`,
                back_urls: {
                  success: `${baseUrl}/facturas?payment=success&invoiceId=${invoiceId}`,
                  failure: `${baseUrl}/facturas?payment=failure&invoiceId=${invoiceId}`,
                  pending: `${baseUrl}/facturas?payment=pending&invoiceId=${invoiceId}`,
                },
                auto_return: 'approved',
              }
            : {}),
        },
        companyId
      );

      if (preference) {
        preferenceId = preference.id;
        checkoutUrl =
          credentials.environment === 'production'
            ? preference.init_point
            : preference.sandbox_init_point;
      }
    }

    if ((mode === 'qr' || mode === 'both') && fullConfig && isQRConfigured(fullConfig.metadata)) {
      try {
        const order = await createMPQROrder(
          {
            amount: pendingAmount,
            external_reference: externalRef,
            description: `Comprobante ${invoice.invoiceNumber}`,
            external_pos_id: fullConfig.metadata.externalPosId!,
            items: items.map((item) => ({
              title: item.title,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          },
          companyId
        );
        externalId = order.id?.toString() || null;
        qrImage =
          order.type_response?.transaction_data?.qr_code_base64 ||
          order.qr_data?.qr_code_base64 ||
          null;
        qrCode =
          order.type_response?.transaction_data?.qr_code ||
          order.qr_data?.qr_code ||
          null;
      } catch (qrError) {
        console.warn('MP invoice QR error:', qrError);
      }
    }

    if (!checkoutUrl && !qrImage && !qrCode) {
      return NextResponse.json(
        { error: 'No se pudo generar cobro MP. Verificá credenciales y QR en integraciones.' },
        { status: 500 }
      );
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        companyId,
        invoiceId,
        provider: 'mercadopago',
        preferenceId,
        externalId,
        status: 'pending',
        amount: pendingAmount,
        currency: 'ARS',
        checkoutUrl,
        qrCode: qrImage || qrCode,
        metadata: JSON.stringify({
          companyId,
          invoiceId,
          external_reference: externalRef,
          mode,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      checkoutUrl,
      qrImage,
      qrCode,
      pendingAmount,
      invoiceNumber: invoice.invoiceNumber,
    });
  } catch (error) {
    console.error('Error creating invoice MP payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar cobro' },
      { status: 500 }
    );
  }
}
