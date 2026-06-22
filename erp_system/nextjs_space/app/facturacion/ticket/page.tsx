import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmitirTicketClient } from './emitir-ticket-client';

export default async function EmitirTicketPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <EmitirTicketClient />;
}
