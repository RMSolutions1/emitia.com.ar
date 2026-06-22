import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ClientesClient } from './clientes-client';

export default async function ClientesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <ClientesClient />;
}
