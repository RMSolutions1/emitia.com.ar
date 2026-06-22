import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PosClient } from './pos-client';

export default async function PosPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <PosClient />;
}
