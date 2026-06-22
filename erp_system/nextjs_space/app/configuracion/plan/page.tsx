import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Suspense } from 'react';
import PlanClient from './plan-client';

export default async function PlanPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando plan…</div>}>
      <PlanClient />
    </Suspense>
  );
}
