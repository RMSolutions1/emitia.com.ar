'use client';

import { useState } from 'react';
import { CreditCard, QrCode, Copy, Loader2, ExternalLink, CheckCircle, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { buildInvoicePaymentWhatsAppMessage, buildWhatsAppShareUrl } from '@/lib/whatsapp-share';

interface MpInvoicePaymentPanelProps {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  paidAmount?: number;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  companyName?: string;
  compact?: boolean;
}

export function MpInvoicePaymentPanel({
  invoiceId,
  invoiceNumber,
  total,
  paidAmount = 0,
  customerEmail,
  customerPhone,
  customerName,
  companyName = 'EMITIA',
  compact = false,
}: MpInvoicePaymentPanelProps) {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const pending = Math.max(0, total - paidAmount);

  const generatePayment = async (mode: 'both' | 'link' | 'qr' = 'both') => {
    if (pending <= 0) {
      toast.error('Este comprobante ya está pagado');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/payments/mercadopago/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, mode, customerEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'No se pudo generar cobro MP');
        return;
      }
      setCheckoutUrl(data.checkoutUrl || null);
      setQrImage(data.qrImage || null);
      toast.success('Cobro Mercado Pago generado');
    } catch {
      toast.error('Error al generar cobro');
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    if (!checkoutUrl && !qrImage) {
      toast.error('Generá el cobro primero');
      return;
    }
    const msg = buildInvoicePaymentWhatsAppMessage({
      companyName,
      invoiceNumber,
      total: pending,
      checkoutUrl,
      customerName,
    });
    window.open(buildWhatsAppShareUrl(msg, customerPhone), '_blank');
  };

  const copyLink = async () => {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    toast.success('Link de pago copiado');
  };

  if (pending <= 0) {
    return (
      <div className={`flex items-center gap-2 text-emerald-700 ${compact ? 'text-xs' : 'text-sm'} bg-emerald-50 border border-emerald-200 rounded-lg p-2.5`}>
        <CheckCircle className="w-4 h-4 shrink-0" />
        Comprobante pagado
      </div>
    );
  }

  return (
    <div className={`border border-sky-200 bg-sky-50/60 rounded-lg ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className={`font-semibold text-sky-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          Cobro Mercado Pago · Saldo ${pending.toLocaleString('es-AR')}
        </p>
        {!checkoutUrl && !qrImage && (
          <button
            type="button"
            onClick={() => generatePayment('both')}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
            Generar cobro
          </button>
        )}
      </div>

      {(checkoutUrl || qrImage) && (
        <div className={`grid gap-3 ${qrImage && checkoutUrl ? 'sm:grid-cols-2' : ''}`}>
          {qrImage && (
            <div className="text-center bg-white rounded-lg border border-sky-100 p-3">
              <div className="flex items-center justify-center gap-1 text-xs font-medium text-sky-800 mb-2">
                <QrCode className="w-3.5 h-3.5" /> QR de pago
              </div>
              <img
                src={qrImage.startsWith('data:') ? qrImage : `data:image/png;base64,${qrImage}`}
                alt={`QR pago ${invoiceNumber}`}
                className="mx-auto w-36 h-36 object-contain"
              />
              <p className="text-[10px] text-slate-500 mt-2">Escaneá con Mercado Pago</p>
            </div>
          )}
          {checkoutUrl && (
            <div className="bg-white rounded-lg border border-sky-100 p-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-sky-800">Link de pago</p>
              <p className="text-[10px] text-slate-500 break-all line-clamp-3">{checkoutUrl}</p>
              <div className="flex gap-2 mt-auto flex-wrap">
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs border rounded-lg hover:bg-slate-50 min-w-[80px]"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </button>
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 min-w-[80px]"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs bg-sky-600 text-white rounded-lg hover:bg-sky-700 min-w-[80px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
