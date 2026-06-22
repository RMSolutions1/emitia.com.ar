import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmitirFacturaClient } from './emitir-factura-client';

export default async function EmitirFacturaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <Suspense fallback={<div className="erp-window min-h-screen flex items-center justify-center bg-[#dce6f2]"><div className="animate-spin h-8 w-8 border-4 border-[#2563ad] border-t-transparent" /></div>}>
      <EmitirFacturaClient />
    </Suspense>
  );
}
