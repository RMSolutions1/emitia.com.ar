'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Package, AlertTriangle,
  ShoppingCart, Clock,
  CreditCard, Wallet, ArrowUpRight,
  ArrowDownRight, Star, AlertCircle, CheckCircle2,
  Banknote, Smartphone, Building2, RefreshCw,
  ChevronRight, Activity, Target, UserPlus, CalendarDays,
  Receipt, PlusCircle, Users, Boxes, Zap, TrendingUp, FileText, BarChart3, Truck
} from 'lucide-react';
import { ErpPageShell, ErpKpiBox } from '@/components/erp/erp-page-shell';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';

interface DashboardData {
  userName: string;
  todayRevenue: number;
  todayCount: number;
  todayTrend: number;
  yesterdayRevenue: number;
  monthRevenue: number;
  monthCount: number;
  monthTrend: number;
  lastMonthRevenue: number;
  weekRevenue: number;
  weekTrend: number;
  avgTicketToday: number;
  avgTicketMonth: number;
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalSuppliers: number;
  pendingInvoicesCount: number;
  pendingInvoicesTotal: number;
  totalInvoicesMonth: number;
  totalReceivable: number;
  paymentBreakdown: Record<string, { total: number; count: number }>;
  chartData: Array<{ date: string; label: string; total: number; count: number }>;
  monthlyChartData: Array<{ date: string; label: string; total: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  recentSales: Array<{ id: string; saleNumber: string; total: number; paymentMethod: string; customerName: string; date: string }>;
  lowStockList: Array<{ name: string; sku: string; stock: number; minStock: number; price: number }>;
  topClients: Array<{ name: string; total: number; count: number }>;
  unpaidInvoicesList: Array<{ id: string; invoiceNumber: string; customerName: string; total: number; date: string }>;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  credit: 'Cta. Corriente',
  mercadopago: 'MercadoPago',
  debit: 'Débito',
};

const PAYMENT_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Building2,
  credit: Wallet,
  mercadopago: Smartphone,
  debit: CreditCard,
};

const PAYMENT_COLORS: Record<string, string> = {
  cash: '#22c55e',
  card: '#3b82f6',
  transfer: '#8b5cf6',
  credit: '#f59e0b',
  mercadopago: '#00b4e6',
  debit: '#6366f1',
};

const fmt = (val: number) => '$' + val.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays < 1) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays}d`;
  } catch {
    return dateStr;
  }
};

function TrendBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return <span className="text-xs text-slate-400">{label}</span>;
  const isUp = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
      isUp ? 'text-emerald-600' : 'text-red-500'
    }`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {isUp ? '+' : ''}{value}%
      <span className="font-normal text-slate-400 ml-0.5">{label}</span>
    </span>
  );
}

function getGreeting(): string {
  if (typeof window === 'undefined') return 'Hola';
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState<'week' | 'month'>('week');
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'ADMIN';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <ErpPageShell
        title="Panel de Control"
        subtitle="Cargando indicadores..."
        module="INICIO"
        statusText="Cargando"
        userRole={userRole}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="erp-kpi animate-pulse bg-[#eef3f9] h-24 border-[#b8c9dc]" />
          ))}
        </div>
      </ErpPageShell>
    );
  }

  if (!data) {
    return (
      <ErpPageShell
        title="Panel de Control"
        module="INICIO"
        statusText="Error"
        userRole={userRole}
        onRefresh={fetchData}
      >
        <div className="erp-panel p-8 text-center">
          <AlertCircle className="w-10 h-10 text-[#5c7291] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1a3a5c]">No se pudieron cargar los datos</p>
          <button type="button" onClick={fetchData} className="erp-btn-primary mt-4 inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      </ErpPageShell>
    );
  }

  const currentChartData = chartView === 'week' ? data.chartData : data.monthlyChartData;
  const paymentEntries = Object.entries(data.paymentBreakdown).sort((a, b) => b[1].total - a[1].total);
  const totalPayments = paymentEntries.reduce((s, [, v]) => s + v.total, 0);
  const alertCount = data.lowStockProducts + data.pendingInvoicesCount + (data.outOfStockProducts > 0 ? 1 : 0) + (data.unpaidInvoicesList?.length || 0);

  return (
    <ErpPageShell
      title="Panel de Control"
      subtitle={`${getGreeting()}, ${data.userName?.split(' ')[0] || 'Usuario'}`}
      module="INICIO"
      statusText={alertCount > 0 ? `${alertCount} alerta(s) pendiente(s)` : 'Sistema operativo'}
      userRole={userRole}
      onRefresh={fetchData}
      refreshing={loading}
    >
    <div className="space-y-2">

      {/* ══ Accesos Rápidos ══ */}
      <div className="erp-panel">
        <div className="erp-panel-header flex items-center gap-2">
          <Zap className="w-3 h-3" /> Accesos Rápidos
        </div>
        <div className="flex flex-wrap gap-2 p-2">
          {[
            { label: 'Punto de Venta', icon: ShoppingCart, href: '/pos', color: 'bg-[#1e7c1e] text-white' },
            { label: 'Nueva Factura', icon: Receipt, href: '/facturacion/emitir', color: 'bg-[#2563ad] text-white' },
            { label: 'Nuevo Cliente', icon: Users, href: '/clientes', color: 'bg-[#5c4da0] text-white' },
            { label: 'Nuevo Producto', icon: Boxes, href: '/inventario', color: 'bg-[#7c4a1e] text-white' },
            { label: 'Cuentas Corrientes', icon: Wallet, href: '/cuentas-corrientes', color: 'bg-[#1e5c7c] text-white' },
            { label: 'Ver Proveedores', icon: Building2, href: '/proveedores', color: 'bg-[#4a5a8c] text-white' },
          ].map(({ label, icon: Icon, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-0 ${color} hover:opacity-90 transition-opacity`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ Alertas de stock bajo ══ */}
      {(data.lowStockProducts > 0 || data.outOfStockProducts > 0) && (
        <div className="erp-panel">
          <div className="erp-panel-header flex items-center gap-2 bg-amber-700 text-white">
            <AlertTriangle className="w-3 h-3" />
            Alertas de Stock — {data.lowStockProducts + data.outOfStockProducts} artículo(s) requieren atención
          </div>
          <div className="overflow-x-auto">
            <table className="erp-grid-table">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th className="w-24">Cód. / SKU</th>
                  <th className="w-16 text-center">Stock Actual</th>
                  <th className="w-16 text-center">Stock Mín.</th>
                  <th className="w-20 text-right">Precio</th>
                  <th className="w-16 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockList?.slice(0, 8).map((item, i) => (
                  <tr key={i} className="cursor-pointer" onClick={() => router.push('/inventario')}>
                    <td><span className="cell-text font-semibold">{item.name}</span></td>
                    <td><span className="cell-text font-mono text-[10px]">{item.sku}</span></td>
                    <td className="text-center">
                      <span className={`font-bold text-[11px] ${item.stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>{item.stock}</span>
                    </td>
                    <td className="text-center text-[11px] text-[#5c7291]">{item.minStock}</td>
                    <td className="text-right pr-2 font-mono text-[11px]">${item.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                    <td className="text-center">
                      <span className={`text-[10px] font-bold px-1 ${item.stock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.stock <= 0 ? 'SIN STOCK' : 'BAJO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.lowStockList?.length > 8 && (
            <div className="erp-grid-footer">
              Mostrando 8 de {data.lowStockList.length} artículos con stock bajo — <button className="underline" onClick={() => router.push('/inventario')}>Ver todos</button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <ErpKpiBox
          label="Ventas de Hoy"
          value={fmt(data.todayRevenue)}
          accent="primary"
          icon={<ShoppingCart className="w-full h-full" />}
          color="#2563ad"
          hint={
            <div className="text-[11px] text-blue-100 flex justify-between">
              <span>{data.todayCount} venta{data.todayCount !== 1 ? 's' : ''}</span>
              <TrendBadge value={data.todayTrend} label="vs ayer" />
            </div>
          }
        />
        <ErpKpiBox
          label="Ventas del Mes"
          value={fmt(data.monthRevenue)}
          icon={<TrendingUp className="w-full h-full" />}
          color="#16a34a"
          hint={
            <div className="flex items-center justify-between gap-2">
              <TrendBadge value={data.monthTrend} label="vs mes ant." />
              <span className="text-[10px] text-[#5c7291]">{data.monthCount} ventas</span>
            </div>
          }
          onClick={() => router.push('/ventas')}
        />
        <ErpKpiBox
          label="Facturas del Mes"
          value={data.totalInvoicesMonth}
          icon={<FileText className="w-full h-full" />}
          color="#7c3aed"
          hint={<span className="text-[10px] text-[#5c7291]">Ticket prom: {fmt(data.avgTicketMonth)}</span>}
          onClick={() => router.push('/facturas')}
        />
        <ErpKpiBox
          label="Por Cobrar"
          value={fmt(data.totalReceivable)}
          icon={<Wallet className="w-full h-full" />}
          color="#d97706"
          accent={data.totalReceivable > 0 ? 'warning' : 'default'}
          hint={<span className="text-[10px] text-[#5c7291]">Cuentas corrientes</span>}
          onClick={() => router.push('/cuentas-corrientes')}
        />
        <ErpKpiBox
          label="Clientes"
          value={data.totalCustomers}
          icon={<Users className="w-full h-full" />}
          color="#0891b2"
          hint={data.newCustomersThisMonth > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
              <UserPlus className="w-3 h-3" /> +{data.newCustomersThisMonth} este mes
            </span>
          ) : (
            <span className="text-[10px] text-[#5c7291]">Sin nuevos este mes</span>
          )}
          onClick={() => router.push('/clientes')}
        />
        <ErpKpiBox
          label="Productos"
          value={data.totalProducts}
          icon={<Package className="w-full h-full" />}
          color="#059669"
          hint={data.lowStockProducts > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
              <AlertTriangle className="w-3 h-3" /> {data.lowStockProducts} stock bajo
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
              <CheckCircle2 className="w-3 h-3" /> Stock OK
            </span>
          )}
          onClick={() => router.push('/inventario')}
        />
        <ErpKpiBox
          label="Pendientes ARCA"
          value={data.pendingInvoicesCount}
          icon={<BarChart3 className="w-full h-full" />}
          color="#dc2626"
          accent={data.pendingInvoicesCount > 0 ? 'warning' : 'default'}
          hint={<span className="text-[10px] text-[#5c7291]">Sin CAE o rechazadas</span>}
        />
        <ErpKpiBox
          label="Proveedores"
          value={data.totalSuppliers}
          icon={<Truck className="w-full h-full" />}
          color="#64748b"
          hint={<span className="text-[10px] text-[#5c7291]">Base de compras</span>}
          onClick={() => router.push('/proveedores')}
        />
      </div>

      {/* ==================== CHART + PAYMENTS ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="lg:col-span-2 dash-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="dash-card-title">
              <Activity className="w-4 h-4 text-blue-500" />
              Evolución de Ventas
            </h3>
            <div className="flex bg-slate-100/80 rounded-lg p-0.5 border border-slate-200/40">
              <button onClick={() => setChartView('week')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  chartView === 'week' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>7 días</button>
              <button onClick={() => setChartView('month')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  chartView === 'month' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>30 días</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={currentChartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', fontSize: 12, padding: '10px 14px' }}
                formatter={(value: number) => [fmt(value), 'Total']}
                labelFormatter={(l) => `${l}`}
              />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5}
                fill="url(#salesGradient)" dot={{ fill: '#3b82f6', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-3 border-t border-slate-100/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {chartView === 'week' ? 'Últimos 7 días' : 'Últimos 30 días'}: <span className="font-bold text-slate-700">{fmt(chartView === 'week' ? data.weekRevenue : data.monthRevenue)}</span>
            </span>
            {chartView === 'week' && <TrendBadge value={data.weekTrend} label="vs semana ant." />}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="dash-card">
          <h3 className="dash-card-title mb-5">
            <CreditCard className="w-4 h-4 text-violet-500" />
            Medios de Pago <span className="text-xs font-normal text-slate-400">del mes</span>
          </h3>
          {paymentEntries.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Sin ventas este mes</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paymentEntries.map(([method, val]) => {
                const pct = totalPayments > 0 ? Math.round((val.total / totalPayments) * 100) : 0;
                const Icon = PAYMENT_ICONS[method] || CreditCard;
                const color = PAYMENT_COLORS[method] || '#6b7280';
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '12' }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{PAYMENT_LABELS[method] || method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-800">{fmt(val.total)}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100/80 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 mt-3 border-t border-slate-100/60 flex justify-between">
                <span className="text-xs text-slate-400 font-medium">Total del mes</span>
                <span className="text-sm font-bold text-slate-800">{fmt(totalPayments)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== TOP PRODUCTOS + VENTAS RECIENTES ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Productos */}
        <div className="dash-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="dash-card-title">
              <Target className="w-4 h-4 text-amber-500" />
              Top Productos del Mes
            </h3>
            <button onClick={() => router.push('/inventario')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-semibold transition-colors">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {data.topProducts.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Sin ventas este mes</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.topProducts.map((p, i) => {
                const maxRevenue = data.topProducts[0]?.revenue || 1;
                const pct = Math.round((p.revenue / maxRevenue) * 100);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-slate-100 text-slate-600' :
                      'bg-orange-50 text-orange-500'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                      <div className="mt-1.5 w-full bg-slate-100/80 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800">{fmt(p.revenue)}</p>
                      <p className="text-[10px] text-slate-400">{p.quantity} uds.</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ventas recientes */}
        <div className="dash-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="dash-card-title">
              <Clock className="w-4 h-4 text-blue-500" />
              Últimas Ventas
            </h3>
            <button onClick={() => router.push('/ventas')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-semibold transition-colors">
              Ver todas <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {data.recentSales.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Sin ventas recientes</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1 sidebar-scroll">
              {data.recentSales.map((sale) => {
                const Icon = PAYMENT_ICONS[sale.paymentMethod] || CreditCard;
                return (
                  <div key={sale.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50/80 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center group-hover:shadow-sm transition-shadow">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{sale.customerName}</p>
                      <p className="text-[11px] text-slate-400">
                        #{sale.saleNumber} · {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod} · {fmtDate(sale.date)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 whitespace-nowrap">{fmt(sale.total)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ==================== TOP CLIENTES ==================== */}
      {data.topClients && data.topClients.length > 0 && (
        <div className="dash-card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="dash-card-title">
              <Star className="w-4 h-4 text-violet-500" />
              Top Clientes del Mes
            </h3>
            <button onClick={() => router.push('/clientes')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-semibold transition-colors">
              Ver todos <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.topClients.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100/60">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                  i === 0 ? 'bg-violet-100 text-violet-700' :
                  i === 1 ? 'bg-slate-100 text-slate-600' :
                  'bg-indigo-50 text-indigo-500'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                  <p className="text-[11px] text-slate-400">{c.count} fact. · {fmt(c.total)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== ALERTAS ==================== */}
      {data.unpaidInvoicesList && data.unpaidInvoicesList.length > 0 && (
        <div className="dash-card !border-amber-100/80">
          <h3 className="dash-card-title mb-4">
            <CalendarDays className="w-4 h-4 text-amber-500" />
            Facturas Pendientes de Cobro
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full ml-2">{data.unpaidInvoicesList.length}</span>
          </h3>
          <div className="space-y-2">
            {data.unpaidInvoicesList.map((inv) => {
              const daysOld = Math.ceil((Date.now() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-slate-500 truncate">{inv.customerName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-800">{fmt(inv.total)}</p>
                    <p className={`text-[10px] font-bold ${
                      daysOld > 30 ? 'text-red-600' : daysOld > 15 ? 'text-amber-600' : 'text-slate-500'
                    }`}>Hace {daysOld}d</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== STOCK BAJO ==================== */}
      {data.lowStockList.length > 0 && (
        <div className="dash-card !border-amber-100/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="dash-card-title">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alertas de Stock
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full ml-2">{data.lowStockList.length}</span>
            </h3>
            <button onClick={() => router.push('/inventario')}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-semibold transition-colors">
              Gestionar stock <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {data.lowStockList.map((p, i) => (
              <div key={i} className={`rounded-xl border p-3.5 ${
                p.stock === 0 ? 'bg-red-50/50 border-red-200/50' : 'bg-amber-50/50 border-amber-200/50'
              }`}>
                <p className="text-sm font-medium text-slate-800 truncate" title={p.name}>{p.name}</p>
                {p.sku && <p className="text-[10px] text-slate-400 mt-0.5">SKU: {p.sku}</p>}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-1">
                    <span className={`text-lg font-bold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{p.stock}</span>
                    <span className="text-xs text-slate-400">/ {p.minStock}</span>
                  </div>
                  {p.stock === 0 ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-lg">SIN STOCK</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-lg">BAJO</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </ErpPageShell>
  );
}
