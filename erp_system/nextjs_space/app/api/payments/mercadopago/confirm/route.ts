import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  getMPPayment,
  searchMPPaymentsByReference,
  syncMpTransactionFromPayment,
} from '@/lib/mercadopago';
import { completePendingSale } from '@/lib/mp-sale';

export const dynamic = 'force-dynamic';

async function processApprovedSale(
  saleId: string,
  payment: any,
  companyId: string
) {
  const transaction = await syncMpTransactionFromPayment(payment, companyId);
  let saleResult = null;

  if (payment.status === 'approved') {
    saleResult = await completePendingSale(
      saleId,
      `mercadopago - ${payment.payment_method_id || 'mp'}`
    );
  }

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      items: { include: { product: true } },
      customer: true,
    },
  });

  return { sale, transaction, payment, saleResult };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(req.url);
    const saleId = searchParams.get('saleId');
    const paymentId = searchParams.get('paymentId');

    if (!saleId) {
      return NextResponse.json({ error: 'saleId requerido' }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }
    if (userRole !== 'superadmin' && sale.companyId !== companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (sale.status === 'completed') {
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { saleId },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({
        success: true,
        sale,
        transaction,
        payment: transaction ? { status: transaction.status } : null,
        alreadyCompleted: true,
      });
    }

    let payment: any = null;

    if (paymentId) {
      payment = await getMPPayment(paymentId, sale.companyId);
    } else {
      const existingTx = await prisma.paymentTransaction.findFirst({
        where: { saleId },
        orderBy: { createdAt: 'desc' },
      });
      if (existingTx?.externalId) {
        payment = await getMPPayment(existingTx.externalId, sale.companyId);
      } else {
        const results = await searchMPPaymentsByReference(saleId, sale.companyId);
        payment = results.find((p) => p.status === 'approved') || results[0] || null;
      }
    }

    if (!payment) {
      return NextResponse.json({
        success: false,
        pending: true,
        sale,
        message: 'Pago aún no confirmado en MercadoPago',
      });
    }

    const result = await processApprovedSale(saleId, payment, sale.companyId);

    return NextResponse.json({
      success: payment.status === 'approved',
      pending: payment.status === 'pending' || payment.status === 'in_process',
      rejected: payment.status === 'rejected',
      ...result,
    });
  } catch (error) {
    console.error('Error confirming MP payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al confirmar pago' },
      { status: 500 }
    );
  }
}
