import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { refundMPPayment } from '@/lib/mercadopago';

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
    const { transactionId, amount } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'transactionId requerido' }, { status: 400 });
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 });
    }

    if (transaction.provider !== 'mercadopago') {
      return NextResponse.json({ error: 'Solo se pueden reembolsar pagos de MercadoPago' }, { status: 400 });
    }

    if (!transaction.externalId) {
      return NextResponse.json({ error: 'La transacción no tiene ID de pago en MercadoPago' }, { status: 400 });
    }

    if (transaction.companyId && userRole !== 'superadmin' && transaction.companyId !== companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (transaction.saleId && userRole !== 'superadmin') {
      const sale = await prisma.sale.findUnique({
        where: { id: transaction.saleId },
        select: { companyId: true },
      });
      if (sale && sale.companyId !== companyId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    const refund = await refundMPPayment(
      transaction.externalId,
      amount,
      transaction.companyId || companyId
    );

    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'refunded',
        statusDetail: 'refunded',
        metadata: JSON.stringify({
          ...(transaction.metadata ? JSON.parse(transaction.metadata) : {}),
          refund,
        }),
      },
    });

    return NextResponse.json({ success: true, refund, transactionId: transaction.id });
  } catch (error) {
    console.error('Error refunding MP payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar reembolso' },
      { status: 500 }
    );
  }
}
