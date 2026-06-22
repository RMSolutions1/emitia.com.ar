// @ts-nocheck
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const body = await req.json();
    const { action, closingCash, notes } = body;

    const register = await prisma.cashRegister.findFirst({
      where: { id: params.id, companyId },
    });

    if (!register) {
      return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
    }

    if (action === 'close') {
      if (register.status !== 'open') {
        return NextResponse.json({ error: 'La caja ya está cerrada' }, { status: 400 });
      }

      // Get sales made during this register's period
      const sales = await prisma.sale.findMany({
        where: {
          companyId,
          createdAt: { gte: register.openingDate },
        },
      });

      const totalSales = sales.reduce((s, sale) => s + sale.total, 0);
      const totalCash = sales.filter(s => s.paymentMethod === 'cash' || s.paymentMethod === 'efectivo').reduce((s, sale) => s + sale.total, 0);
      const totalCard = sales.filter(s => s.paymentMethod === 'card' || s.paymentMethod === 'tarjeta').reduce((s, sale) => s + sale.total, 0);
      const totalTransfer = sales.filter(s => s.paymentMethod === 'transfer' || s.paymentMethod === 'transferencia').reduce((s, sale) => s + sale.total, 0);

      // Also count invoices created during this period
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId,
          createdAt: { gte: register.openingDate },
          status: { not: 'anulada' },
        },
      });
      const invoiceTotal = invoices.reduce((s, inv) => s + inv.total, 0);

      // Also count tickets
      const tickets = await prisma.ticket.findMany({
        where: {
          companyId,
          createdAt: { gte: register.openingDate },
          status: { not: 'anulado' },
        },
      });
      const ticketTotal = tickets.reduce((s, t) => s + t.total, 0);

      const totalComprobantes = invoiceTotal + ticketTotal;
      const expectedCash = register.openingCash + totalCash;
      const difference = (closingCash || 0) - expectedCash;

      const updated = await prisma.cashRegister.update({
        where: { id: params.id },
        data: {
          status: 'closed',
          closingDate: new Date(),
          closingCash: closingCash || 0,
          totalSales: totalSales + totalComprobantes,
          totalCash,
          totalCard,
          totalTransfer,
          notes: notes || register.notes,
        },
      });

      return NextResponse.json({
        register: updated,
        summary: {
          openingCash: register.openingCash,
          closingCash: closingCash || 0,
          totalSales,
          totalComprobantes,
          totalCash,
          totalCard,
          totalTransfer,
          expectedCash,
          difference,
          salesCount: sales.length,
          invoicesCount: invoices.length,
          ticketsCount: tickets.length,
        },
      });
    }

    // Generic update
    const updated = await prisma.cashRegister.update({
      where: { id: params.id },
      data: { notes },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating cash register:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const register = await prisma.cashRegister.findFirst({
      where: { id: params.id, companyId },
    });

    if (!register) {
      return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 });
    }

    // Get live summary if open
    if (register.status === 'open') {
      const sales = await prisma.sale.findMany({
        where: {
          companyId,
          createdAt: { gte: register.openingDate },
        },
      });

      const invoices = await prisma.invoice.findMany({
        where: {
          companyId,
          createdAt: { gte: register.openingDate },
          status: { not: 'anulada' },
        },
      });

      const tickets = await prisma.ticket.findMany({
        where: {
          companyId,
          createdAt: { gte: register.openingDate },
          status: { not: 'anulado' },
        },
      });

      const totalSales = sales.reduce((s, sale) => s + sale.total, 0);
      const totalCash = sales.filter(s => s.paymentMethod === 'cash' || s.paymentMethod === 'efectivo').reduce((s, sale) => s + sale.total, 0);
      const totalCard = sales.filter(s => s.paymentMethod === 'card' || s.paymentMethod === 'tarjeta').reduce((s, sale) => s + sale.total, 0);
      const totalTransfer = sales.filter(s => s.paymentMethod === 'transfer' || s.paymentMethod === 'transferencia').reduce((s, sale) => s + sale.total, 0);
      const invoiceTotal = invoices.reduce((s, inv) => s + inv.total, 0);
      const ticketTotal = tickets.reduce((s, t) => s + t.total, 0);

      return NextResponse.json({
        register,
        liveSummary: {
          totalSales,
          totalCash,
          totalCard,
          totalTransfer,
          invoiceTotal,
          ticketTotal,
          expectedCash: register.openingCash + totalCash,
          salesCount: sales.length,
          invoicesCount: invoices.length,
          ticketsCount: tickets.length,
        },
      });
    }

    return NextResponse.json({ register });
  } catch (error: any) {
    console.error('Error getting cash register:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
