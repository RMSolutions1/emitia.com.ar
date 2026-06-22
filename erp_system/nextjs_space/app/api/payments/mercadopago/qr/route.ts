import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  createMPQROrder,
  getMPFullConfig,
  isQRConfigured,
  updateMPMetadata,
} from '@/lib/mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const full = await getMPFullConfig(companyId);
    if (!full) {
      return NextResponse.json({ error: 'MercadoPago no configurado', needsConfig: true }, { status: 400 });
    }

    const externalPosId = full.metadata.externalPosId;
    if (!isQRConfigured(full.metadata) || !externalPosId) {
      return NextResponse.json({
        error: 'QR no configurado. Creá sucursal y caja en Integraciones → MercadoPago.',
        needsQRSetup: true,
      }, { status: 400 });
    }

    const body = await req.json();
    const { saleId, items, total, description } = body;

    if (!saleId) {
      return NextResponse.json({ error: 'saleId requerido' }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale || sale.companyId !== companyId) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }
    if (sale.status !== 'pending_payment') {
      return NextResponse.json({ error: 'La venta no está pendiente de pago' }, { status: 400 });
    }

    const amount = total ?? sale.total;
    const order = await createMPQROrder(
      {
        amount,
        external_reference: saleId,
        description: description || `Venta ${sale.saleNumber}`,
        external_pos_id: externalPosId,
        items: items?.map((item: { name: string; quantity: number; price: number }) => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      },
      companyId
    );

    const qrImage =
      order?.type_response?.qr_code_base64
        ? `data:image/png;base64,${order.type_response.qr_code_base64}`
        : order?.type_response?.qr_code || order?.qr_data || null;

    const transaction = await prisma.paymentTransaction.create({
      data: {
        companyId,
        saleId,
        provider: 'mercadopago',
        externalId: order?.id?.toString(),
        status: 'pending',
        amount,
        currency: 'ARS',
        qrCode: qrImage || order?.type_response?.qr_code,
        metadata: JSON.stringify({ companyId, saleId, orderId: order?.id, mode: 'qr' }),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order?.id,
      qrImage,
      qrCode: order?.type_response?.qr_code,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('MP QR error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error al crear QR',
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const companyId = (session.user as any).companyId;
    const body = await req.json();
    const updated = await updateMPMetadata(companyId, body);
    return NextResponse.json({ success: true, metadata: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar configuración QR' }, { status: 500 });
  }
}
