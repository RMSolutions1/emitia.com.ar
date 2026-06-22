'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Package, Users, Download, Calendar, DollarSign, ShoppingCart, FileText, Percent, ArrowUpDown, BookOpen, ExternalLink } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  credit: 'Cta. Corriente',
  debit: 'Débito',
  mercadopago: 'MercadoPago',
};

interface SalesReport {
  summary: {
    totalRevenue: number;
    totalSales: number;
    averageTicket: number;
  };
  salesByDay: Array<{ date: string; total: number; count: number }>;
  salesByPayment: Array<{ method: string; total: number }>;
}

interface ProductReport {
  id: string;
  name: string;
  sku: string;
  category?: { name: string };
  totalSold: number;
  totalRevenue: number;
}

interface InventoryReport {
  summary: {
    totalProducts: number;
    lowStockCount: number;
    totalValue: number;
    totalRetailValue: number;
    potentialProfit: number;
  };
  lowStock: Array<{
    id: string;
    name: string;
    sku: string;
    stock: number;
    minStock: number;
  }>;
}

interface CustomerReport {
  id: string;
  name: string;
  email?: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase?: string;
}

interface IvaRow {
  id: string;
  fecha: string;
  tipo?: string;
  letra?: string;
  comprobante: string;
  puntoVenta?: number;
  cuit: string;
  cliente?: string;
  proveedor?: string;
  condicionIva?: string;
  netoGravado: number;
  exento?: number;
  noGravado?: number;
  iva21: number;
  iva105: number;
  iva27: number;
  otrosImpuestos: number;
  total: number;
  cae?: string;
}

interface IvaReport {
  rows: IvaRow[];
  totals: {
    netoGravado: number;
    iva21: number;
    iva105: number;
    iva27: number;
    exento?: number;
    otrosImpuestos: number;
    total: number;
  };
  count: number;
}

interface RentabilidadReport {
  summary: {
    totalRevenue: number;
    totalCost: number;
    grossProfit: number;
    grossMargin: number;
    totalSales: number;
  };
  products: Array<{
    name: string;
    sku: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    quantity: number;
  }>;
}

interface CashFlowReport {
  summary: {
    totalInflows: number;
    totalOutflows: number;
    netFlow: number;
    pendingReceivables: number;
  };
  flowByDay: Array<{ date: string; inflows: number; outflows: number; net: number; balance: number }>;
  byMethod: Array<{ method: string; total: number }>;
}

type ReportType = 'sales' | 'products' | 'inventory' | 'customers' | 'iva_ventas' | 'iva_compras' | 'rentabilidad' | 'cash_flow';

const fmt = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ReportesClient() {
  const { userRole } = useErpSession();
  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [productsData, setProductsData] = useState<ProductReport[]>([]);
  const [inventoryData, setInventoryData] = useState<InventoryReport | null>(null);
  const [customersData, setCustomersData] = useState<CustomerReport[]>([]);
  const [ivaVentasData, setIvaVentasData] = useState<IvaReport | null>(null);
  const [ivaComprasData, setIvaComprasData] = useState<IvaReport | null>(null);
  const [rentabilidadData, setRentabilidadData] = useState<RentabilidadReport | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const fetchReport = async (type: ReportType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type });
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      const res = await fetch(`/api/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        switch (type) {
          case 'sales': setSalesData(data); break;
          case 'products': setProductsData(data); break;
          case 'inventory': setInventoryData(data); break;
          case 'customers': setCustomersData(data); break;
          case 'iva_ventas': setIvaVentasData(data); break;
          case 'iva_compras': setIvaComprasData(data); break;
          case 'rentabilidad': setRentabilidadData(data); break;
          case 'cash_flow': setCashFlowData(data); break;
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDateFilter = () => {
    fetchReport(activeTab);
  };

  // ═══════ EXCEL EXPORT ═══════
  const exportToExcel = () => {
    let data: any[][] = [];
    let sheetName = 'Reporte';
    let filename = 'reporte';

    switch (activeTab) {
      case 'sales':
        if (!salesData) return;
        sheetName = 'Ventas';
        filename = 'reporte_ventas';
        data = [
          ['Fecha', 'Cant. Ventas', 'Total'],
          ...salesData.salesByDay.map(d => [d.date, d.count, d.total]),
          [],
          ['Resumen'],
          ['Ingresos Totales', salesData.summary.totalRevenue],
          ['Total Ventas', salesData.summary.totalSales],
          ['Ticket Promedio', salesData.summary.averageTicket],
        ];
        break;
      case 'products':
        sheetName = 'Productos';
        filename = 'reporte_productos';
        data = [
          ['Producto', 'SKU', 'Categoría', 'Vendidos', 'Ingresos'],
          ...productsData.map(p => [p.name, p.sku, p.category?.name || '', p.totalSold, p.totalRevenue]),
        ];
        break;
      case 'inventory':
        if (!inventoryData) return;
        sheetName = 'Inventario';
        filename = 'reporte_inventario';
        data = [
          ['Producto', 'SKU', 'Stock Actual', 'Stock Mínimo', 'Faltante'],
          ...inventoryData.lowStock.map(p => [p.name, p.sku, p.stock, p.minStock, p.minStock - p.stock]),
          [],
          ['Resumen'],
          ['Total Productos', inventoryData.summary.totalProducts],
          ['Stock Bajo', inventoryData.summary.lowStockCount],
          ['Valor Stock (Costo)', inventoryData.summary.totalValue],
          ['Valor Stock (Venta)', inventoryData.summary.totalRetailValue],
          ['Ganancia Potencial', inventoryData.summary.potentialProfit],
        ];
        break;
      case 'customers':
        sheetName = 'Clientes';
        filename = 'reporte_clientes';
        data = [
          ['Cliente', 'Email', 'Compras', 'Total Gastado', 'Última Compra'],
          ...customersData.map(c => [
            c.name, c.email || '', c.totalPurchases, c.totalSpent,
            c.lastPurchase ? new Date(c.lastPurchase).toLocaleDateString('es-AR') : ''
          ]),
        ];
        break;
      case 'iva_ventas':
        if (!ivaVentasData) return;
        sheetName = 'IVA Ventas';
        filename = 'libro_iva_ventas';
        data = [
          ['Fecha', 'Tipo', 'Letra', 'Comprobante', 'CUIT', 'Cliente', 'Neto Gravado', 'IVA 21%', 'IVA 10.5%', 'IVA 27%', 'Exento', 'Otros Imp.', 'Total', 'CAE'],
          ...ivaVentasData.rows.map(r => [
            new Date(r.fecha).toLocaleDateString('es-AR'),
            r.tipo === 'nota_credito' ? 'NC' : r.tipo === 'nota_debito' ? 'ND' : 'FC',
            r.letra, r.comprobante, r.cuit, r.cliente,
            r.netoGravado, r.iva21, r.iva105, r.iva27, r.exento || 0, r.otrosImpuestos, r.total, r.cae || ''
          ]),
          [],
          ['', '', '', '', '', 'TOTALES',
            ivaVentasData.totals.netoGravado, ivaVentasData.totals.iva21,
            ivaVentasData.totals.iva105, ivaVentasData.totals.iva27,
            ivaVentasData.totals.exento || 0, ivaVentasData.totals.otrosImpuestos, ivaVentasData.totals.total, ''],
        ];
        break;
      case 'iva_compras':
        if (!ivaComprasData) return;
        sheetName = 'IVA Compras';
        filename = 'libro_iva_compras';
        data = [
          ['Fecha', 'Comprobante', 'Proveedor', 'CUIT', 'Neto Gravado', 'IVA 21%', 'IVA 10.5%', 'IVA 27%', 'Otros Imp.', 'Total'],
          ...ivaComprasData.rows.map(r => [
            new Date(r.fecha).toLocaleDateString('es-AR'),
            r.comprobante, r.proveedor, r.cuit,
            r.netoGravado, r.iva21, r.iva105, r.iva27, r.otrosImpuestos, r.total
          ]),
          [],
          ['', '', '', 'TOTALES',
            ivaComprasData.totals.netoGravado, ivaComprasData.totals.iva21,
            ivaComprasData.totals.iva105, ivaComprasData.totals.iva27,
            ivaComprasData.totals.otrosImpuestos, ivaComprasData.totals.total],
        ];
        break;
      case 'cash_flow':
        if (!cashFlowData) return;
        sheetName = 'Flujo de Caja';
        filename = 'flujo_de_caja';
        data = [
          ['Fecha', 'Ingresos', 'Egresos', 'Neto', 'Saldo Acumulado'],
          ...cashFlowData.flowByDay.map(d => [d.date, d.inflows, d.outflows, d.net, d.balance]),
          [],
          ['Resumen'],
          ['Total Ingresos', cashFlowData.summary.totalInflows],
          ['Total Egresos', cashFlowData.summary.totalOutflows],
          ['Flujo Neto', cashFlowData.summary.netFlow],
          ['Pendiente de Cobro', cashFlowData.summary.pendingReceivables],
        ];
        break;
      case 'rentabilidad':
        if (!rentabilidadData) return;
        sheetName = 'Rentabilidad';
        filename = 'reporte_rentabilidad';
        data = [
          ['Producto', 'SKU', 'Cant. Vendida', 'Ingresos', 'Costo', 'Ganancia', 'Margen %'],
          ...rentabilidadData.products.map(p => [
            p.name, p.sku, p.quantity, p.revenue, p.cost, p.profit, `${p.margin.toFixed(1)}%`
          ]),
          [],
          ['Resumen General'],
          ['Ingresos Totales', '', '', rentabilidadData.summary.totalRevenue],
          ['Costos Totales', '', '', '', rentabilidadData.summary.totalCost],
          ['Ganancia Bruta', '', '', '', '', rentabilidadData.summary.grossProfit],
          ['Margen Bruto', '', '', '', '', '', `${rentabilidadData.summary.grossMargin.toFixed(1)}%`],
        ];
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    // Set column widths
    ws['!cols'] = data[0]?.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const dateStr = dateRange.start && dateRange.end
      ? `_${dateRange.start}_a_${dateRange.end}`
      : `_${new Date().toISOString().split('T')[0]}`;
    XLSX.writeFile(wb, `${filename}${dateStr}.xlsx`);
  };

  const tabs = [
    { id: 'sales' as ReportType, label: 'Ventas', icon: DollarSign },
    { id: 'products' as ReportType, label: 'Productos', icon: ShoppingCart },
    { id: 'inventory' as ReportType, label: 'Inventario', icon: Package },
    { id: 'customers' as ReportType, label: 'Clientes', icon: Users },
    { id: 'iva_ventas' as ReportType, label: 'IVA Ventas', icon: FileText },
    { id: 'iva_compras' as ReportType, label: 'IVA Compras', icon: FileText },
    { id: 'rentabilidad' as ReportType, label: 'Rentabilidad', icon: TrendingUp },
    { id: 'cash_flow' as ReportType, label: 'Flujo de Caja', icon: ArrowUpDown },
  ];

  const salesChartData = {
    labels: salesData?.salesByDay.map(d => d.date) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: salesData?.salesByDay.map(d => d.total) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  const paymentChartData = {
    labels: salesData?.salesByPayment.map(p => PAYMENT_LABELS[p.method] || p.method) || [],
    datasets: [
      {
        data: salesData?.salesByPayment.map(p => p.total) || [],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
      },
    ],
  };

  const showDateFilter = ['sales', 'iva_ventas', 'iva_compras', 'rentabilidad', 'cash_flow'].includes(activeTab);

  const cashFlowChartData = {
    labels: cashFlowData?.flowByDay.map(d => d.date) || [],
    datasets: [
      {
        label: 'Ingresos',
        data: cashFlowData?.flowByDay.map(d => d.inflows) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      },
      {
        label: 'Egresos',
        data: cashFlowData?.flowByDay.map(d => d.outflows) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
      },
    ],
  };

  const balanceChartData = {
    labels: cashFlowData?.flowByDay.map(d => d.date) || [],
    datasets: [
      {
        label: 'Saldo Acumulado',
        data: cashFlowData?.flowByDay.map(d => d.balance) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return (
    <ErpPageShell
      title="Reportes y Análisis"
      subtitle="Visualizá el rendimiento de tu negocio"
      module="REPORTES"
      userRole={userRole}
      statusText={loading ? 'Cargando' : 'Listo'}
      onRefresh={() => fetchReport(activeTab)}
      refreshing={loading}
      toolbar={[
        { label: 'Excel', icon: <Download className="w-4 h-4" />, onClick: exportToExcel },
      ]}
      header={
        <div className="erp-panel overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Date Filter */}
        {showDateFilter && (
          <div className="erp-panel p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-400" />
                <span className="text-sm text-slate-600">Filtrar por fecha:</span>
              </div>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <span className="text-slate-400">a</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <button
                onClick={handleApplyDateFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="space-y-4"><div className="skeleton-shimmer h-12 rounded-2xl" /><div className="skeleton-shimmer h-[400px] rounded-2xl" /></div>
          </div>
        ) : (
          <>
            {/* Sales Report */}
            {activeTab === 'sales' && salesData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <DollarSign className="text-green-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Ingresos Totales</p>
                        <p className="text-2xl font-bold">${fmt(salesData.summary.totalRevenue)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <ShoppingCart className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Total Ventas</p>
                        <p className="text-2xl font-bold">{salesData.summary.totalSales}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <TrendingUp className="text-purple-600" size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Ticket Promedio</p>
                        <p className="text-2xl font-bold">${fmt(salesData.summary.averageTicket)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold mb-4">Ventas por Día</h3>
                    <div className="h-72">
                      <Bar data={salesChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold mb-4">Por Método de Pago</h3>
                    <div className="h-72 flex items-center justify-center">
                      <Doughnut data={paymentChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Report */}
            {activeTab === 'products' && (
              <div className="erp-panel overflow-hidden">
                <div className="p-4 border-b"><h3 className="font-semibold">Productos Más Vendidos</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Categoría</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Vendidos</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ingresos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {productsData.map((product, index) => (
                        <tr key={product.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-slate-500">{product.sku}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">{product.category?.name || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">{product.totalSold}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">${fmt(product.totalRevenue || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {productsData.length === 0 && <div className="text-center py-12 text-slate-500">No hay datos de productos vendidos</div>}
                </div>
              </div>
            )}

            {/* Inventory Report */}
            {activeTab === 'inventory' && inventoryData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Total Productos</p>
                    <p className="text-2xl font-bold mt-1">{inventoryData.summary.totalProducts}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Stock Bajo</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">{inventoryData.summary.lowStockCount}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Valor Stock (Costo)</p>
                    <p className="text-2xl font-bold mt-1">${fmt(inventoryData.summary.totalValue)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Ganancia Potencial</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">${fmt(inventoryData.summary.potentialProfit)}</p>
                  </div>
                </div>
                {inventoryData.lowStock.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b bg-red-50"><h3 className="font-semibold text-red-800">Productos con Stock Bajo</h3></div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Producto</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Stock Actual</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Stock Mínimo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Faltante</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {inventoryData.lowStock.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-slate-500">{product.sku}</div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-1 rounded-full text-sm font-medium ${product.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{product.stock}</span>
                              </td>
                              <td className="px-4 py-3 text-center text-slate-600">{product.minStock}</td>
                              <td className="px-4 py-3 text-center font-medium text-red-600">{product.minStock - product.stock}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customers Report */}
            {activeTab === 'customers' && (
              <div className="erp-panel overflow-hidden">
                <div className="p-4 border-b"><h3 className="font-semibold">Mejores Clientes</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Compras</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Gastado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Última Compra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {customersData.map((customer, index) => (
                        <tr key={customer.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-slate-500">{customer.email || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">{customer.totalPurchases}</span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">${fmt(customer.totalSpent)}</td>
                          <td className="px-4 py-3 text-center text-sm text-slate-600">
                            {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString('es-AR') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {customersData.length === 0 && <div className="text-center py-12 text-slate-500">No hay datos de clientes</div>}
                </div>
              </div>
            )}

            {/* ═══════ IVA VENTAS ═══════ */}
            {activeTab === 'iva_ventas' && ivaVentasData && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <BookOpen className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Para presentación mensual AFIP (CITI / export oficial) usá el módulo dedicado.</span>
                  </div>
                  <Link
                    href="/libro-iva"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Abrir Libro IVA <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                {/* Totals Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Neto Gravado</p>
                    <p className="text-xl font-bold mt-1">${fmt(ivaVentasData.totals.netoGravado)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">IVA 21%</p>
                    <p className="text-xl font-bold mt-1 text-blue-600">${fmt(ivaVentasData.totals.iva21)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">IVA 10.5%</p>
                    <p className="text-xl font-bold mt-1 text-blue-500">${fmt(ivaVentasData.totals.iva105)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-xl font-bold mt-1 text-green-600">${fmt(ivaVentasData.totals.total)}</p>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-blue-50">
                    <h3 className="font-semibold text-blue-800">Libro IVA Ventas</h3>
                    <p className="text-sm text-blue-600">{ivaVentasData.count} comprobantes</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Comprobante</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">CUIT</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cliente</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Neto</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">IVA 21%</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ivaVentasData.rows.map((r) => (
                          <tr key={r.id} className={`hover:bg-slate-50 ${r.tipo === 'nota_credito' ? 'text-red-600' : ''}`}>
                            <td className="px-3 py-2">{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                r.tipo === 'nota_credito' ? 'bg-red-100 text-red-800' :
                                r.tipo === 'nota_debito' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {r.tipo === 'nota_credito' ? 'NC' : r.tipo === 'nota_debito' ? 'ND' : 'FC'} {r.letra}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs">{r.comprobante}</td>
                            <td className="px-3 py-2 font-mono text-xs">{r.cuit || '-'}</td>
                            <td className="px-3 py-2 truncate max-w-[150px]">{r.cliente}</td>
                            <td className="px-3 py-2 text-right">${fmt(r.netoGravado)}</td>
                            <td className="px-3 py-2 text-right">${fmt(r.iva21)}</td>
                            <td className="px-3 py-2 text-right font-medium">${fmt(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-semibold">
                        <tr>
                          <td colSpan={5} className="px-3 py-2 text-right">TOTALES</td>
                          <td className="px-3 py-2 text-right">${fmt(ivaVentasData.totals.netoGravado)}</td>
                          <td className="px-3 py-2 text-right">${fmt(ivaVentasData.totals.iva21)}</td>
                          <td className="px-3 py-2 text-right">${fmt(ivaVentasData.totals.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {ivaVentasData.rows.length === 0 && <div className="text-center py-12 text-slate-500">No hay comprobantes en el período seleccionado</div>}
                </div>
              </div>
            )}

            {/* ═══════ IVA COMPRAS ═══════ */}
            {activeTab === 'iva_compras' && ivaComprasData && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-violet-900">
                    <BookOpen className="w-5 h-5 text-violet-600 shrink-0" />
                    <span>Libro IVA Compras para AFIP: export CITI en el módulo Libro IVA.</span>
                  </div>
                  <Link href="/libro-iva" className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">
                    Abrir Libro IVA <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Neto Gravado</p>
                    <p className="text-xl font-bold mt-1">${fmt(ivaComprasData.totals.netoGravado)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">IVA 21%</p>
                    <p className="text-xl font-bold mt-1 text-blue-600">${fmt(ivaComprasData.totals.iva21)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">IVA 10.5%</p>
                    <p className="text-xl font-bold mt-1 text-blue-500">${fmt(ivaComprasData.totals.iva105)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-xl font-bold mt-1 text-green-600">${fmt(ivaComprasData.totals.total)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-orange-50">
                    <h3 className="font-semibold text-orange-800">Libro IVA Compras</h3>
                    <p className="text-sm text-orange-600">{ivaComprasData.count} comprobantes</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Comprobante</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Proveedor</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">CUIT</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Neto</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">IVA 21%</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ivaComprasData.rows.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2">{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                            <td className="px-3 py-2 font-mono text-xs">{r.comprobante}</td>
                            <td className="px-3 py-2 truncate max-w-[150px]">{r.proveedor}</td>
                            <td className="px-3 py-2 font-mono text-xs">{r.cuit || '-'}</td>
                            <td className="px-3 py-2 text-right">${fmt(r.netoGravado)}</td>
                            <td className="px-3 py-2 text-right">${fmt(r.iva21)}</td>
                            <td className="px-3 py-2 text-right font-medium">${fmt(r.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-semibold">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-right">TOTALES</td>
                          <td className="px-3 py-2 text-right">${fmt(ivaComprasData.totals.netoGravado)}</td>
                          <td className="px-3 py-2 text-right">${fmt(ivaComprasData.totals.iva21)}</td>
                          <td className="px-3 py-2 text-right">${fmt(ivaComprasData.totals.total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {ivaComprasData.rows.length === 0 && <div className="text-center py-12 text-slate-500">No hay compras registradas en el período</div>}
                </div>
              </div>
            )}

            {/* ═══════ RENTABILIDAD ═══════ */}
            {activeTab === 'rentabilidad' && rentabilidadData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Ingresos</p>
                    <p className="text-xl font-bold mt-1">${fmt(rentabilidadData.summary.totalRevenue)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Costos</p>
                    <p className="text-xl font-bold mt-1 text-red-600">${fmt(rentabilidadData.summary.totalCost)}</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Ganancia Bruta</p>
                    <p className={`text-xl font-bold mt-1 ${rentabilidadData.summary.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${fmt(rentabilidadData.summary.grossProfit)}
                    </p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <p className="text-sm text-slate-500">Margen Bruto</p>
                    <p className={`text-xl font-bold mt-1 ${rentabilidadData.summary.grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {rentabilidadData.summary.grossMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-green-50">
                    <h3 className="font-semibold text-green-800">Rentabilidad por Producto</h3>
                    <p className="text-sm text-green-600">{rentabilidadData.products.length} productos analizados</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Producto</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Vendidos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ingresos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Costos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ganancia</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Margen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rentabilidadData.products.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-slate-500">{p.sku}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">{p.quantity}</span>
                            </td>
                            <td className="px-4 py-3 text-right">${fmt(p.revenue)}</td>
                            <td className="px-4 py-3 text-right text-slate-600">${fmt(p.cost)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${fmt(p.profit)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                p.margin >= 30 ? 'bg-green-100 text-green-800' :
                                p.margin >= 15 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {p.margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rentabilidadData.products.length === 0 && <div className="text-center py-12 text-slate-500">No hay datos de ventas para calcular rentabilidad</div>}
                </div>
              </div>
            )}

            {/* ═══════ FLUJO DE CAJA ═══════ */}
            {activeTab === 'cash_flow' && cashFlowData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="text-green-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Ingresos</p>
                        <p className="text-xl font-bold text-green-600">${fmt(cashFlowData.summary.totalInflows)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <ArrowUpDown className="text-red-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Egresos</p>
                        <p className="text-xl font-bold text-red-600">${fmt(cashFlowData.summary.totalOutflows)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${cashFlowData.summary.netFlow >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                        <DollarSign className={cashFlowData.summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'} size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Flujo Neto</p>
                        <p className={`text-xl font-bold ${cashFlowData.summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          ${fmt(cashFlowData.summary.netFlow)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <FileText className="text-amber-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Por Cobrar</p>
                        <p className="text-xl font-bold text-amber-600">${fmt(cashFlowData.summary.pendingReceivables)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold mb-4">Ingresos vs Egresos</h3>
                    <div className="h-72">
                      <Bar data={cashFlowChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }} />
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <h3 className="font-semibold mb-4">Saldo Acumulado</h3>
                    <div className="h-72">
                      <Line data={balanceChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: false } } }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-slate-50">
                    <h3 className="font-semibold">Detalle por Día</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Ingresos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Egresos</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Neto</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Saldo Acum.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {cashFlowData.flowByDay.map((d, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                            <td className="px-4 py-3 text-right text-green-600 font-medium">{d.inflows > 0 ? `$${fmt(d.inflows)}` : '-'}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-medium">{d.outflows > 0 ? `$${fmt(d.outflows)}` : '-'}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${d.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${fmt(d.net)}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold ${d.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                              ${fmt(d.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {cashFlowData.flowByDay.length > 0 && (
                        <tfoot className="bg-slate-100 font-semibold">
                          <tr>
                            <td className="px-4 py-3 text-right">TOTALES</td>
                            <td className="px-4 py-3 text-right text-green-600">${fmt(cashFlowData.summary.totalInflows)}</td>
                            <td className="px-4 py-3 text-right text-red-600">${fmt(cashFlowData.summary.totalOutflows)}</td>
                            <td className={`px-4 py-3 text-right ${cashFlowData.summary.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${fmt(cashFlowData.summary.netFlow)}
                            </td>
                            <td className="px-4 py-3"></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                  {cashFlowData.flowByDay.length === 0 && <div className="text-center py-12 text-slate-500">No hay movimientos en el período seleccionado</div>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </ErpPageShell>
  );
}
