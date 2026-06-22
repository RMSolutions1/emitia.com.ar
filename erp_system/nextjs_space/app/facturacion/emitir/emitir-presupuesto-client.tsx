'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  Loader2,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { PrintDocument, DocumentData, DocumentCompany, DocumentCustomer } from '@/components/print-document';
import { ErpDocumentShell, ErpFieldRow } from '@/components/erp/erp-document-shell';
import { DocumentEmissionTabs } from '@/components/erp/document-emission-tabs';
import { useErpSession } from '@/components/erp/use-erp-session';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document?: string;
  address?: string;
  city?: string;
  taxCondition?: string;
}

interface QuoteItem {
  productId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
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
  fechaInicioActividad?: string;
  inicioActividades?: string;
  activityStartDate?: string;
  logo?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  defaultPOS?: number;
}

export function EmitirPresupuestoClient() {
  const { userRole } = useErpSession();
  const router = useRouter();
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [validDays, setValidDays] = useState(15);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdQuote, setCreatedQuote] = useState<any>(null);
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    fetch('/api/config/business')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setBusinessConfig(data))
      .catch(() => undefined);
  }, []);

  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) { setCustomers([]); return; }
    const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : data.customers || []);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    if (query.length < 2) { setProducts([]); return; }
    const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    }
  }, []);

  const addProduct = (product: Product) => {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setItems(items.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setItems([...items, {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
      }]);
    }
    setProductSearch('');
    setProducts([]);
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: number | string) => {
    setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - (i.discount || 0) / 100), 0);
  const tax = subtotal * 0.21;
  const total = subtotal + tax;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setItems([]);
    setValidDays(15);
    setObservations('');
    setCreatedQuote(null);
  };

  const emitirPresupuesto = async () => {
    if (!selectedCustomer || items.length === 0) {
      toast.error('Seleccioná cliente e ítems');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email,
          customerPhone: selectedCustomer.phone,
          items: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            productSku: i.productSku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount || 0,
          })),
          validDays,
          notes: observations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear presupuesto');
      toast.success(`Presupuesto ${data.quoteNumber || ''} creado`);
      setCreatedQuote(data);
      setShowPrint(true);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al emitir presupuesto');
    } finally {
      setLoading(false);
    }
  };

  const companyData: DocumentCompany = {
    businessName: businessConfig?.businessName || 'Mi Empresa',
    legalName: businessConfig?.legalName,
    cuit: businessConfig?.cuit,
    condicionIva: businessConfig?.condicionIva,
    address: businessConfig?.address,
    city: businessConfig?.city,
    province: businessConfig?.province,
    iibb: businessConfig?.iibb,
    phone: businessConfig?.phone,
    email: businessConfig?.email,
    website: businessConfig?.website,
    fechaInicioActividad: businessConfig?.fechaInicioActividad || businessConfig?.inicioActividades || businessConfig?.activityStartDate,
    logo: businessConfig?.logoUrl || businessConfig?.logo,
    defaultPOS: businessConfig?.defaultPOS || 1,
  };

  const buildPrintDoc = (quote: any): DocumentData => ({
    documentType: 'presupuesto',
    documentLetter: 'X',
    documentNumber: (quote.quoteNumber || 'P-00001').replace('P-', ''),
    pointOfSale: businessConfig?.defaultPOS || 1,
    date: new Date(quote.createdAt || Date.now()),
    dueDate: quote.validUntil ? new Date(quote.validUntil) : undefined,
    items: (quote.items || items).map((item: any) => ({
      name: item.productName || item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      ivaRate: 21,
      subtotal: item.subtotal || item.quantity * item.unitPrice,
    })),
    subtotal: quote.subtotal ?? subtotal,
    ivaTotal: quote.tax ?? tax,
    total: quote.total ?? total,
    observations: quote.notes || observations || `Válido por ${validDays} días`,
    template: 'profesional',
  });

  const customerData: DocumentCustomer = selectedCustomer
    ? {
        name: selectedCustomer.name,
        document: selectedCustomer.document,
        condicionIva: selectedCustomer.taxCondition || 'consumidor_final',
        address: selectedCustomer.address,
        city: selectedCustomer.city,
      }
    : { name: '' };

  if (showPrint && createdQuote) {
    return (
      <PrintDocument
        company={companyData}
        customer={customerData}
        document={buildPrintDoc(createdQuote)}
        onClose={() => {
          setShowPrint(false);
          router.push('/presupuestos');
        }}
      />
    );
  }

  return (
    <ErpDocumentShell
      title="Emisión de comprobantes — Presupuesto"
      subtitle="Cotización no fiscal · mismo formato de impresión ARCA"
      module="FACTURACIÓN"
      userRole={userRole}
      onNew={resetForm}
      onSave={emitirPresupuesto}
      onCancel={resetForm}
      onPrint={() => createdQuote && setShowPrint(true)}
      saveLoading={loading}
      saveDisabled={!selectedCustomer || items.length === 0}
      saveLabel="Emitir presupuesto"
      header={
        <>
          <DocumentEmissionTabs />
          <div className="grid lg:grid-cols-2 gap-x-6 gap-y-0">
            <ErpFieldRow label="Cliente">
              <div className="relative flex gap-1">
                <input
                  type="text"
                  value={selectedCustomer ? selectedCustomer.name : customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setSelectedCustomer(null);
                    searchCustomers(e.target.value);
                  }}
                  placeholder="Buscar cliente…"
                  className="erp-input flex-1"
                />
                {customers.length > 0 && !selectedCustomer && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#9bb3cc] shadow-lg z-30 max-h-36 overflow-auto">
                    {customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomers([]); }}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#eef3f9]"
                      >
                        {c.name} {c.document ? `· ${c.document}` : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ErpFieldRow>
            <ErpFieldRow label="Válido (días)">
              <input type="number" min={1} max={365} value={validDays} onChange={(e) => setValidDays(parseInt(e.target.value, 10) || 15)} className="erp-input w-24" />
            </ErpFieldRow>
            <ErpFieldRow label="Fecha">
              <input type="date" readOnly value={new Date().toISOString().slice(0, 10)} className="erp-input w-36 bg-white/70" />
            </ErpFieldRow>
            <ErpFieldRow label="Tipo">
              <input type="text" readOnly value="Presupuesto (no fiscal)" className="erp-input w-full bg-white/70" />
            </ErpFieldRow>
          </div>
        </>
      }
      observations={
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          className="erp-input w-full h-16 resize-none"
          placeholder="Condiciones, plazos, observaciones…"
        />
      }
      footerExtra={
        <div className="flex items-center gap-6 text-sm mr-4">
          <span>Neto: <strong>{formatCurrency(subtotal)}</strong></span>
          <span>IVA 21%: <strong>{formatCurrency(tax)}</strong></span>
          <span className="text-base font-bold text-[#1e4d8c]">Total: {formatCurrency(total)}</span>
        </div>
      }
    >
      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar producto para agregar…"
          value={productSearch}
          onChange={(e) => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
          className="erp-input w-full pl-8"
        />
        {productSearch && products.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#9bb3cc] shadow-lg z-20 max-h-40 overflow-auto">
            {products.map((p) => (
              <button key={p.id} type="button" onClick={() => addProduct(p)} className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#eef3f9] flex justify-between">
                <span>{p.name}</span>
                <span>{formatCurrency(p.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="erp-panel overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-[#eef3f9] border-b border-[#b8c9dc]">
            <tr>
              <th className="px-2 py-1.5 text-left">Descripción</th>
              <th className="px-2 py-1.5 text-center w-20">Cant.</th>
              <th className="px-2 py-1.5 text-right w-24">P. Unit.</th>
              <th className="px-2 py-1.5 text-right w-24">Subtotal</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-[#5c7291]">Agregá productos al presupuesto</td></tr>
            ) : items.map((item, idx) => (
              <tr key={idx} className="border-b border-[#e4ecf5]">
                <td className="px-2 py-1">{item.productName}</td>
                <td className="px-2 py-1">
                  <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)} className="erp-input w-full text-center" />
                </td>
                <td className="px-2 py-1">
                  <input type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="erp-input w-full text-right" />
                </td>
                <td className="px-2 py-1 text-right font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</td>
                <td className="px-1 py-1">
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-600 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex justify-end">
        <button type="button" onClick={() => router.push('/presupuestos')} className="erp-btn-secondary flex items-center gap-1 text-xs">
          <History className="w-3.5 h-3.5" /> Ver presupuestos emitidos
        </button>
      </div>
    </ErpDocumentShell>
  );
}
