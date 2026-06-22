/** Genera URL wa.me para compartir texto (link de pago, comprobante, etc.) */
export function buildWhatsAppShareUrl(text: string, phone?: string | null): string {
  const encoded = encodeURIComponent(text);
  const digits = phone?.replace(/\D/g, '') || '';
  if (digits.length >= 10) {
    const intl = digits.startsWith('54') ? digits : `54${digits.replace(/^0/, '')}`;
    return `https://wa.me/${intl}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function buildInvoicePaymentWhatsAppMessage(params: {
  companyName: string;
  invoiceNumber: string;
  total: number;
  checkoutUrl?: string | null;
  customerName?: string;
}): string {
  const amount = params.total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  let msg = `Hola${params.customerName ? ` ${params.customerName}` : ''},\n\n`;
  msg += `Te enviamos el comprobante *${params.invoiceNumber}* de *${params.companyName}* por ${amount}.\n\n`;
  if (params.checkoutUrl) {
    msg += `Podés abonar con Mercado Pago aquí:\n${params.checkoutUrl}\n\n`;
  }
  msg += 'Gracias.';
  return msg;
}

export function buildReceiptWhatsAppMessage(params: {
  companyName: string;
  receiptNumber: string;
  amount: number;
  customerName?: string;
}): string {
  const amount = params.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  return `Hola${params.customerName ? ` ${params.customerName}` : ''},\n\nConfirmamos el cobro *${params.receiptNumber}* de *${params.companyName}* por ${amount}.\n\nGracias.`;
}
