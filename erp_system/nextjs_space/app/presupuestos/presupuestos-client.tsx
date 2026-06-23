'use client';

import { useState, useEffect } from 'react';
import { FileCheck, Plus, Search, Eye, CheckCircle, XCircle, ArrowRight, Calendar, DollarSign, User, Printer, X, FileText, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { PrintDocument, DocumentData, DocumentCompany, DocumentCustomer } from '@/components/print-document';
import { ErpPageShell, ErpKpiBox } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface Quote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  validUntil: string;
  status: string;
  notes?: string;
  createdAt: string;
  items: QuoteItem[];
}

interface QuoteItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
}

interface BusinessConfig {
  businessName: string;
  legalName?: string;
  cuit?: string;
  address?: string;
  city?: string;
  province?: string;
  condicionIva?: string;
  iibb?: string;
  activityStartDate?: string;
  inicioActividades?: string;
  logoUrl?: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export default function PresupuestosClient() {
  const { userRole } = useErpSession();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, converted: 0, totalValue: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [printQuote, setPrintQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
    fetchBusinessConfig();
  }, [statusFilter]);

  const fetchBusinessConfig = async () => {
    try {
      const res = await fetch('/api/config/business');
      if (res.ok) {
        const data = await res.json();
        setBusinessConfig(data);
      }
    } catch (error) {
      console.error('Error al cargar config:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const url = statusFilter ? `/api/quotes?status=${statusFilter}` : '/api/quotes';
      const res = await fetch(url);
      const data = await res.json();
      setQuotes(data.quotes || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, converted: 0, totalValue: 0 });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToSale = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'Efectivo' }),
      });

      if (res.ok) {
        toast.success('Presupuesto convertido a venta');
        setShowModal(false);
        fetchQuotes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al convertir');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al convertir presupuesto');
    }
  };

  const handleUpdateStatus = async (quoteId: string, status: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success('Estado actualizado');
        setShowModal(false);
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredQuotes = quotes.filter(q =>
    q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      converted: 'bg-blue-100 text-blue-700',
      expired: 'bg-slate-100 text-slate-700',
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      converted: 'Convertido',
      expired: 'Vencido',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-slate-100 text-slate-700'}`}>{labels[status] || status}</span>;
  };

  const handlePrintQuote = (quote: Quote) => {
    setPrintQuote(quote);
  };

  const buildCompanyData = (): DocumentCompany => {
    return {
      businessName: businessConfig?.businessName || 'Mi Empresa',
      legalName: businessConfig?.legalName,
      cuit: businessConfig?.cuit || '',
      condicionIva: businessConfig?.condicionIva || 'responsable_inscripto',
      address: businessConfig?.address || '',
      city: businessConfig?.city || '',
      province: businessConfig?.province || '',
      iibb: businessConfig?.iibb || '',
      phone: businessConfig?.phone,
      email: businessConfig?.email,
      website: businessConfig?.website,
      fechaInicioActividad: businessConfig?.activityStartDate || businessConfig?.inicioActividades || '',
      logo: businessConfig?.logoUrl || businessConfig?.logo || '',
    };
  };

  const buildDocumentData = (quote: Quote): DocumentData => {
    const num = quote.quoteNumber.replace('P-', '');
    return {
      documentType: 'presupuesto',
      documentLetter: 'X',
      documentNumber: num,
      pointOfSale: 1,
      date: new Date(quote.createdAt),
      items: (quote.items || []).map(item => ({
        name: item.productName,
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        ivaRate: 21,
        subtotal: item.subtotal || (item.quantity * item.unitPrice),
      })),
      subtotal: quote.subtotal,
      ivaTotal: quote.tax,
      total: quote.total,
      observations: quote.notes || (quote.validUntil ? `Válido hasta: ${formatDate(quote.validUntil)}` : undefined),
      template: 'profesional',
    };
  };

  const buildCustomerData = (quote: Quote): DocumentCustomer => {
    return {
      name: quote.customerName || 'Consumidor Final',
      condicionIva: 'consumidor_final',
    };
  };

  if (loading) {
    return (
      <ErpPageShell title="Presupuestos" module="FACTURACIÓN" userRole={userRole}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-4"><div className="skeleton-shimmer h-12 rounded-2xl" /><div className="skeleton-shimmer h-[400px] rounded-2xl" /></div>
        </div>
      </ErpPageShell>
    );
  }

  return (
    <ErpPageShell
      title="Presupuestos emitidos"
      subtitle="Listado e historial · emisión en Emitir Comprobante"
      module="FACTURACIÓN"
      userRole={userRole}
      onRefresh={fetchQuotes}
      toolbar={[
        { label: 'Nuevo', icon: <Plus className="w-4 h-4" />, onClick: () => router.push('/facturacion/emitir?modo=presupuesto') },
      ]}
    >
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <ErpKpiBox
            label="Total"
            value={stats.total.toString()}
            icon={<ClipboardList className="w-5 h-5" />}
            color="#2563ad"
          />
          <ErpKpiBox
            label="Pendientes"
            value={stats.pending.toString()}
            icon={<Calendar className="w-5 h-5" />}
            color="#d97706"
          />
          <ErpKpiBox
            label="Convertidos"
            value={stats.converted.toString()}
            icon={<CheckCircle className="w-5 h-5" />}
            color="#16a34a"
          />
          <ErpKpiBox
            label="Valor Total"
            value={formatCurrency(stats.totalValue)}
            icon={<DollarSign className="w-5 h-5" />}
            color="#7c3aed"
          />
        </div>

        {/* Filtros */}
        <div className="erp-panel mb-4">
          <div className="erp-panel-header">
            <span>Filtros</span>
          </div>
          <div className="p-2 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9baac8]" />
              <input
                type="text"
                placeholder="Buscar por número o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="erp-input w-full pl-8"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="erp-input w-40"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="converted">Convertidos</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="erp-panel overflow-hidden">
          <div className="erp-panel-header">
            <span>Presupuestos</span>
            <span className="text-[10px] font-normal opacity-70">{filteredQuotes.length} registro(s)</span>
          </div>
          {filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#5c7291] gap-4">
              <ClipboardList className="w-14 h-14 text-[#b8c4dc]" />
              <div className="text-center">
                <p className="text-base font-bold text-[#1a3a5c]">
                  {quotes.length === 0 ? 'Todavía no hay presupuestos' : 'Sin resultados para la búsqueda'}
                </p>
                <p className="text-sm text-[#9baac8] mt-1">
                  {quotes.length === 0
                    ? 'Creá tu primer presupuesto desde "Emitir Comprobante"'
                    : 'Probá con otros términos o cambiá el filtro de estado'}
                </p>
              </div>
              {quotes.length === 0 && (
                <button
                  onClick={() => router.push('/facturacion/emitir?modo=presupuesto')}
                  className="erp-btn-primary flex items-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Crear Presupuesto
                </button>
              )}
            </div>
          ) : (
            <table className="erp-grid-table w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Número</th>
                  <th>Cliente</th>
                  <th className="text-right">Total</th>
                  <th>Válido hasta</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="cursor-pointer" onClick={() => { setSelectedQuote(quote); setShowModal(true); }}>
                    <td><span className="font-mono font-bold text-[#2563ad]">{quote.quoteNumber}</span></td>
                    <td>{quote.customerName}</td>
                    <td className="text-right font-semibold">{formatCurrency(quote.total)}</td>
                    <td>{formatDate(quote.validUntil)}</td>
                    <td>{getStatusBadge(quote.status)}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedQuote(quote); setShowModal(true); }}
                          className="erp-btn-secondary !p-1 !text-[10px] flex items-center gap-1"
                          title="Ver detalle"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePrintQuote(quote); }}
                          className="erp-btn-secondary !p-1"
                          title="Imprimir presupuesto"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      {/* Modal Ver Presupuesto */}
      {showModal && selectedQuote && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedQuote.quoteNumber}</h2>
                <p className="text-slate-500">{selectedQuote.customerName}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintQuote(selectedQuote)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Imprimir"
                >
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div><span className="text-slate-500">Fecha:</span> <span className="font-medium">{formatDate(selectedQuote.createdAt)}</span></div>
                <div><span className="text-slate-500">Válido hasta:</span> <span className="font-medium">{formatDate(selectedQuote.validUntil)}</span></div>
                <div><span className="text-slate-500">Estado:</span> {getStatusBadge(selectedQuote.status)}</div>
                {selectedQuote.customerEmail && (
                  <div><span className="text-slate-500">Email:</span> <span className="font-medium">{selectedQuote.customerEmail}</span></div>
                )}
              </div>

              {/* Items */}
              <h4 className="font-semibold text-slate-900 mb-3 mt-4">Productos</h4>
              <div className="space-y-2">
                {selectedQuote.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-slate-500">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t space-y-2">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedQuote.subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA (21%)</span><span>{formatCurrency(selectedQuote.tax)}</span></div>
                {selectedQuote.discount > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>-{formatCurrency(selectedQuote.discount)}</span></div>}
                <div className="flex justify-between text-xl font-bold"><span>Total</span><span>{formatCurrency(selectedQuote.total)}</span></div>
              </div>
              {selectedQuote.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800"><span className="font-medium">Notas:</span> {selectedQuote.notes}</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              {selectedQuote.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, 'rejected')}
                    className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, 'approved')}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 shadow-sm shadow-emerald-500/20 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar
                  </button>
                </>  
              )}
              {(selectedQuote.status === 'pending' || selectedQuote.status === 'approved') && (
                <>
                  <button
                    onClick={() => handleConvertToSale(selectedQuote.id)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/20 flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Convertir a Venta
                  </button>
                  <button
                    onClick={() => router.push(`/facturacion/emitir?fromQuote=${selectedQuote.id}`)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Facturar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print Document */}
      {printQuote && businessConfig && (
        <PrintDocument
          company={buildCompanyData()}
          customer={buildCustomerData(printQuote)}
          document={buildDocumentData(printQuote)}
          onClose={() => setPrintQuote(null)}
        />
      )}
    </ErpPageShell>
  );
}
