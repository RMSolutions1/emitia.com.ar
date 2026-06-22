import prisma from '@/lib/db';
import { adjustProductStock } from '@/lib/stock';

/**
 * Completa una venta pendiente de pago: descuenta stock e idempotente.
 */
export async function completePendingSale(
  saleId: string,
  paymentMethod?: string
) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });

  if (!sale) {
    return { sale: null, completed: false, reason: 'not_found' as const };
  }

  if (sale.status === 'completed') {
    return { sale, completed: false, reason: 'already_completed' as const };
  }

  if (sale.status !== 'pending_payment') {
    return { sale, completed: false, reason: 'invalid_status' as const };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: 'completed',
        paymentMethod: paymentMethod || sale.paymentMethod,
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    for (const item of sale.items) {
      await adjustProductStock({
        companyId: sale.companyId,
        productId: item.productId,
        delta: -item.quantity,
        type: 'out',
        reason: 'Venta MercadoPago',
        reference: sale.saleNumber,
        userId: sale.userId || undefined,
        tx,
      });
    }

    return result;
  });

  return { sale: updated, completed: true, reason: 'completed' as const };
}

export async function cancelPendingSale(saleId: string) {
  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale || sale.status !== 'pending_payment') {
    return { cancelled: false };
  }

  await prisma.sale.update({
    where: { id: saleId },
    data: { status: 'cancelled' },
  });

  return { cancelled: true };
}
