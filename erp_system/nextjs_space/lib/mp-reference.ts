export const MP_REF_PREFIX_INVOICE = 'inv_';
export const MP_REF_PREFIX_SAAS = 'saas_';

export function mpRefForSale(saleId: string): string {
  return saleId;
}

export function mpRefForInvoice(invoiceId: string): string {
  return `${MP_REF_PREFIX_INVOICE}${invoiceId}`;
}

export function mpRefForSaas(companyId: string): string {
  return `${MP_REF_PREFIX_SAAS}${companyId}`;
}

export function parseMpExternalReference(
  ref: string | null | undefined
): { type: 'sale'; id: string } | { type: 'invoice'; id: string } | { type: 'saas'; id: string } | null {
  if (!ref) return null;
  if (ref.startsWith(MP_REF_PREFIX_INVOICE)) {
    return { type: 'invoice', id: ref.slice(MP_REF_PREFIX_INVOICE.length) };
  }
  if (ref.startsWith(MP_REF_PREFIX_SAAS)) {
    return { type: 'saas', id: ref.slice(MP_REF_PREFIX_SAAS.length) };
  }
  return { type: 'sale', id: ref };
}
