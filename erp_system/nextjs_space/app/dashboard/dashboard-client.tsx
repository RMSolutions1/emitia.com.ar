'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  DollarSign, Package, Users, AlertTriangle, FileText,
  TrendingUp, ShoppingCart, Plus, ArrowRight, Clock,
  CreditCard, Truck, BarChart3, Receipt, CalendarDays,
  PackageOpen, UserPlus, Sparkles, Wallet, ArrowUpRight,
  ArrowDownRight, Zap, Star, AlertCircle, CheckCircle2,
  Banknote, Smartphone, Building2, RefreshCw, Printer,
  FileSpreadsheet, ChevronRight, Activity, Target, Eye
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import { SetupChecklist } from '@/components/setup-checklist';
import { ErpPageShell, ErpPanel } from '@/components/erp/erp-page-shell';

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
  caeAlerts: Array<{ id: string; invoiceNumber: string; customerName: string; total: number; caeExpiration: string }>;
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
  const [currentDate, setCurrentDate] = useState('');
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'ADMIN';

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
    setCurrentDate(new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
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
  const alertCount = data.lowStockProducts + data.pendingInvoicesCount + (data.outOfStockProducts > 0 ? 1 : 0) + (data.caeAlerts?.length || 0) + (data.unpaidInvoicesList?.length || 0);

  return (
    <ErpPageShell
      title="Panel de Control"
      subtitle={`${getGreeting()}, ${data.userName?.split(' ')[0] || 'Usuario'} · ${currentDate}`}
      module="INICIO"
      statusText={alertCount > 0 ? `${alertCount} alerta(s) pendiente(s)` : 'Sistema operativo'}
      userRole={userRole}
      onRefresh={fetchData}
      refreshing={loading}
      toolbar={[
        { label: 'POS', icon: <ShoppingCart className="w-4 h-4" />, onClick: () => router.push('/pos') },
        { label: 'Facturar', icon: <Receipt className="w-4 h-4" />, onClick: () => router.push('/facturacion/emitir') },
        { label: 'Ticket', icon: <Printer className="w-4 h-4" />, onClick: () => router.push('/facturacion/ticket') },
        { label: 'Remito', icon: <Truck className="w-4 h-4" />, onClick: () => router.push('/facturacion/remito') },
        { label: 'Clientes', icon: <Users className="w-4 h-4" />, onClick: () => router.push('/clientes') },
        { label: 'Stock', icon: <Package className="w-4 h-4" />, onClick: () => router.push('/inventario') },
      ]}
    >
    <div className="space-y-2">
      <SetupChecklist />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="erp-kpi erp-kpi-primary">
          <p className="erp-kpi-label">Ventas de Hoy</p>
          <p className="erp-kpi-value text-2xl">{fmt(data.todayRevenue)}</p>
          <div className="mt-1 text-[11px] text-blue-100 flex justify-between">
            <span>{data.todayCount} venta{data.todayCount !== 1 ? 's' : ''}</span>
            <TrendBadge value={data.todayTrend} label="vs ayer" />
          </div>
        </div>
        <div className="dash-kpi-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="dash-kpi-label">Ventas del Mes</p>
              <p className="dash-kpi-value">{fmt(data.monthRevenue)}</p>
              <div className="mt-2"><TrendBadge value={data.monthTrend} label="vs mes ant." /></div>
            </div>
            <div className="dash-kpi-icon bg-gradient-to-br from-emerald-50 to-teal-50">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100/60 flex justify-between text-xs text-slate-400">
            <span>{data.monthCount} ventas</span>
            <span>Ticket prom: {fmt(data.avgTicketMonth)}</span>
          </div>
        </div>

        {/* Clientes */}
        <div className="dash-kpi-card cursor-pointer" onClick={() => router.push('/clientes')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="dash-kpi-label">Clientes</p>
              <p className="dash-kpi-value">{data.totalCustomers}</p>
              <div className="mt-2">
                {data.newCustomersThisMonth > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                    <UserPlus className="w-3 h-3" /> +{data.newCustomersThisMonth} este mes
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Sin nuevos este mes</span>
                )}
              </div>
            </div>
            <div className="dash-kpi-icon bg-gradient-to-br from-violet-50 to-purple-50">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>

        {/* Inventario */}
        <div className="dash-kpi-card cursor-pointer" onClick={() => router.push('/inventario')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="dash-kpi-label">Productos</p>
              <p className="dash-kpi-value">{data.totalProducts}</p>
              <div className="mt-2">
                {data.lowStockProducts > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                    <AlertTriangle className="w-3 h-3" /> {data.lowStockProducts} stock bajo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Stock OK
                  </span>
                )}
              </div>
            </div>
            <div className="dash-kpi-icon bg-gradient-to-br from-orange-50 to-amber-50">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== QUICK ACTIONS ==================== */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Nueva Venta', icon: ShoppingCart, href: '/pos', gradient: 'from-emerald-500 to-emerald-600' },
          { label: 'Facturar', icon: Receipt, href: '/facturacion/emitir', gradient: 'from-blue-500 to-blue-600' },
          { label: 'Ticket', icon: Printer, href: '/facturacion/ticket', gradient: 'from-sky-500 to-sky-600' },
          { label: 'Remito', icon: Truck, href: '/facturacion/remito', gradient: 'from-teal-500 to-teal-600' },
          { label: 'Importar IA', icon: Sparkles, href: '/inventario/importar', gradient: 'from-purple-500 to-purple-600' },
          { label: 'Presupuesto', icon: FileSpreadsheet, href: '/presupuestos', gradient: 'from-indigo-500 to-indigo-600' },
        ].map((a, i) => (
          <button key={a.label} onClick={() => router.push(a.href)}
            className={`dash-quick-action bg-gradient-to-br ${a.gradient} animate-fade-in-up stagger-${i + 1}`}>
            <a.icon className="w-5 h-5" />
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* ==================== SECONDARY METRICS ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="dash-metric-card">
          <div className="dash-metric-icon-sm bg-gradient-to-br from-sky-50 to-blue-50">
            <Receipt className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Facturas del Mes</p>
            <p className="text-lg font-bold text-slate-800">{data.totalInvoicesMonth}</p>
          </div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-icon-sm bg-gradient-to-br from-indigo-50 to-violet-50">
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Por Cobrar</p>
            <p className="text-lg font-bold text-slate-800">{fmt(data.totalReceivable)}</p>
          </div>
        </div>
        <div className="dash-metric-card">
          <div className={`dash-metric-icon-sm ${data.pendingInvoicesCount > 0 ? 'bg-gradient-to-br from-red-50 to-rose-50' : 'bg-gradient-to-br from-emerald-50 to-green-50'}`}>
            <FileText className={`w-4 h-4 ${data.pendingInvoicesCount > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Pendientes ARCA</p>
            <p className={`text-lg font-bold ${data.pendingInvoicesCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{data.pendingInvoicesCount}</p>
          </div>
        </div>
        <div className="dash-metric-card">
          <div className="dash-metric-icon-sm bg-gradient-to-br from-teal-50 to-cyan-50">
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Proveedores</p>
            <p className="text-lg font-bold text-slate-800">{data.totalSuppliers}</p>
          </div>
        </div>
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
      {((data.caeAlerts && data.caeAlerts.length > 0) || (data.unpaidInvoicesList && data.unpaidInvoicesList.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {data.caeAlerts && data.caeAlerts.length > 0 && (
            <div className="dash-card !border-red-100/80">
              <h3 className="dash-card-title mb-4">
                <AlertCircle className="w-4 h-4 text-red-500" />
                CAE por Vencer
                <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full ml-2">{data.caeAlerts.length}</span>
              </h3>
              <div className="space-y-2">
                {data.caeAlerts.map((alert) => {
                  const expDate = new Date(alert.caeExpiration);
                  const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={alert.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{alert.invoiceNumber}</p>
                        <p className="text-[11px] text-slate-500 truncate">{alert.customerName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-slate-800">{fmt(alert.total)}</p>
                        <p className={`text-[10px] font-bold ${daysLeft <= 2 ? 'text-red-600' : 'text-amber-600'}`}>Vence en {daysLeft}d</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
