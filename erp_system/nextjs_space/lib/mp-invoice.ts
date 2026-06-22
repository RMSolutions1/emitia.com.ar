import prisma from '@/lib/db';

/**
 * Marca una factura como pagada (total o parcial) tras confirmación Mercado Pago.
 */
export async function completeInvoicePayment(
  invoiceId: string,
  paymentAmount: number
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) {
    return { completed: false, reason: 'not_found' as const, invoice: null };
  }

  const pending = Math.max(0, invoice.total - invoice.paidAmount);
  const applied = Math.min(pending, paymentAmount);
  if (applied <= 0) {
    return { completed: false, reason: 'already_paid' as const, invoice };
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      paidAmount: { increment: applied },
    },
  });

  return {
    completed: true,
    reason: 'paid' as const,
    invoice: updated,
    applied,
  };
}

export async function resolveInvoiceCompanyId(invoiceId: string): Promise<string | undefined> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { companyId: true },
  });
  return invoice?.companyId;
}
