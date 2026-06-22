'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User,
  Receipt,
  Calculator,
  Save,
  CheckCircle,
  X,
  Barcode
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PrintDocument, DocumentData, DocumentCompany } from '@/components/print-document';
import { ErpDocumentShell, ErpFieldRow } from '@/components/erp/erp-document-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
}

interface TicketItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Tarjeta Débito' },
  { value: 'credito', label: 'Tarjeta Crédito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'mercadopago', label: 'MercadoPago' },
];

export function EmitirTicketClient() {
  const { userRole } = useErpSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [observations, setObservations] = useState('');
  
  // Items
  const [items, setItems] = useState<TicketItem[]>([]);

  // Result
  const [createdTicket, setCreatedTicket] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [businessConfig, setBusinessConfig] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchBusinessConfig();
    // Focus on search input
    searchInputRef.current?.focus();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchBusinessConfig = async () => {
    try {
      const res = await fetch('/api/config/business');
      const data = await res.json();
      setBusinessConfig(data);
    } catch (error) {
      console.error('Error fetching business config:', error);
    }
  };

  const addProductToItems = (product: Product) => {
    const existingIndex = items.findIndex(i => i.productId === product.id);
    if (existingIndex >= 0) {
      updateItemQuantity(existingIndex, items[existingIndex].quantity + 1);
    } else {
      const newItem: TicketItem = {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        total: product.price
      };
      setItems([...items, newItem]);
    }
    setSearchProduct('');
    searchInputRef.current?.focus();
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchProduct) {
      const product = products.find(p => 
        p.barcode === searchProduct || 
        p.sku.toLowerCase() === searchProduct.toLowerCase()
      );
      if (product) {
        addProductToItems(product);
      } else {
        const filtered = products.filter(p => 
          p.name.toLowerCase().includes(searchProduct.toLowerCase())
        );
        if (filtered.length === 1) {
          addProductToItems(filtered[0]);
        }
      }
    }
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    const newItems = [...items];
    newItems[index].quantity = quantity;
    newItems[index].total = quantity * newItems[index].unitPrice * (1 - newItems[index].discount / 100);
    setItems(newItems);
  };

  const updateItemDiscount = (index: number, discount: number) => {
    const newItems = [...items];
    newItems[index].discount = Math.min(100, Math.max(0, discount));
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice * (1 - newItems[index].discount / 100);
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discount / 100), 0);
    const total = subtotal - discount;
    return { subtotal, discount, total };
  };

  const calculateChange = () => {
    if (paymentMethod !== 'efectivo' || !cashReceived) return 0;
    const { total } = calculateTotals();
    return Math.max(0, Number(cashReceived) - total);
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Debe agregar al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            total: item.total,
          })),
          customerName: customerName || 'Consumidor Final',
          subtotal: totals.subtotal,
          discount: totals.discount,
          total: totals.total,
          paymentMethod,
          cashReceived: paymentMethod === 'efectivo' ? Number(cashReceived) : null,
          change: paymentMethod === 'efectivo' ? calculateChange() : null,
          observations,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedTicket(data.ticket);
        setShowSuccess(true);
        toast.success('Ticket emitido correctamente');
        resetForm();
      } else {
        toast.error(data.error || 'Error al emitir ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Error al emitir ticket');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setItems([]);
    setCustomerName('');
    setPaymentMethod('efectivo');
    setCashReceived('');
    setObservations('');
    searchInputRef.current?.focus();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const totals = calculateTotals();

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchProduct.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchProduct))
  ).slice(0, 8);

  // State for showing print preview
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Transform ticket data for PrintDocument component
  const getTicketDocumentData = (): DocumentData | null => {
    if (!createdTicket) return null;
    const ticketItems = createdTicket.items || [];
    return {
      documentType: 'ticket' as const,
      documentLetter: 'X' as const,
      documentNumber: createdTicket.ticketNumber,
      pointOfSale: businessConfig?.defaultPOS || 1,
      date: new Date(createdTicket.createdAt),
      items: ticketItems.map((item: any) => ({
        name: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        subtotal: item.total || (item.quantity * item.unitPrice - (item.discount || 0)),
      })),
      subtotal: createdTicket.subtotal,
      discount: createdTicket.discount || 0,
      total: createdTicket.total,
      paymentMethod: PAYMENT_METHODS.find(m => m.value === createdTicket.paymentMethod)?.label || createdTicket.paymentMethod,
      cashReceived: createdTicket.cashReceived,
      change: createdTicket.change,
      currency: 'ARS',
    };
  };

  const getTicketCompany = (): DocumentCompany => ({
    businessName: businessConfig?.businessName || '',
    legalName: businessConfig?.legalName,
    cuit: businessConfig?.cuit,
    condicionIva: businessConfig?.condicionIva,
    address: businessConfig?.address,
    city: businessConfig?.city,
    province: businessConfig?.province,
    iibb: businessConfig?.iibb,
    phone: businessConfig?.phone,
    email: businessConfig?.email,
    website: (businessConfig as any)?.website,
    fechaInicioActividad: businessConfig?.fechaInicioActividad || (businessConfig as any)?.inicioActividades,
    logo: (businessConfig as any)?.logo,
    defaultPOS: businessConfig?.defaultPOS,
  });

  return (
    <>
      {/* Success Modal */}
      {showSuccess && createdTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Ticket Emitido</h3>
              <p className="text-slate-600 mb-4">Ticket generado correctamente</p>
              <div className="bg-slate-50 rounded-lg p-4 mb-4 text-left font-mono">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Número:</span>
                  <span className="font-bold">{createdTicket.ticketNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Cliente:</span>
                  <span>{createdTicket.customerName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Items:</span>
                  <span>{(createdTicket.items || []).length}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(createdTicket.total)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrintPreview(true)}
                  className="flex-1 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/20"
                >
                  Nuevo Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && createdTicket && businessConfig && getTicketDocumentData() && (
        <PrintDocument
          company={getTicketCompany()}
          customer={createdTicket.customerName && createdTicket.customerName !== 'Consumidor Final' ? { name: createdTicket.customerName } : undefined}
          document={getTicketDocumentData()!}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      <ErpDocumentShell
        title="Emitir Ticket"
        subtitle="Generar tickets de venta no fiscales para referencia"
        module="FACTURACIÓN"
        userRole={userRole}
        statusText={`Items: ${items.length}`}
        onNew={resetForm}
        onSave={handleSubmit}
        onPrint={() => createdTicket && setShowPrintPreview(true)}
        saveLoading={loading}
        saveDisabled={items.length === 0}
        saveLabel="Emitir Ticket"
        header={
          <ErpFieldRow label="Cliente">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Consumidor Final"
              className="erp-input w-full"
            />
          </ErpFieldRow>
        }
        observations={
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={2}
            placeholder="Notas adicionales..."
            className="erp-input w-full h-16 resize-none"
          />
        }
        footerExtra={
          <div className="flex items-center gap-4 text-sm mr-4">
            <span>Subtotal: <strong>{formatCurrency(totals.subtotal)}</strong></span>
            {totals.discount > 0 && (
              <span className="text-green-600">Desc: <strong>-{formatCurrency(totals.discount)}</strong></span>
            )}
            <span className="text-base font-bold text-[#1e4d8c]">Total: {formatCurrency(totals.total)}</span>
          </div>
        }
      >
      <div className="grid lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search Bar */}
        <div className="erp-panel p-4">
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Escanear código de barras o buscar producto..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              onKeyDown={handleBarcodeSearch}
              className="w-full pl-10 pr-4 py-3 text-lg premium-input focus:border-blue-500"
              autoFocus
            />
          </div>
          
          {/* Quick Products */}
          {searchProduct && filteredProducts.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addProductToItems(product)}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-left transition-colors border border-transparent hover:border-blue-200"
                >
                  <div className="font-medium text-sm truncate">{product.name}</div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-slate-500">{product.sku}</span>
                    <span className="text-sm font-bold text-blue-600">{formatCurrency(product.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="erp-panel overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              Items del Ticket
            </h2>
            <span className="text-sm text-slate-500">{items.length} productos</span>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Barcode className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Escanee o busque productos para agregar al ticket</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-auto">
              {items.map((item, index) => (
                <div key={index} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">{item.description}</h3>
                      <div className="text-sm text-slate-500">
                        {formatCurrency(item.unitPrice)} c/u
                        {item.discount > 0 && (
                          <span className="ml-2 text-green-600">-{item.discount}%</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Total */}
                      <div className="w-24 text-right font-bold">
                        {formatCurrency(item.total)}
                      </div>
                      
                      {/* Delete */}
                      <button
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4">
        <div className="erp-panel p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">Método de Pago</h3>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  paymentMethod === method.value
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-200'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {paymentMethod === 'efectivo' && (
            <div className="mt-4 space-y-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Efectivo Recibido</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value ? parseFloat(e.target.value) : '')}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-lg premium-input"
                />
              </div>
              {cashReceived && (
                <div className="flex justify-between text-lg text-blue-600 font-medium">
                  <span>Vuelto:</span>
                  <span>{formatCurrency(calculateChange())}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      </ErpDocumentShell>
    </>
  );
}
