'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Plus, 
  Trash2, 
  User,
  FileText,
  Calculator,
  Printer,
  AlertCircle,
  CheckCircle,
  Loader2,
  IdCard,
  Link2,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import { PrintDocument, DocumentData, DocumentCompany, DocumentCustomer } from '@/components/print-document';
import { getDocumentLetter } from '@/lib/document-codes';
import { ErpDocumentShell, ErpFieldRow } from '@/components/erp/erp-document-shell';
import { DocumentEmissionTabs } from '@/components/erp/document-emission-tabs';
import { MpInvoicePaymentPanel } from '@/components/payments/mp-invoice-payment-panel';

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
  email: string;
  document: string;
  address?: string;
  city?: string;
  taxCondition?: string;
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
  fechaInicioActividad?: string;
  defaultPOS?: number;
}

interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

const DOCUMENT_TYPES = [
  // Tipo A - Responsable Inscripto a R.I. o Monotributista
  { code: '001', name: 'Factura A', letter: 'A', type: 'factura', category: 'standard' },
  { code: '002', name: 'Nota de Débito A', letter: 'A', type: 'nota_debito', category: 'standard' },
  { code: '003', name: 'Nota de Crédito A', letter: 'A', type: 'nota_credito', category: 'standard' },
  // Tipo B - Responsable Inscripto a Consumidor Final o Exento
  { code: '006', name: 'Factura B', letter: 'B', type: 'factura', category: 'standard' },
  { code: '007', name: 'Nota de Débito B', letter: 'B', type: 'nota_debito', category: 'standard' },
  { code: '008', name: 'Nota de Crédito B', letter: 'B', type: 'nota_credito', category: 'standard' },
  { code: '009', name: 'Recibo B', letter: 'B', type: 'recibo', category: 'standard' },
  // Tipo C - Monotributista o Exento a cualquier sujeto
  { code: '011', name: 'Factura C', letter: 'C', type: 'factura', category: 'standard' },
  { code: '012', name: 'Nota de Débito C', letter: 'C', type: 'nota_debito', category: 'standard' },
  { code: '013', name: 'Nota de Crédito C', letter: 'C', type: 'nota_credito', category: 'standard' },
  { code: '015', name: 'Recibo C', letter: 'C', type: 'recibo', category: 'standard' },
  { code: '016', name: 'Nota de Venta al Contado C', letter: 'C', type: 'nota_venta', category: 'standard' },
  // Tipo E - Exportación
  { code: '019', name: 'Factura de Exportación E', letter: 'E', type: 'factura', category: 'export' },
  { code: '020', name: 'Nota de Débito E (Export)', letter: 'E', type: 'nota_debito', category: 'export' },
  { code: '021', name: 'Nota de Crédito E (Export)', letter: 'E', type: 'nota_credito', category: 'export' },
  // Tipo T - Turismo
  { code: '022', name: 'Factura T (Turistas)', letter: 'T', type: 'factura', category: 'tourism' },
  // Tipo A con Retención (ex Factura M - ARCA eliminó la letra M)
  { code: '051', name: 'Factura A (Sujeta a Retención)', letter: 'A', type: 'factura', category: 'retention', isRetention: true },
  { code: '052', name: 'ND A (Sujeta a Retención)', letter: 'A', type: 'nota_debito', category: 'retention', isRetention: true },
  { code: '053', name: 'NC A (Sujeta a Retención)', letter: 'A', type: 'nota_credito', category: 'retention', isRetention: true },
  // FCE MiPyME - Tipo A
  { code: '201', name: 'FCE MiPyME - Factura A', letter: 'FCE-A', type: 'factura', category: 'fce', isFCE: true },
  { code: '202', name: 'FCE MiPyME - Nota Débito A', letter: 'FCE-A', type: 'nota_debito', category: 'fce', isFCE: true },
  { code: '203', name: 'FCE MiPyME - Nota Crédito A', letter: 'FCE-A', type: 'nota_credito', category: 'fce', isFCE: true },
  // FCE MiPyME - Tipo B
  { code: '206', name: 'FCE MiPyME - Factura B', letter: 'FCE-B', type: 'factura', category: 'fce', isFCE: true },
  { code: '207', name: 'FCE MiPyME - Nota Débito B', letter: 'FCE-B', type: 'nota_debito', category: 'fce', isFCE: true },
  { code: '208', name: 'FCE MiPyME - Nota Crédito B', letter: 'FCE-B', type: 'nota_credito', category: 'fce', isFCE: true },
  // FCE MiPyME - Tipo C
  { code: '211', name: 'FCE MiPyME - Factura C', letter: 'FCE-C', type: 'factura', category: 'fce', isFCE: true },
  { code: '212', name: 'FCE MiPyME - Nota Débito C', letter: 'FCE-C', type: 'nota_debito', category: 'fce', isFCE: true },
  { code: '213', name: 'FCE MiPyME - Nota Crédito C', letter: 'FCE-C', type: 'nota_credito', category: 'fce', isFCE: true },
];

const TAX_CONDITIONS = [
  { value: 'responsable_inscripto', label: 'IVA Responsable Inscripto', requiresCUIT: true },
  { value: 'consumidor_final', label: 'Consumidor Final', requiresCUIT: false },
  { value: 'monotributista', label: 'Responsable Monotributo', requiresCUIT: true },
  { value: 'exento', label: 'IVA Exento', requiresCUIT: true },
];

const CONCEPTS = [
  { value: 1, label: 'Productos' },
  { value: 2, label: 'Servicios' },
  { value: 3, label: 'Productos y Servicios' },
];

export function EmitirFacturaClient() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [documentSearching, setDocumentSearching] = useState(false);
  
  // Form state
  const [documentCode, setDocumentCode] = useState('006');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [customerDocumentType, setCustomerDocumentType] = useState('DNI');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerTaxCondition, setCustomerTaxCondition] = useState('consumidor_final');
  const [concept, setConcept] = useState(1);
  const [serviceStartDate, setServiceStartDate] = useState('');
  const [serviceEndDate, setServiceEndDate] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [paymentCondition, setPaymentCondition] = useState('Contado');
  const [observations, setObservations] = useState('');
  const [refFactura, setRefFactura] = useState('');
  const [linkedInvoiceId, setLinkedInvoiceId] = useState('');
  const [linkedFacturaData, setLinkedFacturaData] = useState<{documentCode?: string; pointOfSale?: number; sequenceNumber?: number; cuit?: string; date?: string} | null>(null);
  const [availableFacturas, setAvailableFacturas] = useState<any[]>([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);
  const [showFacturaSelector, setShowFacturaSelector] = useState(false);
  const [facturaSearch, setFacturaSearch] = useState('');
  
  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 21, total: 0 }
  ]);

  // Result and Print Preview
  const [createdInvoice, setCreatedInvoice] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showMoreTypes, setShowMoreTypes] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchBusinessConfig();
  }, []);

  // Pre-fill from query params (for NC/ND from existing invoice)
  useEffect(() => {
    const qDocCode = searchParams.get('documentCode');
    const qRefFactura = searchParams.get('refFactura');
    const qLinkedId = searchParams.get('linkedInvoiceId');
    const qCustomerName = searchParams.get('customerName');
    const qCustomerDoc = searchParams.get('customerDocument');
    const qCustomerTax = searchParams.get('customerTaxCondition');
    const qCustomerAddr = searchParams.get('customerAddress');

    if (qDocCode) {
      setDocumentCode(qDocCode);
      // Show expanded section if it's not a standard type
      const isStandard = ['001','002','003','006','007','008','009','011','012','013','015','016'].includes(qDocCode);
      if (!isStandard) setShowMoreTypes(true);
    }
    if (qRefFactura) {
      setRefFactura(qRefFactura);
      const tipoL = ['003','008','013','021','053','203','208','213'].includes(qDocCode || '') ? 'NC' : 'ND';
      setObservations(`${tipoL} de Factura ${qRefFactura}`);
      if (qLinkedId) {
        setLinkedInvoiceId(qLinkedId);
        // Fetch the linked invoice to auto-fill items
        fetch(`/api/invoices/${qLinkedId}`).then(res => res.json()).then(data => {
          const inv = data.invoice || data;
          if (inv?.items && Array.isArray(inv.items) && inv.items.length > 0) {
            const parsed = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
            setItems(parsed.map((item: any) => ({
              description: item.name || item.description || '',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              discount: item.discount || 0,
              taxRate: item.taxRate || item.ivaRate || 21,
              total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
            })));
          }
        }).catch(() => {});
      } else {
        // Fallback: try to find by invoice number
        fetch('/api/invoices?status=').then(res => res.json()).then(data => {
          const all = data.invoices || data || [];
          const found = all.find((inv: any) => inv.invoiceNumber === qRefFactura);
          if (found) {
            setLinkedInvoiceId(found.id);
            if (found.items && Array.isArray(found.items) && found.items.length > 0) {
              const parsed = typeof found.items === 'string' ? JSON.parse(found.items) : found.items;
              setItems(parsed.map((item: any) => ({
                description: item.name || item.description || '',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                discount: item.discount || 0,
                taxRate: item.taxRate || item.ivaRate || 21,
                total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
              })));
            }
          }
        }).catch(() => {});
      }
    }
    if (qCustomerName) setCustomerName(qCustomerName);
    if (qCustomerDoc) {
      setCustomerDocument(qCustomerDoc);
      const clean = qCustomerDoc.replace(/[-\s.]/g, '');
      if (clean.length === 11) {
        const prefix = clean.substring(0, 2);
        setCustomerDocumentType(['20','23','24','27'].includes(prefix) ? 'CUIL' : 'CUIT');
      }
    }
    if (qCustomerTax) setCustomerTaxCondition(qCustomerTax);
    if (qCustomerAddr) setCustomerAddress(qCustomerAddr);

    // From quote/presupuesto
    const qFromQuote = searchParams.get('fromQuote');
    if (qFromQuote) {
      fetch(`/api/quotes/${qFromQuote}`).then(r => r.json()).then(data => {
        const quote = data.quote || data;
        if (quote) {
          if (quote.customerName) setCustomerName(quote.customerName);
          if (quote.items && Array.isArray(quote.items)) {
            setItems(quote.items.map((item: any) => ({
              description: item.productName || item.description || '',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              discount: item.discount || 0,
              taxRate: 21,
              total: item.subtotal || (item.quantity || 1) * (item.unitPrice || 0),
            })));
          }
          if (quote.notes) setObservations(`Ref. Presupuesto ${quote.quoteNumber}${quote.notes ? ' - ' + quote.notes : ''}`);
          else setObservations(`Ref. Presupuesto ${quote.quoteNumber}`);
        }
      }).catch(() => {});
    }
  }, [searchParams]);

  // Detect if current document code is NC or ND
  const isNCorND = (() => {
    const ncCodes = ['003','008','013','021','053','203','208','213'];
    const ndCodes = ['002','007','012','020','052','202','207','212'];
    return ncCodes.includes(documentCode) || ndCodes.includes(documentCode);
  })();

  const isNC = ['003','008','013','021','053','203','208','213'].includes(documentCode);

  // Map NC/ND code back to its parent factura codes
  const getParentFacturaCodes = (code: string): string[] => {
    const map: Record<string, string[]> = {
      '002': ['001'], '003': ['001'], // A
      '007': ['006'], '008': ['006'], // B
      '012': ['011'], '013': ['011'], // C
      '020': ['019'], '021': ['019'], // E
      '052': ['051'], '053': ['051'], // A Ret
      '202': ['201'], '203': ['201'], // FCE A
      '207': ['206'], '208': ['206'], // FCE B
      '212': ['211'], '213': ['211'], // FCE C
    };
    return map[code] || [];
  };

  // Fetch facturas for the selector when NC/ND is selected
  const fetchFacturasForSelector = useCallback(async () => {
    setLoadingFacturas(true);
    try {
      const res = await fetch('/api/invoices?status=');
      if (res.ok) {
        const data = await res.json();
        const allInvoices = data.invoices || data || [];
        // Filter: only facturas (not NC/ND), with CAE, not anulada
        const parentCodes = getParentFacturaCodes(documentCode);
        const facturas = allInvoices.filter((inv: any) => {
          if (inv.status === 'anulada') return false;
          if (!inv.cae) return false;
          // If we know parent codes, filter by them; otherwise show all facturas
          if (parentCodes.length > 0) {
            return parentCodes.includes(inv.documentCode);
          }
          // Fallback: show all facturas (codes ending in 1, 6, etc)
          const facturaCodes = ['001','006','011','019','051','201','206','211'];
          return facturaCodes.includes(inv.documentCode);
        });
        setAvailableFacturas(facturas);
      }
    } catch (error) {
      console.error('Error fetching facturas:', error);
    } finally {
      setLoadingFacturas(false);
    }
  }, [documentCode]);

  // Load facturas when NC/ND is selected
  useEffect(() => {
    if (isNCorND) {
      fetchFacturasForSelector();
    } else {
      setAvailableFacturas([]);
      setLinkedInvoiceId('');
      setShowFacturaSelector(false);
    }
  }, [isNCorND, fetchFacturasForSelector]);

  // Select a factura and auto-fill everything
  const selectLinkedFactura = (factura: any) => {
    setLinkedInvoiceId(factura.id);
    setRefFactura(factura.invoiceNumber);
    // Save associated voucher data for CbtesAsoc (ARCA requirement for NC/ND)
    setLinkedFacturaData({
      documentCode: factura.documentCode,
      pointOfSale: factura.pointOfSale,
      sequenceNumber: factura.sequenceNumber,
      cuit: factura.customerDocument,
      date: factura.createdAt ? new Date(factura.createdAt).toISOString().split('T')[0].replace(/-/g, '') : undefined,
    });
    setCustomerName(factura.customerName || '');
    setCustomerDocument(factura.customerDocument || '');
    setCustomerAddress(factura.customerAddress || '');
    setCustomerTaxCondition(factura.customerTaxCondition || 'consumidor_final');
    if (factura.customerDocument) {
      const clean = factura.customerDocument.replace(/[-\s.]/g, '');
      if (clean.length === 11) {
        const prefix = clean.substring(0, 2);
        setCustomerDocumentType(['20','23','24','27'].includes(prefix) ? 'CUIL' : 'CUIT');
      }
    }
    // Auto-fill items from the factura
    if (factura.items && Array.isArray(factura.items) && factura.items.length > 0) {
      const parsedItems = (typeof factura.items === 'string' ? JSON.parse(factura.items) : factura.items);
      setItems(parsedItems.map((item: any) => ({
        description: item.name || item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        taxRate: item.taxRate || item.ivaRate || 21,
        total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
      })));
    }
    // Set observations
    const tipoLabel = isNC ? 'NC' : 'ND';
    setObservations(`${tipoLabel} de Factura ${factura.invoiceNumber}`);
    setShowFacturaSelector(false);
    setFacturaSearch('');
    toast.success(`Datos cargados de Factura ${factura.invoiceNumber}`);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchBusinessConfig = async () => {
    try {
      const res = await fetch('/api/config/business');
      if (res.ok) {
        const data = await res.json();
        setBusinessConfig(data);
      }
    } catch (error) {
      console.error('Error fetching business config:', error);
    }
  };

  // Search customer by document (CUIT/CUIL/DNI) - queries local DB + AFIP padrón
  const searchByDocument = useCallback(async (document: string) => {
    if (!document || document.length < 7) return;
    
    const cleanDoc = document.replace(/[-\s.]/g, '');
    if (cleanDoc.length < 7) return;

    setDocumentSearching(true);
    try {
      // Use the new lookup-document API that queries local DB + AFIP padrón + auto-creates
      const res = await fetch(`/api/customers/lookup-document?document=${encodeURIComponent(cleanDoc)}&autoCreate=true`);
      const data = await res.json();
      
      if (data.found && data.customer) {
        // Customer found (from local DB or AFIP padrón)
        setSelectedCustomer(data.customer.id ? data.customer : null);
        setCustomerName(data.customer.name);
        setCustomerDocument(data.customer.document);
        setCustomerDocumentType(data.customer.documentType || 'CUIT');
        setCustomerAddress(data.customer.address || '');
        setCustomerCity(data.customer.city || '');
        setCustomerTaxCondition(data.customer.taxCondition || 'consumidor_final');
        
        if (data.source === 'afip') {
          const autoMsg = data.autoCreated 
            ? '✅ Cliente importado desde AFIP y guardado automáticamente' 
            : '✅ Datos obtenidos desde AFIP';
          toast.success(autoMsg);
          // Refresh customers list if auto-created
          if (data.autoCreated) {
            fetchCustomers();
          }
        } else {
          toast.success(`Cliente encontrado: ${data.customer.name}`);
        }
      } else if (data.suggestion) {
        // Not found anywhere
        setCustomerDocument(data.suggestion.document);
        setCustomerDocumentType(data.suggestion.documentType);
        setCustomerTaxCondition(data.suggestion.taxCondition);
        setSelectedCustomer(null);
        setCustomerName('');
        setCustomerAddress('');
        setCustomerCity('');
        toast(data.message || 'No se encontraron datos. Complete manualmente.', { icon: 'ℹ️' });
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error searching by document:', error);
      toast.error('Error al buscar documento');
    } finally {
      setDocumentSearching(false);
    }
  }, []);

  // Handle document input change - auto-search when 11 digits (CUIT/CUIL)
  const handleDocumentChange = (value: string) => {
    setCustomerDocument(value);
    
    // Auto-detect document type
    const clean = value.replace(/[-\s.]/g, '');
    if (clean.length === 11) {
      const prefix = clean.substring(0, 2);
      if (['20', '23', '24', '27'].includes(prefix)) {
        setCustomerDocumentType('CUIL');
      } else if (['30', '33', '34'].includes(prefix)) {
        setCustomerDocumentType('CUIT');
      } else {
        setCustomerDocumentType('CUIT');
      }
      // Auto-trigger search when 11 digits entered (CUIT/CUIL)
      searchByDocument(clean);
    } else if (clean.length >= 7 && clean.length <= 8) {
      setCustomerDocumentType('DNI');
    }
  };

  // Handle Enter key or blur on document field
  const handleDocumentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchByDocument(customerDocument);
    }
  };

  // Also search on blur (when user leaves the field)
  const handleDocumentBlur = () => {
    const clean = customerDocument.replace(/[-\s.]/g, '');
    if (clean.length >= 7) {
      searchByDocument(customerDocument);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerDocument(customer.document || '');
    setCustomerAddress(customer.address || '');
    setCustomerCity(customer.city || '');
    setCustomerTaxCondition(customer.taxCondition || 'consumidor_final');
    setSearchCustomer('');
    
    // Detect document type
    const clean = (customer.document || '').replace(/[-\s]/g, '');
    if (clean.length === 11) {
      const prefix = clean.substring(0, 2);
      if (['20', '23', '24', '27'].includes(prefix)) {
        setCustomerDocumentType('CUIL');
      } else {
        setCustomerDocumentType('CUIT');
      }
    } else {
      setCustomerDocumentType('DNI');
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 21, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Recalculate total
    const item = newItems[index];
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate / 100);
    item.total = afterDiscount + taxAmount;
    
    setItems(newItems);
  };

  const addProductToItems = (product: Product) => {
    const existingIndex = items.findIndex(i => i.productId === product.id);
    if (existingIndex >= 0) {
      updateItem(existingIndex, 'quantity', items[existingIndex].quantity + 1);
    } else {
      const newItem: InvoiceItem = {
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.price,
        discount: 0,
        taxRate: 21,
        total: product.price * 1.21
      };
      
      if (items.length === 1 && !items[0].description) {
        setItems([newItem]);
      } else {
        setItems([...items, newItem]);
      }
    }
    setSearchProduct('');
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discount / 100);
      return sum + (itemSubtotal - discountAmount);
    }, 0);

    const tax = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const discountAmount = itemSubtotal * (item.discount / 100);
      const afterDiscount = itemSubtotal - discountAmount;
      return sum + (afterDiscount * (item.taxRate / 100));
    }, 0);

    const total = subtotal + tax;

    return { subtotal, tax, total, netAmount: subtotal };
  };

  const handleSubmit = async () => {
    if (!customerName) {
      toast.error('Debe ingresar el nombre del cliente');
      return;
    }

    if (items.every(i => !i.description)) {
      toast.error('Debe agregar al menos un item');
      return;
    }

    const docType = DOCUMENT_TYPES.find(d => d.code === documentCode);
    if (docType?.letter === 'A' && !customerDocument) {
      toast.error('Las facturas tipo A requieren CUIT del cliente');
      return;
    }

    setLoading(true);
    try {
      const totals = calculateTotals();
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer?.id,
          customerName,
          customerDocument,
          customerTaxCondition,
          customerAddress,
          documentCode,
          concept,
          serviceStartDate: concept > 1 ? serviceStartDate : null,
          serviceEndDate: concept > 1 ? serviceEndDate : null,
          paymentDueDate: paymentDueDate || null,
          items: items.filter(i => i.description).map(it => ({
            name: it.description,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discount: it.discount,
            taxRate: it.taxRate,
            ivaRate: it.taxRate,
            subtotal: it.quantity * it.unitPrice * (1 - (it.discount || 0) / 100),
            total: it.total,
          })),
          subtotal: totals.subtotal,
          observations,
          linkedInvoiceId: linkedInvoiceId || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Request REAL CAE from AFIP
        const cbteTipo = parseInt(documentCode);
        let afipCae = '';
        let afipCaeVto = '';
        let afipComprobanteNum = 0;
        let afipQrUrl = '';
        let afipSuccess = false;

        // Map IVA rates to AFIP IVA IDs
        const getIvaId = (taxRate: number) => {
          if (taxRate === 21) return 5;
          if (taxRate === 10.5) return 4;
          if (taxRate === 27) return 6;
          if (taxRate === 5) return 8;
          if (taxRate === 2.5) return 9;
          return 3; // 0%
        };

        // Map document type for AFIP
        const getDocTipo = () => {
          if (customerDocumentType === 'CUIT') return 80;
          if (customerDocumentType === 'CUIL') return 86;
          if (customerDocumentType === 'DNI') return 96;
          return 99; // Consumidor Final
        };

        // Map customerTaxCondition to AFIP CondicionIVAReceptorId (RG 5616)
        const getCondicionIVAReceptorId = (): number => {
          switch (customerTaxCondition) {
            case 'responsable_inscripto': return 1;
            case 'exento': return 4;
            case 'consumidor_final': return 5;
            case 'monotributista': return 6;
            case 'no_categorizado': return 7;
            case 'proveedor_exterior': return 8;
            case 'cliente_exterior': return 9;
            case 'iva_liberado': return 10;
            case 'monotributista_social': return 13;
            case 'iva_no_alcanzado': return 15;
            default: return 5; // Default: Consumidor Final
          }
        };

        try {
          const afipRes = await fetch('/api/afip/invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoiceId: data.invoice?.id,
              puntoVenta: businessConfig?.defaultPOS || 1,
              tipoComprobante: cbteTipo,
              concepto: concept,
              tipoDocumento: getDocTipo(),
              nroDocumento: customerDocument || '0',
              condicionIVAReceptorId: getCondicionIVAReceptorId(),
              items: items.filter(i => i.description).map(item => ({
                descripcion: item.description,
                cantidad: item.quantity,
                precioUnitario: item.unitPrice * (1 - item.discount / 100),
                bonificacion: 0,
                ivaId: getIvaId(item.taxRate),
              })),
              fechaServicioDesde: concept > 1 ? serviceStartDate.replace(/-/g, '') : undefined,
              fechaServicioHasta: concept > 1 ? serviceEndDate.replace(/-/g, '') : undefined,
              fechaVencimientoPago: concept > 1 && paymentDueDate ? paymentDueDate.replace(/-/g, '') : undefined,
              moneda: 'PES',
              cotizacion: 1,
              // CbtesAsoc for NC/ND (ARCA requirement)
              ...(linkedFacturaData ? {
                cbtesAsociados: [{
                  tipo: parseInt(linkedFacturaData.documentCode || '0'),
                  puntoVenta: linkedFacturaData.pointOfSale || (businessConfig?.defaultPOS || 1),
                  numero: linkedFacturaData.sequenceNumber || 0,
                  fecha: linkedFacturaData.date,
                }]
              } : {}),
            }),
          });

          const afipData = await afipRes.json();
          if (afipData.success) {
            afipCae = afipData.cae;
            afipCaeVto = afipData.caeVencimiento;
            afipComprobanteNum = afipData.comprobanteNumero;
            afipQrUrl = afipData.qrUrl;
            afipSuccess = true;
            toast.success(`CAE obtenido: ${afipCae}`);
          } else {
            const errMsg = afipData.errores?.map((e: any) => e.msg).join(', ') || afipData.error || 'Error AFIP';
            toast.error(`AFIP: ${errMsg}`);
            console.error('AFIP errors:', afipData);
          }
        } catch (afipError: any) {
          console.error('AFIP request error:', afipError);
          toast.error('Error al conectar con AFIP. El comprobante fue guardado sin CAE.');
        }

        // CRITICAL FIX: Refresh invoice data from DB to get the real AFIP number
        if (afipSuccess && data.invoice?.id) {
          try {
            const refreshRes = await fetch(`/api/invoices/${data.invoice.id}`);
            if (refreshRes.ok) {
              const refreshedInvoice = await refreshRes.json();
              // Update the invoice number with the real one from AFIP
              data.invoice.invoiceNumber = refreshedInvoice.invoiceNumber;
              data.invoice.sequenceNumber = refreshedInvoice.sequenceNumber;
              afipComprobanteNum = refreshedInvoice.sequenceNumber || afipComprobanteNum;
            }
          } catch (refreshError) {
            console.warn('Could not refresh invoice data:', refreshError);
          }
        }

        // Parse CAE expiration date
        let caeExpiration = new Date();
        if (afipCaeVto) {
          caeExpiration = new Date(
            `${afipCaeVto.substring(0, 4)}-${afipCaeVto.substring(4, 6)}-${afipCaeVto.substring(6, 8)}`
          );
        } else {
          caeExpiration.setDate(caeExpiration.getDate() + 10);
        }

        setCreatedInvoice({
          ...data.invoice,
          cae: afipCae || 'PENDIENTE',
          caeExpiration,
          documentCode,
          invoiceType: docType?.letter || 'B',
          paymentCondition,
          concept: String(concept),
          serviceStartDate: concept > 1 ? new Date(serviceStartDate) : null,
          serviceEndDate: concept > 1 ? new Date(serviceEndDate) : null,
          dueDate: paymentDueDate ? new Date(paymentDueDate) : null,
          netAmount: totals.subtotal,
          taxAmount: totals.tax,
          comprobanteNumero: afipComprobanteNum,
          qrUrl: afipQrUrl,
          afipSuccess,
          items: items.filter(i => i.description).map(item => ({
            name: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.taxRate,
            subtotal: item.quantity * item.unitPrice * (1 - item.discount / 100)
          }))
        });
        setShowSuccess(true);
        toast.success(afipSuccess ? 'Comprobante emitido con CAE de AFIP' : 'Comprobante guardado (sin CAE)');
        resetForm();
      } else {
        toast.error(data.error || 'Error al emitir comprobante');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al emitir comprobante');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerName('');
    setCustomerDocument('');
    setCustomerDocumentType('DNI');
    setCustomerAddress('');
    setCustomerCity('');
    setCustomerTaxCondition('consumidor_final');
    setConcept(1);
    setServiceStartDate('');
    setServiceEndDate('');
    setPaymentDueDate('');
    setPaymentCondition('Contado');
    setObservations('');
    setItems([{ description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 21, total: 0 }]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const totals = calculateTotals();
  const selectedDocType = DOCUMENT_TYPES.find(d => d.code === documentCode);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchProduct.toLowerCase())
  ).slice(0, 5);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    (c.document && c.document.includes(searchCustomer))
  ).slice(0, 5);

  // Get data for PrintDocument component
  const getDocumentDataForPrint = (): DocumentData | null => {
    if (!createdInvoice) return null;
    const invItems = createdInvoice.items || [];
    // Determine document type
    const cbteTipo = createdInvoice.documentCode || documentCode;
    let docType: DocumentData['documentType'] = 'factura';
    const cbteTipoNum = parseInt(cbteTipo, 10);
    const ncCodes = [3, 8, 13, 21, 53, 203, 208, 213];
    const ndCodes = [2, 7, 12, 20, 52, 202, 207, 212];
    if (ncCodes.includes(cbteTipoNum)) docType = 'nota_credito';
    if (ndCodes.includes(cbteTipoNum)) docType = 'nota_debito';
    
    const letter = (createdInvoice.invoiceType || selectedDocType?.letter || 'B') as DocumentData['documentLetter'];
    
    return {
      documentType: docType,
      documentLetter: letter,
      documentCode: cbteTipo,
      documentNumber: createdInvoice.invoiceNumber || 
        `${String(businessConfig?.defaultPOS || 1).padStart(4, '0')}-${String(createdInvoice.comprobanteNumero || 0).padStart(8, '0')}`,
      pointOfSale: businessConfig?.defaultPOS || 1,
      date: new Date(createdInvoice.createdAt),
      dueDate: createdInvoice.dueDate ? new Date(createdInvoice.dueDate) : undefined,
      items: invItems.map((item: any, idx: number) => ({
        code: item.code || item.productCode || item.sku || String(idx + 1).padStart(3, '0'),
        name: item.description || item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        ivaRate: item.ivaRate || 21,
        ivaAmount: item.ivaAmount || 0,
        subtotal: item.total || (item.quantity * item.unitPrice - (item.discount || 0)),
      })),
      subtotal: createdInvoice.subtotal || 0,
      ivaTotal: createdInvoice.taxAmount || createdInvoice.tax || 0,
      total: createdInvoice.total,
      cae: createdInvoice.cae,
      caeExpiration: createdInvoice.caeExpiration,
      paymentCondition: createdInvoice.paymentCondition || paymentCondition,
      concept: createdInvoice.concept,
      serviceStartDate: createdInvoice.serviceStartDate,
      serviceEndDate: createdInvoice.serviceEndDate,
      currency: 'ARS',
      template: 'profesional',
      associatedInvoice: linkedFacturaData && refFactura ? {
        documentCode: linkedFacturaData.documentCode,
        documentLetter: linkedFacturaData.documentCode
          ? getDocumentLetter(linkedFacturaData.documentCode)
          : undefined,
        documentNumber: refFactura,
        pointOfSale: linkedFacturaData.pointOfSale,
        date: linkedFacturaData.date ? new Date(linkedFacturaData.date) : undefined,
      } : undefined,
    };
  };

  const getCompanyForPrint = (): DocumentCompany => ({
    businessName: businessConfig?.businessName || '',
    legalName: businessConfig?.legalName,
    cuit: businessConfig?.cuit,
    iibb: businessConfig?.iibb,
    condicionIva: businessConfig?.condicionIva,
    address: businessConfig?.address,
    city: businessConfig?.city,
    province: businessConfig?.province,
    phone: businessConfig?.phone,
    email: businessConfig?.email,
    website: (businessConfig as any)?.website,
    fechaInicioActividad: businessConfig?.fechaInicioActividad || (businessConfig as any)?.inicioActividades,
    logo: (businessConfig as any)?.logo,
    defaultPOS: businessConfig?.defaultPOS,
  });

  const getCustomerForPrint = (): DocumentCustomer => {
    const doc = createdInvoice?.customerDocument || customerDocument;
    const clean = (doc || '').replace(/[-\s.]/g, '');
    const isCuit = clean.length === 11;
    return {
      name: createdInvoice?.customerName || customerName,
      cuit: isCuit ? clean : undefined,
      document: !isCuit ? doc : undefined,
      documentType: customerDocumentType,
      condicionIva: createdInvoice?.customerTaxCondition || customerTaxCondition,
      address: createdInvoice?.customerAddress || customerAddress,
      city: customerCity,
    };
  };

  return (
    <>
      {/* Success Modal */}
      {showSuccess && createdInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {createdInvoice.afipSuccess ? '✅ Comprobante Autorizado por AFIP' : '⚠️ Comprobante Guardado'}
              </h3>
              <p className="text-slate-600 mb-4">
                {selectedDocType?.name || 'Comprobante'} {createdInvoice.afipSuccess ? 'con CAE de AFIP' : 'sin CAE (pendiente)'}
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mb-4 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Número:</span>
                  <span className="font-mono font-bold">{createdInvoice.comprobanteNumero ? `${String(businessConfig?.defaultPOS || 1).padStart(4, '0')}-${String(createdInvoice.comprobanteNumero).padStart(8, '0')}` : createdInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Tipo:</span>
                  <span className="font-medium">{selectedDocType?.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Cliente:</span>
                  <span className="font-medium">{createdInvoice.customerName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">CAE:</span>
                  <span className={`font-mono text-sm ${createdInvoice.afipSuccess ? 'text-green-600 font-bold' : 'text-yellow-600'}`}>
                    {createdInvoice.cae}
                  </span>
                </div>
                {createdInvoice.caeExpiration && createdInvoice.afipSuccess && (
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">Vto. CAE:</span>
                    <span className="text-sm">{new Date(createdInvoice.caeExpiration).toLocaleDateString('es-AR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-600">Total:</span>
                  <span className="font-bold text-lg">{formatCurrency(createdInvoice.total)}</span>
                </div>
              </div>
              {createdInvoice.afipSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-xs text-green-700">
                  ✅ Comprobante autorizado por AFIP/ARCA. El CAE es válido y el comprobante tiene valor fiscal.
                </div>
              )}
              {!createdInvoice.afipSuccess && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs text-yellow-700">
                  ⚠️ No se pudo obtener CAE de AFIP. El comprobante fue guardado pero no tiene valor fiscal hasta obtener el CAE.
                </div>
              )}
              {createdInvoice.id && createdInvoice.total > 0 && (
                <div className="mb-4 text-left">
                  <MpInvoicePaymentPanel
                    invoiceId={createdInvoice.id}
                    invoiceNumber={createdInvoice.invoiceNumber}
                    total={createdInvoice.total}
                    paidAmount={createdInvoice.paidAmount || 0}
                    customerEmail={createdInvoice.customerEmail}
                    compact
                  />
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrintPreview(true)}
                  className="flex-1 px-4 py-2 border border-slate-100/60 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Ver/Imprimir
                </button>
                <button
                  onClick={() => setShowSuccess(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/20"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && createdInvoice && businessConfig && getDocumentDataForPrint() && (
        <PrintDocument
          company={getCompanyForPrint()}
          customer={getCustomerForPrint()}
          document={getDocumentDataForPrint()!}
          onClose={() => setShowPrintPreview(false)}
        />
      )}

      <ErpDocumentShell
        title={`Emisión de comprobantes — ${selectedDocType?.name || 'Factura B'}`}
        subtitle="Comprobantes fiscales con CAE ARCA"
        module="FACTURACIÓN"
        statusText={loading ? 'Guardando comprobante…' : `Items: ${items.filter(i => i.description).length}`}
        onNew={resetForm}
        onSave={handleSubmit}
        onCancel={resetForm}
        onPrint={() => createdInvoice && setShowPrintPreview(true)}
        saveLoading={loading}
        saveLabel="Emitir comprobante"
        header={
          <>
          <DocumentEmissionTabs />
          <div className="grid lg:grid-cols-2 gap-x-6 gap-y-0">
            <ErpFieldRow label="Cliente">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={customerDocument}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  onKeyDown={handleDocumentKeyDown}
                  onBlur={handleDocumentBlur}
                  placeholder="CUIT/DNI"
                  className="erp-input w-28 font-mono"
                />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre o razón social"
                  className="erp-input flex-1"
                />
                <button type="button" onClick={() => searchByDocument(customerDocument)} className="erp-toolbtn px-2" title="Buscar padrón">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </ErpFieldRow>
            <ErpFieldRow label="Condición IVA">
              <select value={customerTaxCondition} onChange={(e) => setCustomerTaxCondition(e.target.value)} className="erp-input w-full">
                {TAX_CONDITIONS.map((tc) => (
                  <option key={tc.value} value={tc.value}>{tc.label}</option>
                ))}
              </select>
            </ErpFieldRow>
            <ErpFieldRow label="Tipo comprobante">
              <select value={documentCode} onChange={(e) => setDocumentCode(e.target.value)} className="erp-input w-full">
                {DOCUMENT_TYPES.filter((d) => d.category === 'standard' || d.category === 'fce').map((doc) => (
                  <option key={doc.code} value={doc.code}>{doc.code} — {doc.name}</option>
                ))}
              </select>
            </ErpFieldRow>
            <ErpFieldRow label="Concepto">
              <select value={concept} onChange={(e) => setConcept(Number(e.target.value))} className="erp-input w-full">
                {CONCEPTS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </ErpFieldRow>
            <ErpFieldRow label="Condición venta">
              <select value={paymentCondition} onChange={(e) => setPaymentCondition(e.target.value)} className="erp-input w-full">
                <option value="Contado">Contado</option>
                <option value="Cuenta Corriente">Cuenta Corriente</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
              </select>
            </ErpFieldRow>
            <ErpFieldRow label="Punto de venta">
              <input type="text" readOnly value={String(businessConfig?.defaultPOS || 1).padStart(4, '0')} className="erp-input w-24 bg-white/70" />
            </ErpFieldRow>
            <ErpFieldRow label="Fecha">
              <input type="date" value={new Date().toISOString().slice(0, 10)} readOnly className="erp-input w-36 bg-white/70" />
            </ErpFieldRow>
            <ErpFieldRow label="Vencimiento">
              <input type="date" value={paymentDueDate} onChange={(e) => setPaymentDueDate(e.target.value)} className="erp-input w-36" />
            </ErpFieldRow>
          </div>
          </>
        }
        observations={
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            className="erp-input w-full h-16 resize-none"
            placeholder="Notas del comprobante…"
          />
        }
        footerExtra={
          <div className="flex items-center gap-6 text-sm mr-4">
            <span>Subtotal: <strong>{formatCurrency(totals.subtotal)}</strong></span>
            <span>IVA: <strong>{formatCurrency(totals.tax)}</strong></span>
            <span className="text-base font-bold text-[#1e4d8c]">Total: {formatCurrency(totals.total)}</span>
          </div>
        }
      >
        {(selectedDocType as any)?.isRetention && (
          <div className="mb-2 flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-3 py-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Operación sujeta a retención (COD. {selectedDocType?.code})
          </div>
        )}
        {selectedDocType?.letter === 'A' && !customerDocument && (
          <div className="mb-2 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 text-xs">
            <AlertCircle className="w-4 h-4" />
            Las facturas tipo A requieren CUIT del cliente
          </div>
        )}

      {/* Comprobante Asociado — appears for NC/ND */}
      {isNCorND && (
        <div className="bg-white rounded-2xl shadow-sm border-2 border-purple-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-600" />
            Comprobante Asociado
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Seleccioná la factura original a la que se aplicará esta {isNC ? 'Nota de Crédito' : 'Nota de Débito'}. Se cargarán automáticamente todos los datos.
          </p>

          {linkedInvoiceId && refFactura ? (
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-purple-800">Factura {refFactura}</p>
                <p className="text-sm text-purple-600">{customerName} — ${availableFacturas.find(f => f.id === linkedInvoiceId)?.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || ''}</p>
              </div>
              <button
                onClick={() => {
                  setLinkedInvoiceId('');
                  setRefFactura('');
                  setShowFacturaSelector(true);
                }}
                className="px-3 py-1.5 text-sm bg-white text-purple-700 rounded-lg hover:bg-purple-100 border border-purple-300"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por número, cliente o CUIT..."
                    value={facturaSearch}
                    onChange={(e) => { setFacturaSearch(e.target.value); setShowFacturaSelector(true); }}
                    onFocus={() => setShowFacturaSelector(true)}
                    className="w-full pl-10 pr-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                {loadingFacturas && <Loader2 className="w-5 h-5 text-purple-500 animate-spin self-center" />}
              </div>

              {(showFacturaSelector || !linkedInvoiceId) && availableFacturas.length > 0 && (
                <div className="border border-slate-100/60 rounded-xl max-h-64 overflow-y-auto bg-white shadow-lg">
                  {availableFacturas
                    .filter(f => {
                      if (!facturaSearch) return true;
                      const q = facturaSearch.toLowerCase();
                      return (
                        f.invoiceNumber?.toLowerCase().includes(q) ||
                        f.customerName?.toLowerCase().includes(q) ||
                        f.customerDocument?.toLowerCase().includes(q)
                      );
                    })
                    .map((factura: any) => (
                      <button
                        key={factura.id}
                        onClick={() => selectLinkedFactura(factura)}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-slate-100 last:border-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono font-semibold text-slate-900">{factura.invoiceNumber}</span>
                            <span className="ml-2 text-sm text-slate-500">{factura.customerName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-900">
                              ${factura.total?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </span>
                            <div className="text-xs text-slate-400">
                              {new Date(factura.createdAt).toLocaleDateString('es-AR')}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  {availableFacturas.filter(f => {
                    if (!facturaSearch) return true;
                    const q = facturaSearch.toLowerCase();
                    return f.invoiceNumber?.toLowerCase().includes(q) || f.customerName?.toLowerCase().includes(q) || f.customerDocument?.toLowerCase().includes(q);
                  }).length === 0 && (
                    <p className="px-4 py-3 text-sm text-slate-500 text-center">No se encontraron facturas</p>
                  )}
                </div>
              )}

              {!loadingFacturas && availableFacturas.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No hay facturas disponibles para asociar. Primero emití una factura con CAE.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative mb-2">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre o agregar producto…"
          value={searchCustomer || searchProduct}
          onChange={(e) => {
            setSearchCustomer(e.target.value);
            setSearchProduct(e.target.value);
          }}
          className="erp-input w-full pl-8"
        />
        {(searchCustomer && filteredCustomers.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#9bb3cc] shadow-lg z-20 max-h-40 overflow-auto">
            {filteredCustomers.map((customer) => (
              <button key={customer.id} type="button" onClick={() => selectCustomer(customer)} className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#eef3f9] flex justify-between">
                <span>{customer.name}</span>
                <span className="text-slate-500">{customer.document}</span>
              </button>
            ))}
          </div>
        )}
        {(searchProduct && filteredProducts.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#9bb3cc] shadow-lg z-20 max-h-40 overflow-auto">
            {filteredProducts.map((product) => (
              <button key={product.id} type="button" onClick={() => addProductToItems(product)} className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#eef3f9] flex justify-between">
                <span>{product.name}</span>
                <span>{formatCurrency(product.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items grid */}
      <div className="overflow-x-auto border border-[#9bb3cc] bg-white">
        <table className="erp-grid-table min-w-[700px]">
          <thead>
            <tr>
              <th>Descripción / Valor</th>
              <th className="w-16 text-center">Cant.</th>
              <th className="w-24 text-right">P. Unit.</th>
              <th className="w-16 text-center">Dto.%</th>
              <th className="w-20 text-center">IVA</th>
              <th className="w-28 text-right">Monto</th>
              <th className="w-8"></th>
            </tr>
          </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descripción"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      className="text-center"
                      min="1"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      className="text-right"
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', Number(e.target.value))}
                      className="text-center"
                      min="0"
                      max="100"
                    />
                  </td>
                  <td>
                    <select
                      value={item.taxRate}
                      onChange={(e) => updateItem(index, 'taxRate', Number(e.target.value))}
                    >
                      <option value={0}>0%</option>
                      <option value={2.5}>2,5%</option>
                      <option value={5}>5%</option>
                      <option value={10.5}>10,5%</option>
                      <option value={21}>21%</option>
                      <option value={27}>27%</option>
                    </select>
                  </td>
                  <td className="text-right font-semibold px-2">
                    {formatCurrency(item.total)}
                  </td>
                  <td className="text-center">
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#1a3a5c]">
        <span>Items: {items.filter(i => i.description).length} · Fila: {items.length}</span>
        <button type="button" onClick={addItem} className="erp-btn-secondary flex items-center gap-1 text-xs py-1">
          <Plus className="w-3.5 h-3.5" /> Agregar línea
        </button>
      </div>
      </ErpDocumentShell>
    </>
  );
}

export default EmitirFacturaClient;
