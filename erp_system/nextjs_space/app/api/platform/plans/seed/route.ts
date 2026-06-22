import { NextResponse } from 'next/server';
import { ensurePlatformPlans } from '@/lib/platform-plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensurePlatformPlans();
    return NextResponse.json({ message: 'Planes sincronizados' });
  } catch (error) {
    console.error('Error al sincronizar planes:', error);
    return NextResponse.json({ error: 'Error al sincronizar planes' }, { status: 500 });
  }
}
