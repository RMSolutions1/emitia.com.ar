import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getMPPayment, getMPCredentials, syncMpTransactionFromPayment, validateMpWebhookSignature } from '@/lib/mercadopago';
import { completePendingSale } from '@/lib/mp-sale';

async function resolveCompanyId(
  transaction: { metadata?: string | null; saleId?: string | null; companyId?: string | null } | null,
  payment: any
): Promise<string | undefined> {
  if (transaction?.companyId) return transaction.companyId;
  if (transaction?.metadata) {
    try {
      const meta = JSON.parse(transaction.metadata);
      if (meta.companyId) return meta.companyId;
    } catch { /* ignore */ }
  }
  if (transaction?.saleId) {
    const sale = await prisma.sale.findUnique({
      where: { id: transaction.saleId },
      select: { companyId: true },
    });
    if (sale?.companyId) return sale.companyId;
  }
  if (payment.external_reference) {
    const sale = await prisma.sale.findUnique({
      where: { id: payment.external_reference },
      select: { companyId: true },
    });
    if (sale?.companyId) return sale.companyId;
  }
  return undefined;
}

async function handlePaymentNotification(
  paymentId: string | number,
  req?: NextRequest
) {
  let transaction = await prisma.paymentTransaction.findFirst({
    where: { externalId: paymentId.toString() },
  });

  let companyId = transaction ? await resolveCompanyId(transaction, {}) : undefined;
  let payment = await getMPPayment(paymentId, companyId);

  if (!transaction) {
    transaction = await prisma.paymentTransaction.findFirst({
      where: { preferenceId: payment.preference_id },
    });
    companyId = await resolveCompanyId(transaction, payment);
    if (companyId && !transaction) {
      payment = await getMPPayment(paymentId, companyId);
    }
  }

  companyId = await resolveCompanyId(transaction, payment);

  if (req && companyId) {
    const credentials = await getMPCredentials(companyId);
    const secret = credentials?.webhookSecret;
    if (secret) {
      const valid = validateMpWebhookSignature({
        xSignature: req.headers.get('x-signature'),
        xRequestId: req.headers.get('x-request-id'),
        dataId: paymentId.toString(),
        secret,
      });
      if (!valid) {
        console.warn('MP webhook signature validation failed for payment', paymentId);
        throw new Error('Invalid webhook signature');
      }
    }
  }

  await syncMpTransactionFromPayment(payment, companyId);

  const saleId = transaction?.saleId || payment.external_reference;
  if (payment.status === 'approved' && saleId) {
    await completePendingSale(saleId, `mercadopago - ${payment.payment_method_id || 'mp'}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log('MP Webhook received:', JSON.stringify(body, null, 2));

    if (body.type === 'payment' && body.data?.id) {
      await handlePaymentNotification(body.data.id, req);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

// Mercado Pago también puede enviar notificaciones vía query string (IPN legacy)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const id = searchParams.get('id') || searchParams.get('data.id');

    if (topic === 'payment' && id) {
      await handlePaymentNotification(id, req);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook GET error:', error);
    return NextResponse.json({ received: true });
  }
}
