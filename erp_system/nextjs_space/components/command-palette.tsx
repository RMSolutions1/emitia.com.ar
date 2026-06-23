'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Search, LayoutDashboard, ShoppingCart, FileText, Package, Users,
  Building2, BarChart3, Settings, Receipt, Wallet, Truck, Landmark,
  FileCheck, RefreshCw, CreditCard, Shield, Plug, Printer, FileSpreadsheet,
  Tags, UserCheck, Sparkles, ArrowRight
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'page' | 'customer' | 'product' | 'invoice';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  badgeColor?: string;
}

const TYPE_ORDER = ['page', 'invoice', 'customer', 'product'];

const PAGES: SearchResult[] = [
  { id: 'dashboard', type: 'page', title: 'Dashboard', subtitle: 'Panel principal', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'pos', type: 'page', title: 'Punto de Venta', subtitle: 'Venta rápida', icon: ShoppingCart, href: '/pos' },
  { id: 'ventas', type: 'page', title: 'Historial de Ventas', subtitle: 'Todas las ventas', icon: FileText, href: '/ventas' },
  { id: 'presupuestos', type: 'page', title: 'Presupuestos', subtitle: 'Cotizaciones', icon: FileCheck, href: '/presupuestos' },
  { id: 'recibos', type: 'page', title: 'Recibos de cobranza', subtitle: 'Cobros internos', icon: Wallet, href: '/recibos' },
  { id: 'recurrentes', type: 'page', title: 'Facturación recurrente', subtitle: 'Comprobantes programados', icon: RefreshCw, href: '/facturacion/recurrentes' },
  { id: 'tickets-historial', type: 'page', title: 'Tickets (historial)', subtitle: 'Tickets no fiscales', icon: Printer, href: '/tickets' },
  { id: 'libro-iva', type: 'page', title: 'Libro IVA', subtitle: 'Presentación AFIP / CITI', icon: FileText, href: '/libro-iva' },
  { id: 'contador-ia', type: 'page', title: 'Contador IA', subtitle: 'Asistente contable', icon: Sparkles, href: '/contador-ia' },
  { id: 'plan-emitia', type: 'page', title: 'Plan EMITIA', subtitle: 'Suscripción SaaS', icon: CreditCard, href: '/configuracion/plan' },
  { id: 'emitir-comprobante', type: 'page', title: 'Emitir Comprobante', subtitle: 'Factura, presupuesto, remito', icon: FileSpreadsheet, href: '/facturacion/emitir' },
  { id: 'emitir-presupuesto', type: 'page', title: 'Emitir Presupuesto', subtitle: 'Cotización comercial', icon: FileCheck, href: '/facturacion/emitir?modo=presupuesto' },
  { id: 'emitir-remito', type: 'page', title: 'Emitir Remito', subtitle: 'Remito de entrega', icon: Truck, href: '/facturacion/emitir?modo=remito' },
  { id: 'pos-ticket', type: 'page', title: 'Punto de Venta (POS)', subtitle: 'Tickets y venta rápida', icon: ShoppingCart, href: '/pos' },
  { id: 'comprobantes', type: 'page', title: 'Comprobantes', subtitle: 'Facturas emitidas', icon: Receipt, href: '/facturas' },
  { id: 'inventario', type: 'page', title: 'Productos / Inventario', subtitle: 'Stock y precios', icon: Package, href: '/inventario' },
  { id: 'importar-ia', type: 'page', title: 'Importar con IA', subtitle: 'Carga masiva inteligente', icon: Sparkles, href: '/inventario/importar' },
  { id: 'clientes', type: 'page', title: 'Clientes', subtitle: 'Lista de clientes', icon: Users, href: '/clientes' },
  { id: 'cuentas-corrientes', type: 'page', title: 'Cuentas Corrientes', subtitle: 'Saldos de clientes', icon: Wallet, href: '/cuentas-corrientes' },
  { id: 'listas-precios', type: 'page', title: 'Listas de Precios', subtitle: 'Precios por lista', icon: Tags, href: '/listas-precios' },
  { id: 'proveedores', type: 'page', title: 'Proveedores', subtitle: 'Lista de proveedores', icon: Building2, href: '/proveedores' },
  { id: 'compras', type: 'page', title: 'Órdenes de Compra', subtitle: 'Compras a proveedores', icon: Truck, href: '/compras' },
  { id: 'tesoreria', type: 'page', title: 'Bancos y Cheques', subtitle: 'Tesorería', icon: Landmark, href: '/tesoreria' },
  { id: 'transacciones', type: 'page', title: 'Transacciones', subtitle: 'Pagos digitales', icon: CreditCard, href: '/transacciones' },
  { id: 'vendedores', type: 'page', title: 'Vendedores', subtitle: 'Comisiones', icon: UserCheck, href: '/vendedores' },
  { id: 'reportes', type: 'page', title: 'Reportes', subtitle: 'Análisis y gráficos', icon: BarChart3, href: '/reportes' },
  { id: 'config-empresa', type: 'page', title: 'Configuración', subtitle: 'Datos de empresa', icon: Settings, href: '/configuracion' },
  { id: 'config-afip', type: 'page', title: 'ARCA / AFIP', subtitle: 'Certificados y servicios', icon: Shield, href: '/configuracion/afip' },
  { id: 'config-integraciones', type: 'page', title: 'Integraciones', subtitle: 'APIs externas', icon: Plug, href: '/configuracion/integraciones' },
  { id: 'config-pv', type: 'page', title: 'Puntos de Venta', subtitle: 'Gestión de POS', icon: ShoppingCart, href: '/configuracion/puntos-venta' },
];

const TYPE_LABELS: Record<string, string> = {
  page: 'Páginas',
  customer: 'Clientes',
  product: 'Productos',
  invoice: 'Comprobantes',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  page: LayoutDashboard,
  customer: Users,
  product: Package,
  invoice: Receipt,
};

export function CommandPalette({ externalOpen, onClose }: { externalOpen?: boolean; onClose?: () => void } = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    if (!v && onClose) onClose();
  };
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout>();
  const { data: session } = useSession();
  const companyName = (session?.user as any)?.companyName || null;

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search logic
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const q = searchQuery.toLowerCase();
    
    // Search pages (instant)
    const pageResults = PAGES.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.subtitle?.toLowerCase().includes(q)
    ).slice(0, 5);

    setResults(pageResults);
    setSelectedIndex(0);

    // Search API data
    if (q.length >= 2) {
      setLoading(true);
      try {
        const [customersRes, productsRes, invoicesRes] = await Promise.all([
          fetch(`/api/customers?search=${encodeURIComponent(q)}`).catch(() => null),
          fetch(`/api/products?search=${encodeURIComponent(q)}`).catch(() => null),
          fetch(`/api/invoices?search=${encodeURIComponent(q)}`).catch(() => null),
        ]);

        const apiResults: SearchResult[] = [...pageResults];

        if (customersRes?.ok) {
          const customersData = await customersRes.json();
          const customers = (customersData.customers || customersData || []).slice(0, 5);
          customers.forEach((c: any) => {
            apiResults.push({
              id: `customer-${c.id}`,
              type: 'customer',
              title: c.name,
              subtitle: c.document ? `CUIT/DNI: ${c.document}` : c.email || 'Sin documento',
              icon: Users,
              href: '/clientes',
              badge: c.taxCondition === 'responsable_inscripto' ? 'R. Inscripto' :
                     c.taxCondition === 'monotributista' ? 'Monotrib.' : undefined,
              badgeColor: 'blue',
            });
          });
        }

        if (productsRes?.ok) {
          const productsData = await productsRes.json();
          const products = (Array.isArray(productsData) ? productsData : productsData.products || []).slice(0, 5);
          products.forEach((p: any) => {
            apiResults.push({
              id: `product-${p.id}`,
              type: 'product',
              title: p.name,
              subtitle: `${p.sku ? 'SKU: ' + p.sku + ' · ' : ''}Stock: ${p.stock ?? '—'} ${p.unit || ''}`,
              icon: Package,
              href: '/inventario',
              badge: p.stock <= 0 ? 'Sin stock' : p.stock <= (p.minStock || 5) ? 'Stock bajo' : undefined,
              badgeColor: p.stock <= 0 ? 'red' : 'amber',
            });
          });
        }

        if (invoicesRes?.ok) {
          const invoicesData = await invoicesRes.json();
          const invoices = (invoicesData.invoices || invoicesData || [])
            .filter((inv: any) => {
              const qs = q.toLowerCase();
              return (inv.invoiceNumber || '').toLowerCase().includes(qs) ||
                     (inv.customerName || '').toLowerCase().includes(qs) ||
                     (inv.customerDocument || '').includes(q);
            })
            .slice(0, 5);
          invoices.forEach((inv: any) => {
            const balance = inv.total - (inv.paidAmount || 0);
            apiResults.push({
              id: `invoice-${inv.id}`,
              type: 'invoice',
              title: `${inv.invoiceNumber} — ${inv.customerName}`,
              subtitle: `$${(inv.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}${balance > 0.01 ? ` · Saldo: $${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : ' · Pagado'}`,
              icon: Receipt,
              href: '/facturas',
              badge: inv.status === 'paid' ? 'Pagado' : inv.status === 'partial' ? 'Cta.Cte.' : inv.status === 'anulada' ? 'Anulada' : undefined,
              badgeColor: inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'red',
            });
          });
        }

        setResults(apiResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex]);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    const container = resultsRef.current;
    if (!container) return;
    const selected = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const navigate = (result: SearchResult) => {
    setOpen(false);
    router.push(result.href);
  };

  // Group results by type, ordered: pages → invoices → customers → products
  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const items = results.filter(r => r.type === type);
    if (items.length > 0) acc[type] = items;
    return acc;
  }, {} as Record<string, SearchResult[]>);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={() => setOpen(false)} 
      />

      {/* Modal */}
      <div className="fixed top-[12%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-auto px-4">
        <div className="bg-white shadow-2xl border border-[#9bb3cc] overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(26,58,92,0.25)' }}>
          {/* Header del panel de búsqueda — estilo ERP */}
          <div className="bg-[#1e4d8c] text-white px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Búsqueda Global</span>
            <span className="text-[10px] opacity-60">{companyName || 'ERP'}</span>
          </div>
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#b8c9dc] bg-[#f4f6fc]">
            <Search className="w-4 h-4 text-[#5c7291] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar clientes, facturas, productos, páginas…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm text-[#1a3a5c] placeholder-[#9baac8] outline-none bg-transparent font-medium"
              autoComplete="off"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-[#2563ad] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-[400px] overflow-y-auto">
            {!query.trim() && (
              <div className="p-4">
                <p className="text-[10px] font-bold uppercase text-[#5c7291] tracking-wider mb-2 px-1">Acceso rápido</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { icon: ShoppingCart, label: 'Punto de Venta', href: '/pos', color: 'text-green-700' },
                    { icon: FileSpreadsheet, label: 'Emitir Factura', href: '/facturacion/emitir', color: 'text-blue-700' },
                    { icon: Users, label: 'Clientes', href: '/clientes', color: 'text-indigo-700' },
                    { icon: Package, label: 'Inventario', href: '/inventario', color: 'text-amber-700' },
                    { icon: Receipt, label: 'Facturas', href: '/facturas', color: 'text-purple-700' },
                    { icon: Wallet, label: 'Cuentas Corrientes', href: '/cuentas-corrientes', color: 'text-rose-700' },
                    { icon: Truck, label: 'Proveedores', href: '/proveedores', color: 'text-teal-700' },
                    { icon: BarChart3, label: 'Reportes', href: '/reportes', color: 'text-slate-700' },
                  ].map(({ icon: Icon, label, href, color }) => (
                    <button
                      key={href}
                      onClick={() => { setOpen(false); router.push(href); }}
                      className="flex items-center gap-2 px-3 py-2 text-left text-xs text-[#1a3a5c] hover:bg-[#eef3f9] border border-[#dde3f4] bg-white transition-colors"
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#9baac8] text-center mt-3">
                  Escribí para buscar clientes, facturas, productos y más
                </p>
              </div>
            )}

            {query.trim() && results.length === 0 && !loading && (
              <div className="py-8 text-center">
                <Search className="w-8 h-8 text-[#b8c9dc] mx-auto mb-2" />
                <p className="text-sm text-[#5c7291]">Sin resultados para <strong>&ldquo;{query}&rdquo;</strong></p>
                <p className="text-xs text-[#9baac8] mt-1">Intentá con el número de factura, nombre del cliente o SKU del producto</p>
              </div>
            )}

            {Object.entries(grouped).map(([type, items]) => {
              const TypeIcon = TYPE_ICONS[type] || Search;
              return (
                <div key={type}>
                  <div className="px-4 py-1.5 bg-[#eef3f9] border-y border-[#dde3f4]">
                    <p className="text-[10px] font-bold text-[#5c7291] uppercase tracking-wider flex items-center gap-1.5">
                      <TypeIcon className="w-3 h-3" />
                      {TYPE_LABELS[type] || type}
                    </p>
                  </div>
                  {items.map((result) => {
                    const currentIndex = globalIndex++;
                    const Icon = result.icon;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <button
                        key={result.id}
                        data-index={currentIndex}
                        onClick={() => navigate(result)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors border-l-2 ${
                          isSelected
                            ? 'bg-[#2563ad] text-white border-[#1e4d8c]'
                            : 'hover:bg-[#f4f6fc] text-[#1a3a5c] border-transparent'
                        }`}
                      >
                        <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20' : 'bg-[#eef3f9] border border-[#dde3f4]'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#5c7291]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-[#1a3a5c]'}`}>
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className={`text-[10px] truncate ${isSelected ? 'text-white/75' : 'text-[#5c7291]'}`}>
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        {result.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 shrink-0 ${
                            isSelected ? 'bg-white/25 text-white' :
                            result.badgeColor === 'red' ? 'bg-red-100 text-red-700' :
                            result.badgeColor === 'amber' ? 'bg-amber-100 text-amber-700' :
                            result.badgeColor === 'green' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {result.badge}
                          </span>
                        )}
                        <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white/70' : 'text-[#b8c9dc]'}`} />
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-[#eef3f9] border-t border-[#b8c9dc] flex items-center justify-between">
            <p className="text-[10px] text-[#5c7291] font-medium">
              {companyName ? companyName : 'ERP'} · Búsqueda global
            </p>
            <div className="flex items-center gap-3 text-[10px] text-[#5c7291]">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0 bg-white border border-[#b8c9dc] text-[9px] font-mono">↑↓</kbd> navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0 bg-white border border-[#b8c9dc] text-[9px] font-mono">↵</kbd> abrir
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0 bg-white border border-[#b8c9dc] text-[9px] font-mono">ESC</kbd> cerrar
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
