import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getMPPayment, getMPCredentials, syncMpTransactionFromPayment, validateMpWebhookSignature } from '@/lib/mercadopago';
import { completePendingSale } from '@/lib/mp-sale';
import { completeInvoicePayment, resolveInvoiceCompanyId } from '@/lib/mp-invoice';
import { parseMpExternalReference } from '@/lib/mp-reference';

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
    const parsed = parseMpExternalReference(payment.external_reference);
    if (parsed?.type === 'invoice') {
      const invCompany = await resolveInvoiceCompanyId(parsed.id);
      if (invCompany) return invCompany;
    }
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

  const parsedRef = parseMpExternalReference(payment.external_reference);
  if (payment.status === 'approved' && parsedRef?.type === 'invoice') {
    await completeInvoicePayment(parsedRef.id, payment.transaction_amount);
  } else if (payment.status === 'approved' && parsedRef?.type === 'saas') {
    await prisma.company.update({
      where: { id: parsedRef.id },
      data: {
        paymentStatus: 'paid',
        paymentMethod: 'mercadopago',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  } else if (payment.status === 'approved') {
    const saleId = transaction?.saleId || (parsedRef?.type === 'sale' ? parsedRef.id : payment.external_reference);
    if (saleId) {
      await completePendingSale(saleId, `mercadopago - ${payment.payment_method_id || 'mp'}`);
    }
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
