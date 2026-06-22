import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PuntosVentaClient } from './puntos-venta-client';

export default async function PuntosVentaPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <PuntosVentaClient />;
}
