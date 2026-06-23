import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET — estado de pagos de una factura
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      select: { id: true, invoiceNumber: true, total: true, paidAmount: true, status: true, customerName: true, customerId: true },
    });

    if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });

    // Fetch related movements from account if customer has one
    let payments: any[] = [];
    if (invoice.customerId) {
      const account = await prisma.customerAccount.findUnique({
        where: { customerId: invoice.customerId },
        select: {
          movements: {
            where: { referenceType: 'invoice_payment', referenceId: params.id },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      payments = (account?.movements || []).map((m: any) => ({
        id: m.id,
        date: m.createdAt,
        amount: m.amount,
        description: m.description,
      }));
    }

    return NextResponse.json({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      paidAmount: invoice.paidAmount || 0,
      balance: invoice.total - (invoice.paidAmount || 0),
      status: invoice.status,
      payments,
    });
  } catch (error) {
    console.error('[Invoice Payments GET]', error);
    return NextResponse.json({ error: 'Error al obtener pagos' }, { status: 500 });
  }
}

// POST — registrar un abono/pago sobre una factura
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const companyId = (session.user as any).companyId;
    const userRole  = (session.user as any).role;

    const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
    if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    if (userRole !== 'superadmin' && invoice.companyId !== companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();
    const { amount, paymentMethod = 'cash', reference, notes, createReceipt = true } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'El monto debe ser mayor a cero' }, { status: 400 });
    }

    const currentPaid = invoice.paidAmount || 0;
    const remaining   = invoice.total - currentPaid;

    if (amount > remaining + 0.01) {
      return NextResponse.json({
        error: `El monto ($${amount}) supera el saldo pendiente ($${remaining.toFixed(2)})`
      }, { status: 400 });
    }

    const newPaidAmount = Math.min(currentPaid + amount, invoice.total);
    const newStatus     = newPaidAmount >= invoice.total - 0.01 ? 'paid' : 'partial';

    // Operations to run in transaction
    const txOps: any[] = [
      prisma.invoice.update({
        where: { id: params.id },
        data: { paidAmount: newPaidAmount, status: newStatus },
      }),
    ];

    // Create receipt if requested
    let receiptNumber: string | null = null;
    if (createReceipt && invoice.customerId) {
      const lastReceipt = await prisma.receipt.findFirst({ orderBy: { receiptNumber: 'desc' } });
      const nextNum = lastReceipt
        ? parseInt(lastReceipt.receiptNumber.replace(/^REC-/, '')) + 1
        : 1;
      receiptNumber = `REC-${nextNum.toString().padStart(6, '0')}`;

      const PM_MAP: Record<string, string> = {
        cash: 'cash', efectivo: 'cash',
        transfer: 'transfer', transferencia: 'transfer',
        check: 'check', cheque: 'check',
        card: 'card', tarjeta: 'card', mp: 'card',
      };
      const normalizedPM = PM_MAP[(paymentMethod || 'cash').toLowerCase()] || paymentMethod;

      txOps.push(
        prisma.receipt.create({
          data: {
            receiptNumber,
            customerId: invoice.customerId,
            customerName: invoice.customerName,
            totalAmount: amount,
            notes: notes || `Abono factura ${invoice.invoiceNumber}`,
            items: {
              create: [{ paymentMethod: normalizedPM, amount, reference: reference || null }],
            },
          },
        })
      );
    }

    // Update CustomerAccount if exists
    if (invoice.customerId) {
      const account = await prisma.customerAccount.findUnique({ where: { customerId: invoice.customerId } });
      if (account) {
        const newBalance = account.balance - amount;
        txOps.push(
          prisma.accountMovement.create({
            data: {
              type: 'credit',
              concept: 'invoice_payment',
              description: `Abono Factura ${invoice.invoiceNumber}${receiptNumber ? ` · ${receiptNumber}` : ''}`,
              amount,
              balance: newBalance,
              referenceType: 'invoice_payment',
              referenceId: params.id,
              customerAccountId: account.id,
            },
          })
        );
        txOps.push(
          prisma.customerAccount.update({
            where: { id: account.id },
            data: { balance: newBalance, lastMovementAt: new Date() },
          })
        );
      }
    }

    await prisma.$transaction(txOps);

    return NextResponse.json({
      success: true,
      invoiceId: params.id,
      invoiceNumber: invoice.invoiceNumber,
      amountPaid: amount,
      newPaidAmount,
      newBalance: invoice.total - newPaidAmount,
      newStatus,
      receiptNumber,
    });

  } catch (error) {
    console.error('[Invoice Payments POST]', error);
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 });
  }
}
