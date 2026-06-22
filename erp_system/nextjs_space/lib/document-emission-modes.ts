export type DocumentEmissionMode = 'factura' | 'presupuesto' | 'remito';

export interface DocumentEmissionModeConfig {
  id: DocumentEmissionMode;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
}

export const DOCUMENT_EMISSION_MODES: DocumentEmissionModeConfig[] = [
  {
    id: 'factura',
    label: 'Factura / Fiscal',
    shortLabel: 'Factura',
    description: 'Facturas, NC, ND y recibos con CAE ARCA',
    href: '/facturacion/emitir?modo=factura',
  },
  {
    id: 'presupuesto',
    label: 'Presupuesto',
    shortLabel: 'Presupuesto',
    description: 'Cotización no fiscal con mismo formato de impresión',
    href: '/facturacion/emitir?modo=presupuesto',
  },
  {
    id: 'remito',
    label: 'Remito',
    shortLabel: 'Remito',
    description: 'Comprobante de entrega de mercadería',
    href: '/facturacion/emitir?modo=remito',
  },
];

export function parseEmissionMode(value: string | null | undefined): DocumentEmissionMode {
  if (value === 'presupuesto' || value === 'remito') return value;
  return 'factura';
}

export function emissionHref(mode: DocumentEmissionMode): string {
  return `/facturacion/emitir?modo=${mode}`;
}
