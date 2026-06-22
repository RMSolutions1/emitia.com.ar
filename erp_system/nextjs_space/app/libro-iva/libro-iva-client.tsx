'use client';

import { useState, useEffect } from 'react';
import { Download, Calendar, ChevronLeft, ChevronRight, FileText, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CONDICION_IVA_SHORT: Record<string, string> = {
  'responsable_inscripto': 'RI',
  'monotributista': 'M',
  'monotributo': 'M',
  'consumidor_final': 'CF',
  'exento': 'EX',
};

const CONDICION_IVA_LABEL: Record<string, string> = {
  'responsable_inscripto': 'Resp. Inscripto',
  'monotributista': 'Monotributista',
  'monotributo': 'Monotributista',
  'consumidor_final': 'Consumidor Final',
  'exento': 'Exento',
};

const DOC_TYPE_NAME: Record<string, string> = {
  '001': 'Fact. A', '002': 'ND A', '003': 'NC A',
  '006': 'Fact. B', '007': 'ND B', '008': 'NC B',
  '011': 'Fact. C', '012': 'ND C', '013': 'NC C',
  '051': 'Fact. A (Ret)', '052': 'ND A (Ret)', '053': 'NC A (Ret)',
  '019': 'Fact. E', '020': 'ND E', '021': 'NC E',
};

// AFIP doc type codes for CITI
const AFIP_DOC_TIPO: Record<string, string> = {
  'DNI': '96', 'CUIT': '80', 'CUIL': '86', 'CDI': '87', 'CI': '89', 'LE': '90', 'LC': '91', 'SIN_IDENTIFICAR': '99',
};

interface LibroRow {
  fecha: string;
  tipo?: string;
  letra?: string;
  puntoVenta?: number;
  numero: string;
  sequenceNumber?: number;
  documentoReceptor?: string;
  nombreReceptor?: string;
  condicionIva?: string;
  netoGravado: number;
  iva21?: number;
  iva105?: number;
  iva27?: number;
  ivaRate?: number;
  iva: number;
  exento?: number;
  noGravado?: number;
  otrosTributos?: number;
  total: number;
  cae?: string;
  proveedor?: string;
  cuitProveedor?: string;
  status?: string;
}

interface LibroData {
  rows: LibroRow[];
  totals: {
    netoGravado: number;
    iva21: number;
    iva105: number;
    iva27: number;
    exento: number;
    noGravado: number;
    otrosTributos: number;
    total: number;
    iva?: number;
  };
  count: number;
}

export function LibroIVAClient() {
  const { userRole } = useErpSession();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [type, setType] = useState<'ventas' | 'compras'>('ventas');
  const [data, setData] = useState<LibroData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/libro-iva?month=${month}&year=${year}&type=${type}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        toast.error('Error al cargar libro IVA');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [month, year, type]);

  const formatCurrency = (n: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(n);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // ═══════ CSV Export ═══════
  const exportCSV = () => {
    if (!data || data.rows.length === 0) { toast.error('No hay datos para exportar'); return; }
    let csvRows: string[] = [];
    if (type === 'ventas') {
      csvRows.push('Fecha;Tipo;Número;CUIT/DNI;Razón Social;Cond. IVA;Neto Gravado;IVA 21%;IVA 10.5%;IVA 27%;Exento;Otros Trib.;Total;CAE');
      data.rows.forEach(r => {
        csvRows.push([
          formatDate(r.fecha), DOC_TYPE_NAME[r.tipo || ''] || r.tipo || '', r.numero,
          r.documentoReceptor || '', `"${r.nombreReceptor || ''}"`, CONDICION_IVA_SHORT[r.condicionIva || ''] || r.condicionIva || '',
          r.netoGravado.toFixed(2), (r.iva21 || 0).toFixed(2), (r.iva105 || 0).toFixed(2), (r.iva27 || 0).toFixed(2),
          (r.exento || 0).toFixed(2), (r.otrosTributos || 0).toFixed(2),
          r.total.toFixed(2), r.cae || '',
        ].join(';'));
      });
    } else {
      csvRows.push('Fecha;Proveedor;CUIT;Número;Neto Gravado;IVA;Total');
      data.rows.forEach(r => {
        csvRows.push([
          formatDate(r.fecha), `"${r.proveedor || ''}"`, r.cuitProveedor || '', r.numero,
          r.netoGravado.toFixed(2), r.iva.toFixed(2), r.total.toFixed(2),
        ].join(';'));
      });
    }
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `libro_iva_${type}_${year}_${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  };

  // ═══════ CITI AFIP Export ═══════
  const pad = (val: string | number, len: number, char = '0') => String(val).padStart(len, char);
  const padRight = (val: string, len: number) => val.substring(0, len).padEnd(len, ' ');
  const formatAmount13 = (amount: number) => {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    const parts = abs.toFixed(2).split('.');
    return sign + pad(parts[0], 11) + parts[1];
  };
  const formatAmount15 = (amount: number) => {
    const abs = Math.abs(amount);
    const parts = abs.toFixed(2).split('.');
    return pad(parts[0], 13) + parts[1];
  };

  const exportCITI = () => {
    if (!data || data.rows.length === 0) { toast.error('No hay datos para exportar CITI'); return; }

    // Generate CITI Comprobantes file
    const lines: string[] = [];
    const alicuotaLines: string[] = [];

    data.rows.forEach(row => {
      const fecha = new Date(row.fecha);
      const fechaStr = `${fecha.getFullYear()}${pad(fecha.getMonth() + 1, 2)}${pad(fecha.getDate(), 2)}`;
      const tipoComprobante = pad(parseInt(row.tipo || '6'), 3);
      const puntoVenta = pad(row.puntoVenta || 1, 5);
      const numDesde = pad(row.sequenceNumber || 0, 20);
      const numHasta = numDesde;

      // Determine doc type
      const doc = (row.documentoReceptor || '').replace(/[-\s]/g, '');
      let tipoDocCod = '99'; // SIN_IDENTIFICAR
      if (doc.length === 11) tipoDocCod = '80'; // CUIT
      else if (doc.length >= 7 && doc.length <= 8) tipoDocCod = '96'; // DNI
      const numDoc = pad(doc || '0', 20);
      const nombre = padRight(row.nombreReceptor || 'Consumidor Final', 30);

      const importeTotal = formatAmount15(row.total);
      const importeNoGravado = formatAmount15(row.noGravado || 0);
      const operExentas = formatAmount15(row.exento || 0);
      // Percepciones/pagos a cuenta de impuestos nacionales
      const percImpNac = formatAmount15(0);
      const percIIBB = formatAmount15(0);
      const percMunicipales = formatAmount15(0);
      const impInternas = formatAmount15(0);
      const moneda = 'PES';
      const tipoCambio = '0001000000'; // 1.000000
      // Cantidad de alícuotas IVA
      let cantAlicuotas = 0;
      if ((row.iva21 || 0) !== 0) cantAlicuotas++;
      if ((row.iva105 || 0) !== 0) cantAlicuotas++;
      if ((row.iva27 || 0) !== 0) cantAlicuotas++;
      if (cantAlicuotas === 0 && row.netoGravado > 0) cantAlicuotas = 1;

      const codigoOperacion = row.exento && row.exento > 0 && !row.netoGravado ? 'E' : ' ';
      const otrosTributos = formatAmount15(row.otrosTributos || 0);
      const fechaVtoPago = fechaStr;

      // CITI Ventas Comprobantes line (fixed width)
      const line = fechaStr + tipoComprobante + puntoVenta + numDesde + numHasta +
        tipoDocCod + numDoc + nombre +
        importeTotal + importeNoGravado + operExentas +
        percImpNac + percIIBB + percMunicipales + impInternas +
        moneda + tipoCambio + pad(cantAlicuotas, 1) + codigoOperacion +
        otrosTributos + fechaVtoPago;
      lines.push(line);

      // CITI Alícuotas lines
      const compId = tipoComprobante + puntoVenta + numDesde;
      if ((row.iva21 || 0) !== 0 || (cantAlicuotas === 1 && (row.iva105 || 0) === 0 && (row.iva27 || 0) === 0)) {
        alicuotaLines.push(
          tipoComprobante + puntoVenta + numDesde +
          formatAmount15(row.netoGravado) + '0005' + formatAmount15(row.iva21 || row.iva || 0)
        );
      }
      if ((row.iva105 || 0) !== 0) {
        alicuotaLines.push(
          tipoComprobante + puntoVenta + numDesde +
          formatAmount15(row.netoGravado) + '0004' + formatAmount15(row.iva105 || 0)
        );
      }
      if ((row.iva27 || 0) !== 0) {
        alicuotaLines.push(
          tipoComprobante + puntoVenta + numDesde +
          formatAmount15(row.netoGravado) + '0006' + formatAmount15(row.iva27 || 0)
        );
      }
    });

    // Download comprobantes file
    const compBlob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
    const compUrl = URL.createObjectURL(compBlob);
    const a1 = document.createElement('a');
    a1.href = compUrl;
    a1.download = `CITI_${type === 'ventas' ? 'VENTAS' : 'COMPRAS'}_CBTES_${year}${pad(month, 2)}.txt`;
    a1.click();
    URL.revokeObjectURL(compUrl);

    // Download alícuotas file
    setTimeout(() => {
      const alicBlob = new Blob([alicuotaLines.join('\r\n')], { type: 'text/plain;charset=utf-8;' });
      const alicUrl = URL.createObjectURL(alicBlob);
      const a2 = document.createElement('a');
      a2.href = alicUrl;
      a2.download = `CITI_${type === 'ventas' ? 'VENTAS' : 'COMPRAS'}_ALICUOTAS_${year}${pad(month, 2)}.txt`;
      a2.click();
      URL.revokeObjectURL(alicUrl);
    }, 500);

    toast.success('Archivos CITI exportados (comprobantes + alícuotas)');
  };

  const ivaDebitoFiscal = data?.totals ? (data.totals.iva21 || 0) + (data.totals.iva105 || 0) + (data.totals.iva27 || 0) : 0;

  return (
    <ErpPageShell
      title="Libro IVA Digital"
      subtitle="Registro de operaciones según normativa ARCA/AFIP"
      module="FINANZAS"
      userRole={userRole}
      statusText={loading ? 'Cargando' : 'Listo'}
      onRefresh={fetchData}
      refreshing={loading}
      toolbar={[
        { label: 'CSV', icon: <Download className="w-4 h-4" />, onClick: exportCSV },
        { label: 'CITI', icon: <FileText className="w-4 h-4" />, onClick: exportCITI },
      ]}
    >
      {/* Controls */}
      <div className="erp-panel p-4 mb-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setType('ventas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${type === 'ventas' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Ventas
          </button>
          <button
            onClick={() => setType('compras')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${type === 'compras' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Compras
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition"><ChevronLeft className="w-4 h-4" /></button>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl min-w-[200px] justify-center border border-slate-100">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-slate-800">{MONTHS[month - 1]} {year}</span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && data.totals && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100/60 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Comprobantes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{data.count}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100/60 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Neto Gravado</p>
            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(data.totals.netoGravado || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100/60 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">IVA 21%</p>
            <p className="text-lg font-bold text-blue-700 mt-1">{formatCurrency(data.totals.iva21 || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100/60 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">IVA 10.5%</p>
            <p className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(data.totals.iva105 || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100/60 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">IVA 27%</p>
            <p className="text-lg font-bold text-blue-500 mt-1">{formatCurrency(data.totals.iva27 || 0)}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-4 text-white">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-100">
              {type === 'ventas' ? 'Débito Fiscal' : 'Crédito Fiscal'}
            </p>
            <p className="text-lg font-bold mt-1">
              {formatCurrency(type === 'ventas' ? ivaDebitoFiscal : (data.totals.iva || ivaDebitoFiscal))}
            </p>
            <div className="flex items-center gap-1 mt-1">
              {type === 'ventas' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-xs text-blue-100">Total período</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="erp-panel overflow-hidden">
        <div className="overflow-x-auto">
          {type === 'ventas' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Número</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CUIT/DNI</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Razón Social</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cond. IVA</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Neto</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">IVA 21%</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">IVA 10.5%</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">CAE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition">
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{formatDate(row.fecha)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        (row.tipo === '003' || row.tipo === '008' || row.tipo === '013') ? 'bg-red-50 text-red-700' :
                        (row.tipo === '002' || row.tipo === '007' || row.tipo === '012') ? 'bg-amber-50 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>{DOC_TYPE_NAME[row.tipo || ''] || row.tipo}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-800">{row.numero}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">{row.documentoReceptor || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-800 max-w-[180px] truncate">{row.nombreReceptor}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        row.condicionIva === 'responsable_inscripto' ? 'bg-emerald-50 text-emerald-700' :
                        row.condicionIva === 'monotributista' || row.condicionIva === 'monotributo' ? 'bg-purple-50 text-purple-700' :
                        row.condicionIva === 'exento' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{CONDICION_IVA_SHORT[row.condicionIva || ''] || 'CF'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatCurrency(row.netoGravado)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatCurrency(row.iva21 || 0)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatCurrency(row.iva105 || 0)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold">{formatCurrency(row.total)}</td>
                    <td className="px-3 py-2.5 text-center">
                      {row.cae ? (
                        <span className="text-green-600 text-xs" title={row.cae}>✓</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data || data.rows.length === 0) && (
                  <tr><td colSpan={11} className="px-3 py-12 text-center text-slate-400">No hay comprobantes en este período</td></tr>
                )}
              </tbody>
              {data && data.rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50/80 font-semibold border-t-2 border-slate-200">
                    <td colSpan={6} className="px-3 py-3 text-right text-xs text-slate-600 uppercase tracking-wider">Totales</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{formatCurrency(data.totals.netoGravado || 0)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{formatCurrency(data.totals.iva21 || 0)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{formatCurrency(data.totals.iva105 || 0)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold">{formatCurrency(data.totals.total || 0)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proveedor</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CUIT</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Número</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Neto</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">IVA</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition">
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{formatDate(row.fecha)}</td>
                    <td className="px-3 py-2.5 text-slate-800">{row.proveedor}</td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs font-mono">{row.cuitProveedor || '-'}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-800">{row.numero}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatCurrency(row.netoGravado)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{formatCurrency(row.iva)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold">{formatCurrency(row.total)}</td>
                  </tr>
                ))}
                {(!data || data.rows.length === 0) && (
                  <tr><td colSpan={7} className="px-3 py-12 text-center text-slate-400">No hay compras en este período</td></tr>
                )}
              </tbody>
              {data && data.rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50/80 font-semibold border-t-2 border-slate-200">
                    <td colSpan={4} className="px-3 py-3 text-right text-xs text-slate-600 uppercase tracking-wider">Totales</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{formatCurrency(data.totals.netoGravado || 0)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{formatCurrency(data.totals.iva || 0)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs font-bold">{formatCurrency(data.totals.total || 0)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* CITI Info */}
      <div className="mt-4 bg-blue-50/50 rounded-xl border border-blue-100 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Exportación CITI para ARCA/AFIP</p>
          <p className="text-blue-600 mt-1">El botón "CITI AFIP" genera los archivos de texto con formato fijo requeridos por el aplicativo CITI para la presentación de la DDJJ de IVA. Se generan dos archivos: <strong>Comprobantes</strong> y <strong>Alícuotas</strong>.</p>
        </div>
      </div>
    </ErpPageShell>
  );
}
