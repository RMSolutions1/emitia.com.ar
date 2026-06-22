import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ContadorIAClient } from './contador-ia-client';

export default async function ContadorIAPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <ContadorIAClient />;
}
