'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { FileSpreadsheet, FileCheck, Truck } from 'lucide-react';
import { DOCUMENT_EMISSION_MODES, parseEmissionMode, type DocumentEmissionMode } from '@/lib/document-emission-modes';

const ICONS: Record<DocumentEmissionMode, typeof FileSpreadsheet> = {
  factura: FileSpreadsheet,
  presupuesto: FileCheck,
  remito: Truck,
};

export function DocumentEmissionTabs({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname.startsWith('/facturacion/emitir')
    ? parseEmissionMode(searchParams.get('modo'))
    : null;

  if (!active) return null;

  return (
    <div className={`flex flex-wrap gap-1 border-b border-[#b8c9dc] pb-2 mb-3 ${className}`}>
      {DOCUMENT_EMISSION_MODES.map((mode) => {
        const Icon = ICONS[mode.id];
        const isActive = active === mode.id;
        return (
          <Link
            key={mode.id}
            href={mode.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
              isActive
                ? 'bg-[#2563ad] text-white border-[#1e4d8c]'
                : 'bg-white text-[#1a3a5c] border-[#9bb3cc] hover:bg-[#eef3f9]'
            }`}
            title={mode.description}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {mode.shortLabel}
          </Link>
        );
      })}
      <span className="ml-auto text-[10px] text-[#5c7291] self-center hidden sm:inline">
        Tickets fiscales → Punto de Venta (POS)
      </span>
    </div>
  );
}
