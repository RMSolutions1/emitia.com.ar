import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TicketsClient from './tickets-client';

export default async function TicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }
  return <TicketsClient />;
}
