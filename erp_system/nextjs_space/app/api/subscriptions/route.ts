import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const isSuperadmin = (session.user as any).role === 'superadmin';

    const where: any = {};
    if (!isSuperadmin && companyId) {
      where.companyId = companyId;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: { items: true },
      orderBy: { nextBillingDate: 'asc' },
    });

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
    }

    const body = await req.json();
    const { name, customerId, customerName, amount, frequency, dayOfMonth, startDate, endDate, invoiceType, items, notes } = body;

    const subscription = await prisma.subscription.create({
      data: {
        companyId,
        name,
        customerId,
        customerName,
        amount: parseFloat(amount),
        frequency,
        dayOfMonth,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextBillingDate: new Date(startDate),
        invoiceType: invoiceType || 'B',
        notes,
        items: items ? { create: items } : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
