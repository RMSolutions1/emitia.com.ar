import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AFIPConfigClient from './afip-config-client';

export default async function AFIPConfigPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return <AFIPConfigClient />;
}
