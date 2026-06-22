'use client';

import { useState, useEffect } from 'react';
import { FileCheck, Plus, Search, Eye, CheckCircle, XCircle, ArrowRight, Calendar, DollarSign, User, Printer, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { PrintDocument, DocumentData, DocumentCompany, DocumentCustomer } from '@/components/print-document';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
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

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
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
  const [showNewModal, setShowNewModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [printQuote, setPrintQuote] = useState<Quote | null>(null);
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quoteItems, setQuoteItems] = useState<{ productId: string; productName: string; productSku: string; quantity: number; unitPrice: number }[]>([]);
  const [validDays, setValidDays] = useState(15);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchQuotes();
    fetchProducts();
    fetchCustomers();
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

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedCustomer || quoteItems.length === 0) {
      toast.error('Seleccioná un cliente y agregá productos');
      return;
    }

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email,
          customerPhone: selectedCustomer.phone,
          items: quoteItems,
          validDays,
          notes,
        }),
      });

      if (res.ok) {
        toast.success('Presupuesto creado exitosamente');
        setShowNewModal(false);
        resetForm();
        fetchQuotes();
      } else {
        toast.error('Error al crear presupuesto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear presupuesto');
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

  const resetForm = () => {
    setSelectedCustomer(null);
    setQuoteItems([]);
    setValidDays(15);
    setNotes('');
  };

  const addProductToQuote = (product: Product) => {
    const existing = quoteItems.find(i => i.productId === product.id);
    if (existing) {
      setQuoteItems(quoteItems.map(i => 
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setQuoteItems([...quoteItems, {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        unitPrice: product.price,
      }]);
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
    };
  };

  const buildCustomerData = (quote: Quote): DocumentCustomer => {
    return {
      name: quote.customerName || 'Consumidor Final',
      condicionIva: 'consumidor_final',
    };
  };

  const quoteTotal = quoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

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
      title="Presupuestos"
      subtitle="Crea y gestiona presupuestos para tus clientes"
      module="FACTURACIÓN"
      userRole={userRole}
      onRefresh={fetchQuotes}
      toolbar={[
        { label: 'Nuevo', icon: <Plus className="w-4 h-4" />, onClick: () => setShowNewModal(true) },
      ]}
    >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-slate-500">Convertidos</p>
            <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <p className="text-sm text-slate-500">Valor Total</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="erp-panel p-4 mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por número o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="converted">Convertidos</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>

        {/* Table */}
        <div className="erp-panel overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Número</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Válido hasta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{quote.quoteNumber}</td>
                  <td className="px-6 py-4">{quote.customerName}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(quote.total)}</td>
                  <td className="px-6 py-4">{formatDate(quote.validUntil)}</td>
                  <td className="px-6 py-4">{getStatusBadge(quote.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedQuote(quote); setShowModal(true); }}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>
                      <button
                        onClick={() => handlePrintQuote(quote)}
                        className="text-green-600 hover:text-green-800 p-1"
                        title="Imprimir presupuesto"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Modal Nuevo Presupuesto */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nuevo Presupuesto</h2>
              <button onClick={() => { setShowNewModal(false); resetForm(); }} className="text-slate-500 hover:text-slate-700 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] grid grid-cols-2 gap-6">
              {/* Columna Izquierda - Cliente y Productos */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">Seleccionar cliente</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Válido por (días)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 15)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agregar Productos</label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    {products.slice(0, 20).map(p => (
                      <button
                        key={p.id}
                        onClick={() => addProductToQuote(p)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex justify-between items-center border-b last:border-b-0"
                      >
                        <span>{p.name}</span>
                        <span className="text-slate-500">{formatCurrency(p.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Columna Derecha - Items y Total */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Items del Presupuesto</label>
                  <div className="border rounded-lg p-4 min-h-[200px]">
                    {quoteItems.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">Agrega productos al presupuesto</p>
                    ) : (
                      <div className="space-y-2">
                        {quoteItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.productName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const qty = parseInt(e.target.value) || 1;
                                    setQuoteItems(quoteItems.map((i, iIdx) => iIdx === idx ? { ...i, quantity: qty } : i));
                                  }}
                                  className="w-16 px-2 py-1 border rounded text-sm"
                                  min="1"
                                />
                                <span className="text-sm text-slate-500">x {formatCurrency(item.unitPrice)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</p>
                              <button
                                onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                                className="text-red-500 text-sm hover:text-red-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(quoteTotal * 1.21)}</span>
                  </div>
                  <p className="text-sm text-slate-500">Incluye 21% IVA</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => { setShowNewModal(false); resetForm(); }}
                className="px-4 py-2 border rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateQuote}
                disabled={!selectedCustomer || quoteItems.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/20 disabled:opacity-50"
              >
                Crear Presupuesto
              </button>
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
