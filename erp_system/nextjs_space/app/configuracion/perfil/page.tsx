import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PerfilClient } from './perfil-client';

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <PerfilClient />;
}
