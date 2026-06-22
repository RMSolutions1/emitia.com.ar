// @ts-nocheck
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const registers = await prisma.cashRegister.findMany({
      where: {
        companyId,
        ...(status ? { status } : {}),
      },
      orderBy: { openingDate: 'desc' },
      take: 50,
    });

    // Check if there's an open register
    const openRegister = registers.find(r => r.status === 'open');

    return NextResponse.json({ registers, openRegister });
  } catch (error: any) {
    console.error('Error cash registers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: 'Sin empresa' }, { status: 403 });

    const body = await req.json();
    const { openingCash, pointOfSale, notes } = body;

    // Check if there's already an open register for this POS
    const existingOpen = await prisma.cashRegister.findFirst({
      where: { companyId, status: 'open', pointOfSale: pointOfSale || 1 },
    });

    if (existingOpen) {
      return NextResponse.json({ error: 'Ya existe una caja abierta para este punto de venta' }, { status: 400 });
    }

    const register = await prisma.cashRegister.create({
      data: {
        companyId,
        pointOfSale: pointOfSale || 1,
        openingCash: openingCash || 0,
        status: 'open',
        notes,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json(register);
  } catch (error: any) {
    console.error('Error creating cash register:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
