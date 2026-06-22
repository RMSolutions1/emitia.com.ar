import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { VentasClient } from './ventas-client';

export default async function VentasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <VentasClient />;
}
