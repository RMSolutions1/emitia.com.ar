import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { adjustProductStock } from '@/lib/stock';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const isSuperadmin = (session.user as any).role === 'superadmin';

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') ?? '';
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (!isSuperadmin && companyId) {
      where.companyId = companyId;
    }
    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
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
    const {
      customerId,
      items,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      cashReceived,
      change,
      notes,
      sellerId,
      status: requestedStatus,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Debe agregar al menos un producto' }, { status: 400 });
    }

    const saleStatus =
      requestedStatus === 'pending_payment' ? 'pending_payment' : 'completed';

    // Generar número de venta
    const lastSale = await prisma.sale.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
    const nextNum = lastSale ? parseInt(lastSale.saleNumber.split('-')[1] || '0') + 1 : 1;
    const saleNumber = `V-${String(nextNum).padStart(5, '0')}`;

    const sale = await prisma.sale.create({
      data: {
        companyId,
        saleNumber,
        customerId: customerId || null,
        sellerId: sellerId || null,
        userId: (session.user as any).id,
        subtotal: parseFloat(subtotal),
        tax: parseFloat(tax || 0),
        discount: parseFloat(discount || 0),
        total: parseFloat(total),
        paymentMethod,
        cashReceived: cashReceived ? parseFloat(cashReceived) : null,
        change: change ? parseFloat(change) : null,
        notes,
        status: saleStatus,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            discount: parseFloat(item.discount || 0),
            subtotal: parseFloat(item.subtotal),
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
      },
    });

    if (saleStatus === 'completed') {
      for (const item of items) {
        await adjustProductStock({
          companyId,
          productId: item.productId,
          delta: -item.quantity,
          type: 'out',
          reason: 'Venta',
          reference: saleNumber,
          userId: (session.user as any).id,
        });
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Error al crear venta:', error);
    return NextResponse.json({ error: 'Error al crear venta' }, { status: 500 });
  }
}
