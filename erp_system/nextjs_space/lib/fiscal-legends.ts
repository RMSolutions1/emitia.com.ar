/**
 * Leyendas fiscales obligatorias ARCA/AFIP para comprobantes impresos.
 * Referencias: RG 4290, RG 5616, Ley 27.743 (Transparencia Fiscal al Consumidor).
 */

export const AFIP_DISCLAIMER =
  'Esta Administración Federal no se responsabiliza por los datos ingresados en el detalle de la operación';

export const TRANSPARENCY_REGIME_TITLE =
  'Régimen de Transparencia Fiscal al Consumidor (Ley 27.743)';

export const NON_FISCAL_TICKET_LEGEND =
  'DOCUMENTO NO VÁLIDO COMO FACTURA';

export const NON_FISCAL_BUDGET_LEGEND =
  'Documento no fiscal — Válido únicamente como presupuesto';

export const NON_FISCAL_REMITO_LEGEND =
  'Documento no fiscal — Remito de entrega sin validez tributaria';

export const AUTHORIZED_VOUCHER_LEGEND = 'Comprobante Autorizado';

export interface FiscalTransparencyAmounts {
  ivaAmount: number;
  otherNationalTaxes: number;
}

/** Facturas B/C, tickets y recibos al consumidor deben incluir leyenda Ley 27.743 */
export function requiresConsumerTransparency(documentLetter: string, documentType: string): boolean {
  if (!['factura', 'nota_credito', 'nota_debito', 'ticket', 'recibo'].includes(documentType)) {
    return false;
  }
  return ['B', 'C', 'X'].includes(documentLetter);
}

export function computeTransparencyAmounts(input: {
  documentLetter: string;
  ivaTotal?: number;
  otherTaxes?: number;
  total?: number;
}): FiscalTransparencyAmounts {
  const ivaAmount = Math.max(0, input.ivaTotal ?? 0);
  const otherNationalTaxes = Math.max(0, input.otherTaxes ?? 0);

  // Factura B/C: IVA incluido en precio — estimar si no viene desglosado
  if (ivaAmount === 0 && input.total && ['B', 'C'].includes(input.documentLetter)) {
    const estimatedIva = input.total - input.total / 1.21;
    return {
      ivaAmount: Math.round(estimatedIva * 100) / 100,
      otherNationalTaxes,
    };
  }

  return { ivaAmount, otherNationalTaxes: otherNationalTaxes };
}

export function formatCurrencyArs(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

export interface FiscalLegendBlock {
  title?: string;
  lines: string[];
}

export function buildFiscalLegendBlocks(input: {
  documentLetter: string;
  documentType: string;
  ivaTotal?: number;
  otherTaxes?: number;
  total?: number;
  legalText?: string;
}): FiscalLegendBlock[] {
  const blocks: FiscalLegendBlock[] = [];

  if (requiresConsumerTransparency(input.documentLetter, input.documentType)) {
    const { ivaAmount, otherNationalTaxes } = computeTransparencyAmounts(input);
    blocks.push({
      title: TRANSPARENCY_REGIME_TITLE,
      lines: [
        `IVA Contenido: ${formatCurrencyArs(ivaAmount)}`,
        `Otros Impuestos Nacionales Indirectos: ${formatCurrencyArs(otherNationalTaxes)}`,
      ],
    });
  }

  if (input.legalText?.trim()) {
    blocks.push({ lines: [input.legalText.trim()] });
  }

  blocks.push({ lines: [AFIP_DISCLAIMER] });

  return blocks;
}
