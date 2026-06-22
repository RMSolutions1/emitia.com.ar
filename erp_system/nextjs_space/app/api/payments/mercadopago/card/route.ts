import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  createMPDirectPayment,
  syncMpTransactionFromPayment,
} from '@/lib/mercadopago';
import { completePendingSale } from '@/lib/mp-sale';
import { mpRefForSale } from '@/lib/mp-reference';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userRole = (session.user as any).role;
    const body = await req.json();
    const { saleId, formData } = body;

    if (!saleId || !formData?.token) {
      return NextResponse.json({ error: 'saleId y token de tarjeta requeridos' }, { status: 400 });
    }

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

    const payerEmail =
      formData.payer?.email ||
      formData.cardholderEmail ||
      'comprador@emitia.local';

    const payment = await createMPDirectPayment(
      {
        token: formData.token,
        transaction_amount: sale.total,
        description: `Venta ${sale.saleNumber}`,
        external_reference: mpRefForSale(saleId),
        installments: formData.installments,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        payer: {
          email: payerEmail,
          identification: formData.payer?.identification,
        },
      },
      sale.companyId
    );

    const transaction = await syncMpTransactionFromPayment(payment, sale.companyId);

    if (payment.status === 'approved') {
      await completePendingSale(
        saleId,
        `mercadopago - ${payment.payment_method_id || 'card'}`
      );
    }

    const updatedSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    return NextResponse.json({
      success: payment.status === 'approved',
      pending: payment.status === 'pending' || payment.status === 'in_process',
      rejected: payment.status === 'rejected',
      payment,
      transaction,
      sale: updatedSale,
      statusDetail: payment.status_detail,
    });
  } catch (error) {
    console.error('Error processing MP card payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar pago con tarjeta' },
      { status: 500 }
    );
  }
}
