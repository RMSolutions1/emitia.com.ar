import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { InventarioClient } from './inventario-client';

export default async function InventarioPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <InventarioClient />;
}
