'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Search, Plus, Minus, Trash2, ShoppingCart, User, DollarSign, CreditCard, Percent, Printer, ArrowDownToLine, ExternalLink, FileText, Loader2, CheckCircle, AlertCircle, Shield, Receipt, QrCode, LayoutGrid, List, Package, Tag, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { PrintDocument, DocumentData, DocumentCompany, DocumentCustomer } from '@/components/print-document';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { MpPaymentBrick } from '@/components/payments/mp-payment-brick';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stock: number;
  category?: { name: string };
}

interface FullCustomer {
  id: string;
  name: string;
  document?: string;
  documentType?: string;
  taxCondition?: string;
  address?: string;
  city?: string;
  province?: string;
  email?: string;
  phone?: string;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

interface BusinessConfig {
  businessName: string;
  legalName?: string;
  cuit?: string;
  iibb?: string;
  condicionIva?: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  website?: string;
  inicioActividades?: string;
  logo?: string;
  defaultPOS?: number;
}

interface InvoiceResult {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceType: string;
    documentCode: string;
    documentLetter: string;
    pointOfSale: number;
    sequenceNumber: number;
    customerName: string;
    customerDocument?: string;
    customerDocumentType?: string;
    customerTaxCondition: string;
    customerAddress?: string;
    subtotal: number;
    netoGravado: number;
    ivaTotal: number;
    ivaBreakdown: { rate: number; base: number; amount: number }[];
    total: number;
    items: any[];
  };
  afip: {
    success: boolean;
    cae: string | null;
    caeVencimiento: string | null;
    comprobanteNumero: number;
    qrUrl: string | null;
    error: string | null;
  };
  company: DocumentCompany;
}

const CONDICION_IVA_LABELS: Record<string, string> = {
  responsable_inscripto: 'Resp. Inscripto',
  monotributista: 'Monotributista',
  exento: 'Exento',
  consumidor_final: 'Consumidor Final',
  no_categorizado: 'No Categorizado',
};

const PAYMENT_MAP: Record<string, string> = {
  Efectivo: 'cash',
  Débito: 'debit',
  Crédito: 'credit',
  Transferencia: 'transfer',
  MercadoPago: 'mercadopago',
};

// Color palette for category icons in the product grid
const CATEGORY_COLORS: string[] = [
  '#2563ad','#16a34a','#d97706','#9333ea','#db2777','#0891b2','#65a30d','#ea580c',
  '#7c3aed','#059669','#dc2626','#0284c7',
];
function getCategoryColor(cat: string): string {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export function PosClient() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'ADMIN';
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<FullCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<FullCustomer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [cashReceived, setCashReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [mpConfigured, setMpConfigured] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);
  const [mpQrConfigured, setMpQrConfigured] = useState(false);
  const [mpMode, setMpMode] = useState<'card' | 'qr' | 'checkout'>('card');
  const [mpLoading, setMpLoading] = useState(false);
  const [mpQrImage, setMpQrImage] = useState<string | null>(null);
  const [showMpCardModal, setShowMpCardModal] = useState(false);
  const [mpCardAmount, setMpCardAmount] = useState(0);
  const [generateInvoice, setGenerateInvoice] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  // Print states
  const [showPrint, setShowPrint] = useState(false);
  const [printMode, setPrintMode] = useState<'ticket' | 'a4'>('ticket');
  const [lastInvoiceResult, setLastInvoiceResult] = useState<InvoiceResult | null>(null);
  const [lastSaleData, setLastSaleData] = useState<{
    saleNumber: string;
    total: number;
    subtotal: number;
    discount: number;
    change: number;
    items: { name: string; quantity: number; price: number; discount: number; subtotal: number }[];
    paymentMethod: string;
    cashReceived?: number;
    date: Date;
  } | null>(null);

  // Sale completed state (for print choice dialog)
  const [showPrintChoice, setShowPrintChoice] = useState(false);
  const [mpPendingSaleId, setMpPendingSaleId] = useState<string | null>(null);

  const finalizeMpSale = useCallback(async (sale: {
    id: string;
    saleNumber: string;
    total: number;
    subtotal: number;
    discount?: number;
    items?: { product?: { name?: string }; quantity: number; unitPrice: number; discount: number; subtotal: number }[];
  }) => {
    const snapshotRaw = sessionStorage.getItem('mp_pending_snapshot');
    const snapshot = snapshotRaw ? JSON.parse(snapshotRaw) : null;
    const invoiceItems = snapshot?.items || sale.items?.map((item) => ({
      productId: (item as any).productId,
      name: item.product?.name || 'Producto',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
    })) || [];

    const saleData = {
      saleNumber: sale.saleNumber,
      total: sale.total,
      subtotal: sale.subtotal,
      discount: sale.discount || snapshot?.totalDiscount || 0,
      change: 0,
      items: (snapshot?.items || sale.items?.map((item) => ({
        name: item.product?.name || 'Producto',
        quantity: item.quantity,
        price: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
      }))) ?? [],
      paymentMethod: 'MercadoPago',
      date: new Date(),
    };
    setLastSaleData(saleData);

    const shouldInvoice = snapshot?.generateInvoice ?? generateInvoice;
    const customer = snapshot?.customer ?? selectedCustomer;

    if (shouldInvoice) {
      try {
        const invoiceRes = await fetch('/api/pos/invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            saleId: sale.id,
            customerId: customer?.id,
            customerName: customer?.name || 'Consumidor Final',
            customerDocument: customer?.document,
            customerDocumentType: customer?.documentType,
            customerTaxCondition: customer?.taxCondition || 'consumidor_final',
            customerAddress: customer?.address
              ? `${customer.address}${customer.city ? ', ' + customer.city : ''}${customer.province ? ', ' + customer.province : ''}`
              : undefined,
            items: invoiceItems,
            total: sale.total,
            subtotal: sale.subtotal,
            paymentMethod: 'mercadopago',
          }),
        });
        const invoiceData = await invoiceRes.json();
        if (invoiceData.success) {
          setLastInvoiceResult(invoiceData);
          if (invoiceData.afip?.success) {
            toast.success(`Factura ${invoiceData.invoice.invoiceType} con CAE: ${invoiceData.afip.cae}`, { duration: 5000 });
          } else {
            toast.error(`Factura sin CAE: ${invoiceData.afip?.error || 'Error AFIP'}`, { duration: 5000 });
          }
        }
      } catch (invoiceError) {
        console.error('Invoice error after MP:', invoiceError);
        toast.error('Pago OK pero falló la factura electrónica');
      }
    }

    setShowPrintChoice(true);
    clearCart();
    fetchProducts();
    setMpPendingSaleId(null);
    setMpQrImage(null);
    sessionStorage.removeItem('mp_pending_sale');
    sessionStorage.removeItem('mp_pending_snapshot');
    toast.success(`Pago aprobado — Venta ${sale.saleNumber}`);
  }, [generateInvoice, selectedCustomer]);

  const cancelMpPending = useCallback(async (saleId: string) => {
    try {
      await fetch('/api/payments/mercadopago/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId }),
      });
    } catch { /* ignore */ }
  }, []);

  const confirmMpPayment = useCallback(async (saleId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/mercadopago/confirm?saleId=${encodeURIComponent(saleId)}`);
      const data = await res.json();

      if (data.sale?.status === 'completed') {
        await finalizeMpSale(data.sale);
        return true;
      }
      if (data.rejected) {
        toast.error('Pago rechazado por MercadoPago');
        return false;
      }
      if (data.pending) {
        return false;
      }
      if (!res.ok) {
        toast.error(data.error || 'No se pudo confirmar el pago');
      }
      return false;
    } catch (error) {
      console.error('MP confirm error:', error);
      toast.error('Error al confirmar pago');
      return false;
    } finally {
      setLoading(false);
    }
  }, [finalizeMpSale]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const saleId = params.get('saleId') || sessionStorage.getItem('mp_pending_sale');

    if (saleId && (payment === 'success' || payment === 'pending')) {
      window.history.replaceState({}, '', '/pos');
      confirmMpPayment(saleId);
    } else if (payment === 'failure' && saleId) {
      window.history.replaceState({}, '', '/pos');
      toast.error('El pago fue cancelado o falló');
      cancelMpPending(saleId);
      sessionStorage.removeItem('mp_pending_sale');
      sessionStorage.removeItem('mp_pending_snapshot');
      setMpPendingSaleId(null);
      setMpQrImage(null);
    } else {
      const pending = sessionStorage.getItem('mp_pending_sale');
      if (pending) setMpPendingSaleId(pending);
    }
  }, [confirmMpPayment, cancelMpPending]);

  useEffect(() => {
    if (!mpPendingSaleId) return;

    let cancelled = false;
    const poll = async () => {
      for (let attempt = 0; attempt < 40 && !cancelled; attempt++) {
        const res = await fetch(`/api/payments/mercadopago/confirm?saleId=${encodeURIComponent(mpPendingSaleId)}`);
        const data = await res.json();
        if (data.sale?.status === 'completed') {
          await finalizeMpSale(data.sale);
          break;
        }
        if (data.rejected) {
          toast.error('Pago rechazado por MercadoPago');
          cancelMpPending(mpPendingSaleId);
          setMpPendingSaleId(null);
          setMpQrImage(null);
          sessionStorage.removeItem('mp_pending_sale');
          sessionStorage.removeItem('mp_pending_snapshot');
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [mpPendingSaleId, finalizeMpSale, cancelMpPending]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchBusinessConfig();
    checkMPConfig();
    searchRef.current?.focus();
  }, []);

  const fetchBusinessConfig = async () => {
    try {
      const res = await fetch('/api/config/business');
      if (res.ok) setBusinessConfig(await res.json());
    } catch (error) { console.error('Error fetching business config:', error); }
  };

  const checkMPConfig = async () => {
    try {
      const res = await fetch('/api/payments/mercadopago');
      if (res.ok) {
        const data = await res.json();
        setMpConfigured(data.configured);
        setMpPublicKey(data.publicKey || null);
        setMpQrConfigured(!!data.qrConfigured);
      }
    } catch (error) { console.error('Error checking MP config:', error); }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'F4' && cart.length > 0 && !loading) { e.preventDefault(); handleCheckout(); }
      if (e.key === 'Escape') { setSearchTerm(''); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, loading]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) setProducts(await res.json() ?? []);
    } catch (error) { console.error('Error al cargar productos:', error); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) setCustomers(await res.json() ?? []);
    } catch (error) { console.error('Error al cargar clientes:', error); }
  };

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category?.name || 'Sin categoría')))];

  const filteredProducts = products?.filter(
    (p) => {
      const matchesSearch =
        p?.name?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '') ||
        p?.sku?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '') ||
        p?.barcode?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '');
      const matchesCategory =
        selectedCategory === 'Todos' ||
        (p.category?.name || 'Sin categoría') === selectedCategory;
      return matchesSearch && matchesCategory;
    }
  ) ?? [];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      const exactMatch = products.find(
        p => p.barcode === searchTerm || p.sku.toLowerCase() === searchTerm.toLowerCase()
      );
      if (exactMatch) { addToCart(exactMatch); setSearchTerm(''); }
      else if (filteredProducts.length === 1) { addToCart(filteredProducts[0]); setSearchTerm(''); }
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) { toast.error('Producto sin stock'); return; }
    const existing = cart?.find?.((item) => item?.id === product?.id);
    if (existing) {
      if (existing.quantity >= product.stock) { toast.error('Stock insuficiente'); return; }
      setCart(cart?.map?.((item) => item?.id === product?.id ? { ...item, quantity: item.quantity + 1 } : item) ?? []);
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
    toast.success('Agregado al carrito');
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart?.find?.((i) => i?.id === productId);
    const product = products?.find?.((p) => p?.id === productId);
    if (!item || !product) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) { removeFromCart(productId); return; }
    if (newQty > product.stock) { toast.error('Stock insuficiente'); return; }
    setCart(cart?.map?.((i) => i?.id === productId ? { ...i, quantity: newQty } : i) ?? []);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart?.filter?.((item) => item?.id !== productId) ?? []);
  };

  const applyItemDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => item.id === productId ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item));
  };

  const calculateItemTotal = (item: CartItem) => {
    return item.price * item.quantity * (1 - item.discount / 100);
  };
  const calculateSubtotal = () => cart?.reduce?.((sum, item) => sum + (item?.price ?? 0) * (item?.quantity ?? 0), 0) ?? 0;
  const calculateTotal = () => {
    const cartTotal = cart?.reduce?.((sum, item) => sum + calculateItemTotal(item), 0) ?? 0;
    return cartTotal * (1 - globalDiscount / 100);
  };
  const calculateTotalDiscount = () => calculateSubtotal() - calculateTotal();
  const calculateChange = () => Math.max(0, (parseFloat(cashReceived) || 0) - calculateTotal());

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setCashReceived('');
    setGlobalDiscount(0);
  };

  // Detect document type based on customer
  const getDetectedDocType = (): { letter: string; label: string; color: string } => {
    const emisorCondition = businessConfig?.condicionIva || 'responsable_inscripto';
    const receptorCondition = selectedCustomer?.taxCondition || 'consumidor_final';

    if (emisorCondition === 'monotributista' || emisorCondition === 'exento') {
      return { letter: 'C', label: 'Factura C', color: 'text-green-700 bg-green-50 border-green-200' };
    }
    if (emisorCondition === 'responsable_inscripto') {
      if (receptorCondition === 'responsable_inscripto' || receptorCondition === 'monotributista') {
        return { letter: 'A', label: 'Factura A', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      }
      return { letter: 'B', label: 'Factura B', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    }
    return { letter: 'B', label: 'Factura B', color: 'text-purple-700 bg-purple-50 border-purple-200' };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    const total = calculateTotal();
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();
    const change = calculateChange();

    if (paymentMethod === 'Efectivo') {
      const received = parseFloat(cashReceived) || 0;
      if (received < total) { toast.error('Efectivo insuficiente'); return; }
    }
    if (paymentMethod === 'MercadoPago') {
      if (mpMode === 'qr') await handleMPQRPayment();
      else if (mpMode === 'card') await handleMPCardPayment();
      else await handleMPPayment();
      return;
    }

    setLoading(true);
    try {
      // 1. Create the sale
      const saleRes = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id ?? null,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
            discount: item.discount,
            subtotal: calculateItemTotal(item),
          })),
          subtotal,
          tax: total - subtotal + totalDiscount,
          total,
          paymentMethod: PAYMENT_MAP[paymentMethod] || paymentMethod.toLowerCase(),
          discount: globalDiscount,
          cashReceived: paymentMethod === 'Efectivo' ? parseFloat(cashReceived) : null,
          change: paymentMethod === 'Efectivo' ? change : null,
        }),
      });

      if (!saleRes.ok) {
        const error = await saleRes.json();
        toast.error(error?.error ?? 'Error al procesar venta');
        return;
      }

      const sale = await saleRes.json();
      toast.success(`Venta ${sale?.saleNumber ?? ''} completada`);

      // Save sale data for ticket printing
      const saleData = {
        saleNumber: sale.saleNumber,
        total,
        subtotal,
        discount: totalDiscount,
        change: paymentMethod === 'Efectivo' ? change : 0,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          subtotal: calculateItemTotal(item),
        })),
        paymentMethod,
        cashReceived: paymentMethod === 'Efectivo' ? parseFloat(cashReceived) : undefined,
        date: new Date(),
      };
      setLastSaleData(saleData);

      // 2. Generate invoice + CAE if enabled
      if (generateInvoice) {
        try {
          const invoiceRes = await fetch('/api/pos/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              saleId: sale.id,
              customerId: selectedCustomer?.id,
              customerName: selectedCustomer?.name || 'Consumidor Final',
              customerDocument: selectedCustomer?.document,
              customerDocumentType: selectedCustomer?.documentType,
              customerTaxCondition: selectedCustomer?.taxCondition || 'consumidor_final',
              customerAddress: selectedCustomer?.address
                ? `${selectedCustomer.address}${selectedCustomer.city ? ', ' + selectedCustomer.city : ''}${selectedCustomer.province ? ', ' + selectedCustomer.province : ''}`
                : undefined,
              items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                unitPrice: item.price,
                discount: item.discount,
              })),
              total,
              subtotal,
              paymentMethod: PAYMENT_MAP[paymentMethod] || paymentMethod.toLowerCase(),
            }),
          });

          const invoiceData = await invoiceRes.json();
          if (invoiceData.success) {
            setLastInvoiceResult(invoiceData);
            if (invoiceData.afip?.success) {
              toast.success(`Factura ${invoiceData.invoice.invoiceType} con CAE: ${invoiceData.afip.cae}`, { duration: 5000 });
            } else {
              toast.error(`Factura generada sin CAE: ${invoiceData.afip?.error || 'Error AFIP'}`, { duration: 5000 });
            }
          } else {
            toast.error('Error al generar factura: ' + (invoiceData.error || ''));
          }
        } catch (invoiceError) {
          console.error('Invoice error:', invoiceError);
          toast.error('Error al generar factura. La venta fue registrada.');
        }
      }

      // 3. Show print choice dialog
      setShowPrintChoice(true);
      clearCart();
      fetchProducts();
    } catch (error) {
      console.error('Error al procesar venta:', error);
      toast.error('Error al procesar venta');
    } finally {
      setLoading(false);
    }
  };

  const createMpPendingSale = async () => {
    const total = calculateTotal();
    const subtotal = calculateSubtotal();
    const totalDiscount = calculateTotalDiscount();

    const saleRes = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: selectedCustomer?.id ?? null,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: item.discount,
          subtotal: calculateItemTotal(item),
        })),
        subtotal,
        tax: total - subtotal + totalDiscount,
        total,
        paymentMethod: 'mercadopago',
        discount: globalDiscount,
        status: 'pending_payment',
      }),
    });

    if (!saleRes.ok) {
      const error = await saleRes.json();
      toast.error(error?.error ?? 'Error al crear venta pendiente');
      return null;
    }

    const sale = await saleRes.json();
    sessionStorage.setItem('mp_pending_sale', sale.id);
    sessionStorage.setItem('mp_pending_snapshot', JSON.stringify({
      generateInvoice,
      customer: selectedCustomer,
      items: cart.map((item) => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
      })),
      totalDiscount,
    }));
    return { sale, total };
  };

  const handleMPCardPayment = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    if (!mpPublicKey) {
      toast.error('Mercado Pago no tiene public key configurada. Completá Integraciones.');
      return;
    }

    setMpLoading(true);
    try {
      const pending = await createMpPendingSale();
      if (!pending) return;
      const { sale, total } = pending;
      setMpPendingSaleId(sale.id);
      setMpCardAmount(total);
      setShowMpCardModal(true);
    } catch (error) {
      console.error('MP card init error:', error);
      toast.error('Error al iniciar pago con tarjeta');
    } finally {
      setMpLoading(false);
    }
  };

  const handleMpCardApproved = async (payload: { sale: any }) => {
    setShowMpCardModal(false);
    setMpQrImage(null);
    sessionStorage.removeItem('mp_pending_sale');
    const sale = payload.sale;
    if (sale) {
      toast.success('Pago con tarjeta aprobado');
      await finalizeMpSale(sale);
      setMpPendingSaleId(null);
      clearCart();
      fetchProducts();
    }
  };

  const handleMPPayment = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }

    setMpLoading(true);
    try {
      const pending = await createMpPendingSale();
      if (!pending) return;
      const { sale, total } = pending;

      const res = await fetch('/api/payments/mercadopago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: sale.id,
          items: cart.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price * (1 - item.discount / 100),
          })),
          customer: selectedCustomer
            ? { name: selectedCustomer.name, email: selectedCustomer.email, document: selectedCustomer.document }
            : null,
          total,
        }),
      });
      const data = await res.json();
      if (data.needsConfig) { toast.error('MercadoPago no está configurado.'); return; }
      if (data.checkoutUrl) {
        toast.success('Redirigiendo a MercadoPago… La venta queda pendiente hasta confirmación.');
        setMpPendingSaleId(sale.id);
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || 'Error al crear pago');
        cancelMpPending(sale.id);
      }
    } catch (error) {
      console.error('MP payment error:', error);
      toast.error('Error al procesar pago con MercadoPago');
    } finally {
      setMpLoading(false);
    }
  };

  const handleMPQRPayment = async () => {
    if (cart.length === 0) { toast.error('El carrito está vacío'); return; }
    if (!mpQrConfigured) {
      toast.error('QR no configurado. Configurá sucursal y caja en Integraciones → MercadoPago.');
      return;
    }

    setMpLoading(true);
    try {
      const pending = await createMpPendingSale();
      if (!pending) return;
      const { sale, total } = pending;

      const res = await fetch('/api/payments/mercadopago/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: sale.id,
          total,
          description: `Venta ${sale.saleNumber}`,
          items: cart.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price * (1 - item.discount / 100),
          })),
        }),
      });
      const data = await res.json();
      if (data.needsConfig) {
        toast.error('MercadoPago no está configurado.');
        cancelMpPending(sale.id);
        return;
      }
      if (data.needsQRSetup) {
        toast.error(data.error || 'Configurá QR en Integraciones.');
        cancelMpPending(sale.id);
        return;
      }
      if (data.qrImage || data.qrCode) {
        toast.success('Mostrá el QR al cliente para que pague con la app de Mercado Pago.');
        setMpPendingSaleId(sale.id);
        setMpQrImage(data.qrImage || null);
      } else {
        toast.error(data.error || 'Error al generar QR');
        cancelMpPending(sale.id);
      }
    } catch (error) {
      console.error('MP QR error:', error);
      toast.error('Error al generar QR de MercadoPago');
    } finally {
      setMpLoading(false);
    }
  };

  const openPrint = (mode: 'ticket' | 'a4') => {
    setPrintMode(mode);
    setShowPrintChoice(false);
    setShowPrint(true);
  };

  // Build print data for PrintDocument
  const buildPrintDocument = (): { company: DocumentCompany; customer?: DocumentCustomer; document: DocumentData } | null => {
    if (!lastSaleData) return null;

    const inv = lastInvoiceResult;
    const isInvoice = inv && generateInvoice;

    // Company data: prefer from invoice result (has fresh DB data), fallback to businessConfig
    const companyData: DocumentCompany = inv?.company || {
      businessName: businessConfig?.businessName || 'Mi Empresa',
      legalName: businessConfig?.legalName,
      cuit: businessConfig?.cuit,
      condicionIva: businessConfig?.condicionIva,
      address: businessConfig?.address,
      city: businessConfig?.city,
      province: businessConfig?.province,
      phone: businessConfig?.phone,
      email: businessConfig?.email,
      website: businessConfig?.website,
      iibb: businessConfig?.iibb,
      logo: businessConfig?.logo,
      fechaInicioActividad: businessConfig?.inicioActividades,
      defaultPOS: businessConfig?.defaultPOS,
    };

    // Customer data
    const customerData: DocumentCustomer | undefined = isInvoice && inv?.invoice ? {
      name: inv.invoice.customerName,
      document: inv.invoice.customerDocument,
      documentType: inv.invoice.customerDocumentType,
      condicionIva: inv.invoice.customerTaxCondition,
      address: inv.invoice.customerAddress,
    } : selectedCustomer ? {
      name: selectedCustomer.name,
      document: selectedCustomer.document,
      documentType: selectedCustomer.documentType,
      condicionIva: selectedCustomer.taxCondition,
      address: selectedCustomer.address,
    } : undefined;

    // Determine document type based on print mode and invoice availability
    let documentType: DocumentData['documentType'] = 'ticket';
    let documentLetter: DocumentData['documentLetter'] = 'X';
    let documentNumber = lastSaleData.saleNumber;
    let pointOfSale = businessConfig?.defaultPOS || 1;
    let ivaTotal: number | undefined;
    let ivaBreakdown: DocumentData['ivaBreakdown'];
    let netoGravado: number | undefined;
    let cae: string | undefined;
    let caeExpiration: string | undefined;
    let documentCode: string | undefined;
    let docSubtotal = lastSaleData.subtotal;
    let docTotal = lastSaleData.total;

    if (isInvoice && inv?.invoice) {
      documentType = 'factura';
      documentLetter = (inv.invoice.invoiceType || 'B') as DocumentData['documentLetter'];
      documentCode = inv.invoice.documentCode;
      documentNumber = inv.invoice.invoiceNumber;
      pointOfSale = inv.invoice.pointOfSale;
      ivaTotal = inv.invoice.ivaTotal;
      ivaBreakdown = inv.invoice.ivaBreakdown;
      netoGravado = inv.invoice.netoGravado;
      docSubtotal = inv.invoice.subtotal;
      docTotal = inv.invoice.total;

      if (inv.afip?.success) {
        cae = inv.afip.cae || undefined;
        if (inv.afip.caeVencimiento) {
          caeExpiration = inv.afip.caeVencimiento;
        }
      }
    }

    const items = lastSaleData.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
      subtotal: item.subtotal,
    }));

    const document: DocumentData = {
      documentType: isInvoice ? documentType : 'ticket',
      documentLetter: isInvoice ? documentLetter : 'X',
      documentCode: isInvoice ? documentCode : undefined,
      printFormat: printMode === 'ticket' ? 'ticket' : 'a4',
      documentNumber,
      pointOfSale,
      date: lastSaleData.date,
      items,
      subtotal: docSubtotal,
      discount: lastSaleData.discount,
      total: docTotal,
      paymentMethod: lastSaleData.paymentMethod,
      cashReceived: lastSaleData.cashReceived,
      change: lastSaleData.change,
      currency: 'ARS',
      ivaTotal,
      ivaBreakdown,
      netoGravado,
      cae,
      caeExpiration,
    };

    return { company: companyData, customer: customerData, document };
  };

  const total = calculateTotal();
  const subtotal = calculateSubtotal();
  const totalDiscount = calculateTotalDiscount();
  const change = calculateChange();
  const detectedDoc = getDetectedDocType();

  return (
    <ErpPageShell
      title="Punto de Venta"
      subtitle="Cobro rápido · MercadoPago · Factura electrónica"
      module="POS"
      statusText={cart.length > 0 ? `${cart.length} item(s) · $${total.toLocaleString('es-AR')}` : 'Listo para vender'}
      userRole={userRole}
      toolbar={[
        { label: 'Limpiar', icon: <Trash2 className="w-4 h-4" />, onClick: clearCart, disabled: cart.length === 0 },
        { label: 'Facturar', icon: <FileText className="w-4 h-4" />, onClick: handleCheckout, disabled: cart.length === 0 || loading || mpLoading },
      ]}
    >
    <>
    {/* ══════ POS LAYOUT — Estilo corralón ERP ══════ */}
    <div className="flex gap-0 border border-[#b8c4dc]" style={{ height: 'calc(100vh - 10rem)', minHeight: '500px' }}>

      {/* ── 1. Sidebar de Categorías ── */}
      <div className="flex flex-col shrink-0 border-r border-[#b8c4dc] bg-[#e8edf5] overflow-y-auto" style={{ width: '130px' }}>
        <div className="bg-[#9baac8] text-white text-[10px] font-bold uppercase px-2 py-1.5 tracking-wider sticky top-0">Categorías</div>
        {categories.map((cat) => {
          const count = cat === 'Todos' ? products.length : products.filter(p => (p.category?.name || 'Sin categoría') === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-left px-2 py-2 text-[11px] border-b border-[#d0d8ea] transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#2563ad] text-white font-bold'
                  : 'text-[#1a3a5c] hover:bg-[#dde3f4] font-medium'
              }`}
            >
              <span className="block truncate">{cat}</span>
              <span className={`text-[9px] ${selectedCategory === cat ? 'text-white/70' : 'text-[#9baac8]'}`}>{count} art.</span>
            </button>
          );
        })}
      </div>

      {/* ── 2. Zona de productos ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Buscador + toggle vista */}
        <div className="border-b border-[#b8c4dc] bg-[#f8fafc] px-2 py-1.5 flex items-center gap-2 shrink-0">
          <Search className="w-4 h-4 text-[#9baac8] shrink-0" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar por nombre, SKU o código de barras... (F2)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 bg-transparent text-xs border-0 outline-none text-[#1a3a5c] placeholder:text-[#9baac8]"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <button type="button" onClick={() => setViewMode('table')} title="Vista lista"
              className={`p-1 ${viewMode === 'table' ? 'bg-[#2563ad] text-white' : 'text-[#9baac8] hover:text-[#2563ad]'}`}>
              <List className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setViewMode('cards')} title="Vista cards"
              className={`p-1 ${viewMode === 'cards' ? 'bg-[#2563ad] text-white' : 'text-[#9baac8] hover:text-[#2563ad]'}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[9px] text-[#9baac8] shrink-0 hidden lg:block">F2·F4·ESC</span>
        </div>

        {/* Grilla / Cards de productos */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#5c7291] gap-3">
              <Package className="w-10 h-10 text-[#b8c4dc]" />
              <div className="text-center">
                <p className="text-sm font-semibold">{products.length === 0 ? 'Sin productos en el catálogo' : 'Sin resultados'}</p>
                <p className="text-xs text-[#9baac8] mt-1">{products.length === 0 ? 'Agregá productos en Inventario' : 'Probá con otro término de búsqueda'}</p>
              </div>
            </div>
          ) : viewMode === 'table' ? (
            /* ── Vista tabla (ERP clásico) ── */
            <table className="erp-grid-table w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="w-8 text-center"></th>
                  <th>Artículo / Descripción</th>
                  <th className="w-20 hidden md:table-cell">Cód. / SKU</th>
                  <th className="w-20 text-right">Precio</th>
                  <th className="w-12 text-center">Stock</th>
                  <th className="w-10 text-center">+</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const catColor = getCategoryColor(product.category?.name || 'X');
                  return (
                    <tr
                      key={product.id}
                      className={`cursor-pointer ${product.stock <= 0 ? 'opacity-40' : ''}`}
                      onClick={() => addToCart(product)}
                    >
                      {/* Ícono de color por categoría */}
                      <td className="text-center px-1">
                        <div className="w-6 h-6 mx-auto flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: catColor }}>
                          {(product.name || 'P').charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div className="px-1 py-0.5">
                          <div className="font-semibold text-[11px] text-[#1a2a4c] truncate">{product.name}</div>
                          <div className="text-[9px] text-[#9baac8] flex items-center gap-1">
                            <span style={{ color: catColor }} className="font-semibold">{product.category?.name ?? 'General'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="cell-text font-mono text-[10px]">{product.sku}</span>
                      </td>
                      <td className="text-right pr-2 font-black font-mono text-[12px] text-[#2563ad]">
                        ${product.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <span className={`text-[11px] font-bold ${product.stock <= 0 ? 'text-red-600' : product.stock <= 5 ? 'text-amber-600' : 'text-green-700'}`}>
                          {product.stock <= 0 ? '✕' : product.stock}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                          disabled={product.stock <= 0}
                          className="w-6 h-6 bg-[#2563ad] text-white flex items-center justify-center mx-auto hover:bg-[#1e4d8c] font-bold text-lg leading-none disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Agregar al carrito"
                        >+</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* ── Vista cards (visual) ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2">
              {filteredProducts.map((product) => {
                const catColor = getCategoryColor(product.category?.name || 'X');
                const outOfStock = product.stock <= 0;
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => !outOfStock && addToCart(product)}
                    disabled={outOfStock}
                    className={`border text-left transition-all group ${
                      outOfStock
                        ? 'border-[#e0e0e0] bg-[#f9f9f9] opacity-50 cursor-not-allowed'
                        : 'border-[#b8c4dc] bg-white hover:border-[#2563ad] hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Cabecera de color */}
                    <div className="h-2 w-full" style={{ backgroundColor: catColor }} />
                    <div className="p-2">
                      {/* Ícono grande de categoría */}
                      <div className="w-10 h-10 flex items-center justify-center text-white text-xl font-black mb-2 mx-auto" style={{ backgroundColor: catColor }}>
                        {(product.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <p className="text-[11px] font-bold text-[#1a2a4c] text-center truncate leading-tight">{product.name}</p>
                      <p className="text-[9px] text-center mt-0.5" style={{ color: catColor }}>{product.category?.name ?? 'General'}</p>
                      <p className="text-center font-black font-mono text-[13px] text-[#2563ad] mt-1">
                        ${product.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[9px] font-bold px-1 ${
                          outOfStock ? 'text-red-600 bg-red-50' :
                          product.stock <= 5 ? 'text-amber-600 bg-amber-50' : 'text-green-700 bg-green-50'
                        }`}>
                          {outOfStock ? 'Sin stock' : `Stock: ${product.stock}`}
                        </span>
                        {!outOfStock && (
                          <span className="w-5 h-5 bg-[#2563ad] text-white flex items-center justify-center text-lg leading-none font-bold group-hover:bg-[#1e4d8c]">
                            +
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie de la zona de productos */}
        <div className="erp-grid-footer shrink-0 flex items-center justify-between">
          <span>{filteredProducts.length} artículo(s) · <span className="text-[#2563ad] font-semibold">{selectedCategory}</span></span>
          <span className="text-[9px] opacity-60">F2: Buscar · F4: Cobrar · ESC: Vaciar</span>
        </div>
      </div>

      {/* ── 3. Panel de carrito + cobro ── */}
      <div className="flex flex-col border-l border-[#b8c4dc] bg-[#f4f6fc] overflow-y-auto" style={{ width: '320px' }}>

        {/* Header carrito */}
        <div className="bg-[#9baac8] text-white text-[10px] font-bold uppercase px-3 py-1.5 tracking-wider shrink-0 flex items-center gap-2">
          <ShoppingCart className="w-3.5 h-3.5" />
          Carrito de Venta
        </div>

        {/* Cliente */}
        <div className="px-2 py-1.5 border-b border-[#b8c4dc] shrink-0">
          <div className="erp-doc-field" style={{ gridTemplateColumns: '55px 1fr' }}>
            <label className="text-[10px] font-bold text-[#4a5a8c] text-right pr-1">Cliente</label>
            <select
              value={selectedCustomer?.id ?? ''}
              onChange={(e) => {
                const customer = customers?.find?.((c) => c?.id === e.target.value);
                setSelectedCustomer(customer ?? null);
              }}
              className="erp-input text-[11px]"
            >
              <option value="">Consumidor Final</option>
              {customers?.map?.((customer) => (
                <option key={customer?.id} value={customer?.id}>
                  {customer?.name ?? ''} {customer?.document ? `(${customer.document})` : ''}
                </option>
              )) ?? []}
            </select>
          </div>
          {generateInvoice && (
            <div className="mt-1 flex items-center gap-1.5 pl-14">
              <span className="text-[10px] font-bold text-[#2563ad] border border-[#2563ad] px-1.5">{detectedDoc.letter}</span>
              <span className="text-[9px] text-[#5c7291]">{selectedCustomer ? (CONDICION_IVA_LABELS[selectedCustomer.taxCondition ?? ''] || 'Consumidor Final') : 'Consumidor Final'}</span>
            </div>
          )}
        </div>

        {/* Items del carrito — tabla compacta */}
        <div className="flex-1 overflow-y-auto border-b border-[#b8c4dc]">
          {cart.length === 0 ? (
            <div className="flex items-center justify-center h-20 text-[11px] text-[#9baac8]">Carrito vacío</div>
          ) : (
            <table className="erp-grid-table w-full">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th>Artículo</th>
                  <th className="w-20 text-center">Cant.</th>
                  <th className="w-24 text-right">Subtotal</th>
                  <th className="w-6"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="px-1.5 py-0.5">
                        <div className="text-[10px] font-semibold text-[#1a2a4c] truncate">{item.name}</div>
                        <div className="text-[9px] text-[#9baac8]">${item.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })} c/u</div>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 border border-[#9bb3cc] bg-white text-[#1a3a5c] flex items-center justify-center hover:bg-[#dde3f4] font-bold">−</button>
                        <span className="w-6 text-center text-[11px] font-bold text-[#1a2a4c]">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 border border-[#9bb3cc] bg-white text-[#1a3a5c] flex items-center justify-center hover:bg-[#dde3f4] font-bold">+</button>
                      </div>
                    </td>
                    <td className="text-right pr-2 font-mono font-bold text-[11px] text-[#2563ad]">
                      ${calculateItemTotal(item)?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-center">
                      <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 px-0.5">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Descuento global */}
        <div className="px-2 py-1.5 border-b border-[#b8c4dc] shrink-0">
          <div className="text-[9px] font-bold text-[#4a5a8c] uppercase mb-1">Descuento Global</div>
          <div className="flex gap-1">
            {[0, 5, 10, 15, 20].map((d) => (
              <button key={d} onClick={() => setGlobalDiscount(d)}
                className={`flex-1 py-1 text-[10px] font-bold border transition ${globalDiscount === d ? 'bg-[#2563ad] text-white border-[#2563ad]' : 'bg-white text-[#1a3a5c] border-[#9bb3cc] hover:bg-[#dde3f4]'}`}>
                {d}%
              </button>
            ))}
          </div>
        </div>

        {/* Método de pago */}
        <div className="px-2 py-1.5 border-b border-[#b8c4dc] shrink-0">
          <div className="text-[9px] font-bold text-[#4a5a8c] uppercase mb-1">Método de Pago</div>
          <div className="grid grid-cols-2 gap-1 mb-1">
            {[
              { name: 'Efectivo', icon: DollarSign },
              { name: 'Débito', icon: CreditCard },
              { name: 'Crédito', icon: CreditCard },
              { name: 'Transferencia', icon: ArrowDownToLine },
            ].map(({ name, icon: Icon }) => (
              <button key={name} onClick={() => setPaymentMethod(name)}
                className={`flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold border transition ${
                  paymentMethod === name ? 'bg-[#2563ad] text-white border-[#2563ad]' : 'bg-white text-[#1a3a5c] border-[#9bb3cc] hover:bg-[#dde3f4]'}`}>
                <Icon className="w-3 h-3" />{name}
              </button>
            ))}
          </div>
          {mpConfigured && (
            <button onClick={() => setPaymentMethod('MercadoPago')}
              className={`w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold border transition ${
                paymentMethod === 'MercadoPago' ? 'bg-sky-600 text-white border-sky-600' : 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'}`}>
              <CreditCard className="w-3 h-3" />MercadoPago<ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
          {mpConfigured && paymentMethod === 'MercadoPago' && (
            <div className="mt-1 grid grid-cols-3 gap-1">
              {[
                { mode: 'card' as const, icon: CreditCard, label: 'Tarjeta' },
                { mode: 'qr' as const, icon: QrCode, label: 'QR MP', disabled: !mpQrConfigured },
                { mode: 'checkout' as const, icon: ExternalLink, label: 'Link' },
              ].map(({ mode, icon: Icon, label, disabled }) => (
                <button key={mode} type="button" onClick={() => setMpMode(mode)} disabled={disabled}
                  className={`flex items-center justify-center gap-1 py-1 text-[9px] font-bold border disabled:opacity-50 transition ${
                    mpMode === mode ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-sky-700 border-sky-300 hover:bg-sky-50'}`}>
                  <Icon className="w-3 h-3" />{label}
                </button>
              ))}
            </div>
          )}
          {mpPendingSaleId && (
            <div className="mt-1 px-2 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[9px]">
              <div className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Esperando MP…</div>
              <button type="button" onClick={() => { cancelMpPending(mpPendingSaleId); setMpPendingSaleId(null); setMpQrImage(null); sessionStorage.removeItem('mp_pending_sale'); sessionStorage.removeItem('mp_pending_snapshot'); toast('Cancelado'); }} className="underline mt-0.5">Cancelar</button>
            </div>
          )}
        </div>

        {/* Factura electrónica */}
        <div className="px-2 py-1.5 border-b border-[#b8c4dc] shrink-0">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={generateInvoice} onChange={(e) => setGenerateInvoice(e.target.checked)} className="w-3 h-3" />
            <Shield className="w-3 h-3 text-[#2563ad]" />
            <span className="text-[10px] font-semibold text-[#1a3a5c]">Factura electrónica + CAE</span>
          </label>
          {generateInvoice && (
            <p className="text-[9px] text-[#5c7291] mt-0.5 ml-5">Tipo {detectedDoc.letter} según condición IVA del cliente.</p>
          )}
        </div>

        {/* Efectivo recibido */}
        {paymentMethod === 'Efectivo' && (
          <div className="px-2 py-1.5 border-b border-[#b8c4dc] shrink-0">
            <div className="text-[9px] font-bold text-[#4a5a8c] uppercase mb-1">Efectivo Recibido</div>
            <input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder="0.00"
              className="erp-input w-full text-right font-mono font-bold mb-1" />
            <div className="flex gap-1">
              {[100, 500, 1000, 2000, 5000, 10000].map((amount) => (
                <button key={amount} onClick={() => setCashReceived(String(amount))}
                  className="flex-1 py-0.5 text-[9px] border border-[#9bb3cc] bg-white hover:bg-[#dde3f4] text-[#1a3a5c] font-bold">
                  ${amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>
            {cashReceived && parseFloat(cashReceived) >= total && (
              <div className="mt-1 flex justify-between text-[10px]">
                <span className="text-[#5c7291]">Vuelto:</span>
                <span className="font-bold text-green-700 font-mono">${change?.toLocaleString?.('es-AR', { minimumFractionDigits: 2 }) ?? '0'}</span>
              </div>
            )}
          </div>
        )}

        {/* Total + botón COBRAR */}
        <div className="mt-auto shrink-0">
          {totalDiscount > 0 && (
            <div className="px-2 py-1 border-b border-[#b8c4dc] flex justify-between text-[10px]">
              <span className="text-[#5c7291]">Subtotal:</span>
              <span className="font-mono">${subtotal?.toLocaleString?.('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {totalDiscount > 0 && (
            <div className="px-2 py-1 border-b border-[#b8c4dc] flex justify-between text-[10px]">
              <span className="text-orange-600">Descuento:</span>
              <span className="font-mono text-orange-600">-${totalDiscount?.toLocaleString?.('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {/* Total grande al estilo Dragonfish */}
          <div className="bg-[#2563ad] px-3 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Total</span>
            <span className="text-white font-black text-2xl font-mono">
              $ {total?.toLocaleString?.('es-AR', { minimumFractionDigits: 2 }) ?? '0,00'}
            </span>
          </div>
          <div className="flex gap-1 p-2">
            <button onClick={clearCart} disabled={cart.length === 0}
              className="erp-btn-secondary text-xs py-2 px-3 disabled:opacity-40">
              Limpiar
            </button>
            <button onClick={handleCheckout} disabled={loading || mpLoading || cart.length === 0}
              className={`flex-1 py-2 text-sm font-black border-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                paymentMethod === 'MercadoPago' ? 'bg-sky-600 text-white hover:bg-sky-700' : 'bg-[#1e7c1e] text-white hover:bg-[#155a15]'}`}>
              {loading || mpLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Procesando…</>
              ) : paymentMethod === 'MercadoPago' ? (
                mpMode === 'qr' ? <><QrCode className="w-4 h-4" />Generar QR</> :
                mpMode === 'card' ? <><CreditCard className="w-4 h-4" />Cobrar tarjeta</> :
                <><ExternalLink className="w-4 h-4" />Pagar con MP</>
              ) : (
                <><Receipt className="w-4 h-4" />COBRAR (F4)</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* ========== MP QR MODAL ========== */}
    {mpQrImage && mpPendingSaleId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full mx-4 p-6 text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Escaneá para pagar</h3>
          <p className="text-sm text-slate-500 mb-4">El cliente paga con la app de Mercado Pago</p>
          <img src={mpQrImage} alt="QR Mercado Pago" className="mx-auto w-56 h-56 object-contain rounded-lg border border-slate-200" />
          <div className="mt-4 flex items-center justify-center gap-2 text-amber-700 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Esperando pago…
          </div>
          <button
            type="button"
            onClick={() => {
              cancelMpPending(mpPendingSaleId);
              setMpPendingSaleId(null);
              setMpQrImage(null);
              sessionStorage.removeItem('mp_pending_sale');
              sessionStorage.removeItem('mp_pending_snapshot');
              toast('Venta pendiente cancelada');
            }}
            className="mt-4 w-full py-2.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    )}

    {/* ========== MP CARD MODAL (in-app) ========== */}
    {showMpCardModal && mpPendingSaleId && mpPublicKey && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full max-h-[90vh] overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Pago con tarjeta</h3>
              <p className="text-sm text-slate-500">Total: ${mpCardAmount.toLocaleString('es-AR')}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowMpCardModal(false);
                if (mpPendingSaleId) cancelMpPending(mpPendingSaleId);
                setMpPendingSaleId(null);
                sessionStorage.removeItem('mp_pending_sale');
                sessionStorage.removeItem('mp_pending_snapshot');
              }}
              className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <MpPaymentBrick
            publicKey={mpPublicKey}
            amount={mpCardAmount}
            saleId={mpPendingSaleId}
            payerEmail={selectedCustomer?.email || undefined}
            onApproved={({ sale }) => handleMpCardApproved({ sale })}
            onError={(msg) => toast.error(msg)}
            onPending={() => toast('Pago en proceso…')}
          />
        </div>
      </div>
    )}

    {/* ========== PRINT CHOICE DIALOG ========== */}
    {showPrintChoice && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100/80 max-w-md w-full mx-4 p-6">
          {/* Header */}
          <div className="text-center mb-6">
            {lastInvoiceResult?.afip?.success ? (
              <>
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">¡Venta completada con éxito!</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Factura {lastInvoiceResult.invoice.invoiceType} Nº {lastInvoiceResult.invoice.invoiceNumber}
                </p>
                <p className="text-xs text-green-600 font-medium mt-1">
                  CAE: {lastInvoiceResult.afip.cae}
                </p>
              </>
            ) : lastInvoiceResult && !lastInvoiceResult.afip?.success ? (
              <>
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Venta registrada</h3>
                <p className="text-sm text-amber-600 mt-1">
                  Factura generada sin CAE. {lastInvoiceResult.afip?.error}
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">¡Venta completada!</h3>
                <p className="text-sm text-slate-500 mt-1">Venta Nº {lastSaleData?.saleNumber}</p>
              </>
            )}
          </div>

          {/* Print Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 text-center">¿Cómo querés imprimir?</p>
            
            <button onClick={() => openPrint('ticket')}
              className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
                <Printer className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-slate-900">Ticket (80mm)</p>
                <p className="text-xs text-slate-500">Impresión rápida para impresora térmica</p>
              </div>
            </button>

            {generateInvoice && lastInvoiceResult && (
              <button onClick={() => openPrint('a4')}
                className="w-full flex items-center gap-4 p-4 border-2 border-slate-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-slate-900">
                    Factura {lastInvoiceResult.invoice.invoiceType} (A4)
                  </p>
                  <p className="text-xs text-slate-500">
                    Comprobante fiscal completo con CAE y QR
                  </p>
                </div>
              </button>
            )}

            <button onClick={() => setShowPrintChoice(false)}
              className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition">
              Cerrar sin imprimir
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ========== PRINT DOCUMENT ========== */}
    {showPrint && (() => {
      const printData = buildPrintDocument();
      if (!printData) return null;
      return (
        <PrintDocument
          company={printData.company}
          customer={printData.customer}
          document={printData.document}
          onClose={() => setShowPrint(false)}
        />
      );
    })()}
    </>
    </ErpPageShell>
  );
}
