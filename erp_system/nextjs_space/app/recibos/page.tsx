import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RecibosClient from './recibos-client';

export default async function RecibosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <RecibosClient />;
}
