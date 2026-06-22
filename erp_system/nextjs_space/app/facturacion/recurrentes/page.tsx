import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecurrentesClient } from './recurrentes-client';

export default async function RecurrentesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <RecurrentesClient />;
}
