'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { parseEmissionMode } from '@/lib/document-emission-modes';
import { EmitirFacturaClient } from './emitir-factura-client';
import { EmitirPresupuestoClient } from './emitir-presupuesto-client';
import { EmitirRemitoClient } from '../remito/emitir-remito-client';

function EmitirHubInner() {
  const searchParams = useSearchParams();
  const mode = parseEmissionMode(searchParams.get('modo'));

  if (mode === 'presupuesto') return <EmitirPresupuestoClient />;
  if (mode === 'remito') return <EmitirRemitoClient />;
  return <EmitirFacturaClient />;
}

export function EmitirHubClient() {
  return (
    <Suspense
      fallback={
        <div className="erp-window min-h-screen flex items-center justify-center bg-[#dce6f2]">
          <div className="animate-spin h-8 w-8 border-4 border-[#2563ad] border-t-transparent" />
        </div>
      }
    >
      <EmitirHubInner />
    </Suspense>
  );
}
