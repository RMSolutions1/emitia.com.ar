import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { cancelPendingSale } from '@/lib/mp-sale';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { saleId } = await req.json();
    if (!saleId) {
      return NextResponse.json({ error: 'saleId requerido' }, { status: 400 });
    }

    const companyId = (session.user as any).companyId;
    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale || sale.companyId !== companyId) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    const result = await cancelPendingSale(saleId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cancelar venta' }, { status: 500 });
  }
}
