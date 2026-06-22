'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Receipt, Search, Printer, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';
import { PrintDocument } from '@/components/print-document';
import { buildReceiptWhatsAppMessage, buildWhatsAppShareUrl } from '@/lib/whatsapp-share';

interface ReceiptRecord {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  date: string;
  createdAt: string;
  notes?: string;
  items: { paymentMethod: string; amount: number }[];
}

export default function RecibosClient() {
  const { userRole } = useErpSession();
  const router = useRouter();
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [printReceipt, setPrintReceipt] = useState<ReceiptRecord | null>(null);
  const [businessConfig, setBusinessConfig] = useState<any>(null);

  useEffect(() => {
    fetchReceipts();
    fetch('/api/config/business')
      .then((r) => r.ok ? r.json() : null)
      .then(setBusinessConfig)
      .catch(() => {});
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/receipts');
      const data = await res.json();
      setReceipts(Array.isArray(data) ? data : data.receipts || []);
    } catch {
      toast.error('Error al cargar recibos');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);

  const filtered = receipts.filter(
    (r) =>
      r.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Efectivo', transfer: 'Transferencia', check: 'Cheque', card: 'Tarjeta', mercadopago: 'Mercado Pago',
  };

  return (
    <ErpPageShell
      title="Recibos de cobranza"
      subtitle="Comprobantes internos · para recibo fiscal AFIP use Emitir Comprobante"
      module="FACTURACIÓN"
      userRole={userRole}
      onRefresh={fetchReceipts}
      toolbar={[
        {
          label: 'Recibo fiscal',
          icon: <FileText className="w-4 h-4" />,
          onClick: () => router.push('/facturacion/emitir?modo=factura'),
        },
      ]}
    >
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-sm text-amber-900">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
        <div>
          Los recibos <strong>REC-*</strong> son comprobantes internos de cobranza (sin CAE).
          Para cumplir AFIP emití <strong>Recibo B/C</strong> desde{' '}
          <Link href="/facturacion/emitir?modo=factura" className="underline font-medium">Emitir Comprobante</Link>.
        </div>
      </div>

      <div className="erp-panel mb-4 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5c7291]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número o cliente..."
            className="erp-input w-full pl-9"
          />
        </div>
      </div>

      <div className="erp-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#eef3f9] border-b border-[#b8c9dc]">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-[#1a3a5c]">Número</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-[#1a3a5c]">Cliente</th>
              <th className="px-4 py-2 text-left text-[11px] font-bold text-[#1a3a5c]">Fecha</th>
              <th className="px-4 py-2 text-right text-[11px] font-bold text-[#1a3a5c]">Importe</th>
              <th className="px-4 py-2 text-center text-[11px] font-bold text-[#1a3a5c]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-[#5c7291]">Cargando…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-[#5c7291]">No hay recibos registrados</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-b border-[#dce6f2] hover:bg-[#f8fafc]">
                <td className="px-4 py-3 font-mono font-medium">{r.receiptNumber}</td>
                <td className="px-4 py-3">{r.customerName}</td>
                <td className="px-4 py-3">{new Date(r.date || r.createdAt).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-3 text-right font-semibold">{fmt(r.totalAmount)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button type="button" onClick={() => setPrintReceipt(r)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Imprimir">
                      <Printer className="w-4 h-4" />
                    </button>
                    <a
                      href={buildWhatsAppShareUrl(
                        buildReceiptWhatsAppMessage({
                          companyName: businessConfig?.businessName || 'EMITIA',
                          receiptNumber: r.receiptNumber,
                          amount: r.totalAmount,
                          customerName: r.customerName,
                        })
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded text-xs font-medium"
                      title="WhatsApp"
                    >
                      WA
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {printReceipt && businessConfig && (
        <PrintDocument
          company={{
            businessName: businessConfig.businessName || '',
            legalName: businessConfig.legalName,
            cuit: businessConfig.cuit,
            condicionIva: businessConfig.condicionIva,
            address: businessConfig.address,
            city: businessConfig.city,
            province: businessConfig.province,
          }}
          customer={{ name: printReceipt.customerName }}
          document={{
            documentType: 'recibo',
            documentLetter: 'X',
            documentNumber: printReceipt.receiptNumber,
            pointOfSale: businessConfig.defaultPOS || 1,
            date: new Date(printReceipt.date || printReceipt.createdAt),
            items: printReceipt.items.map((it) => ({
              name: `Pago — ${PAYMENT_LABELS[it.paymentMethod] || it.paymentMethod}`,
              quantity: 1,
              unitPrice: it.amount,
              subtotal: it.amount,
            })),
            subtotal: printReceipt.totalAmount,
            total: printReceipt.totalAmount,
            template: 'profesional',
            observations: 'Comprobante interno de cobranza — NO FISCAL. Para recibo con CAE use Emitir Comprobante.',
          }}
          onClose={() => setPrintReceipt(null)}
        />
      )}
    </ErpPageShell>
  );
}
