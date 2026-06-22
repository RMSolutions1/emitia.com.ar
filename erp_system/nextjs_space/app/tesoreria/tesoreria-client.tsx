'use client';

import { useState, useEffect } from 'react';
import { Landmark, Plus, CreditCard, FileText, ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle, Calendar, DollarSign, Clock, Lock, Unlock, X, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  cbu: string | null;
  alias: string | null;
  accountType: string;
  currency: string;
  balance: number;
  isActive: boolean;
  movements: BankMovement[];
}

interface BankMovement {
  id: string;
  type: string;
  concept: string;
  description: string | null;
  amount: number;
  balance: number;
  date: string;
}

interface Check {
  id: string;
  type: string;
  checkNumber: string;
  bankName: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  payee: string | null;
  drawer: string | null;
  status: string;
}

interface CashRegister {
  id: string;
  pointOfSale: number;
  openingDate: string;
  closingDate: string | null;
  openingCash: number;
  closingCash: number | null;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  status: string;
  notes: string | null;
  userId: string | null;
}

interface LiveSummary {
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  invoiceTotal: number;
  ticketTotal: number;
  expectedCash: number;
  salesCount: number;
  invoicesCount: number;
  ticketsCount: number;
}

const MOVEMENT_LABELS: Record<string, string> = {
  deposit: 'Depósito',
  withdrawal: 'Extracción',
  transfer_in: 'Transf. Entrada',
  transfer_out: 'Transf. Salida',
  fee: 'Comisión/Gasto',
  interest: 'Interés',
};

export default function TesoreriaClient() {
  const { userRole } = useErpSession();
  const [activeTab, setActiveTab] = useState<'cash' | 'banks' | 'checks'>('cash');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [checks, setChecks] = useState<Check[]>([]);
  const [checkStats, setCheckStats] = useState({ totalReceived: 0, totalIssued: 0, inPortfolioCount: 0, inPortfolioAmount: 0, upcomingDue: 0 });
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [openRegister, setOpenRegister] = useState<CashRegister | null>(null);
  const [liveSummary, setLiveSummary] = useState<LiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewBankModal, setShowNewBankModal] = useState(false);
  const [showNewCheckModal, setShowNewCheckModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

  // Forms
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', cbu: '', alias: '', accountType: 'checking', balance: 0 });
  const [checkForm, setCheckForm] = useState({ type: 'received', checkNumber: '', bankName: '', amount: 0, issueDate: '', dueDate: '', drawer: '', payee: '' });
  const [movementForm, setMovementForm] = useState({ type: 'deposit', concept: '', amount: 0 });
  const [openCashForm, setOpenCashForm] = useState({ openingCash: 0, pointOfSale: 1 });
  const [closingCash, setClosingCash] = useState(0);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchBankAccounts(), fetchChecks(), fetchCashRegisters()]);
    setLoading(false);
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      setBankAccounts(data.accounts || []);
      setTotalBalance(data.totalBalance || 0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchChecks = async () => {
    try {
      const res = await fetch('/api/checks');
      const data = await res.json();
      setChecks(data.checks || []);
      setCheckStats(data.stats || { totalReceived: 0, totalIssued: 0, inPortfolioCount: 0, inPortfolioAmount: 0, upcomingDue: 0 });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchCashRegisters = async () => {
    try {
      const res = await fetch('/api/cash-registers');
      const data = await res.json();
      setCashRegisters(data.registers || []);
      setOpenRegister(data.openRegister || null);

      // If there's an open register, fetch live summary
      if (data.openRegister) {
        const detailRes = await fetch(`/api/cash-registers/${data.openRegister.id}`);
        const detailData = await detailRes.json();
        setLiveSummary(detailData.liveSummary || null);
      } else {
        setLiveSummary(null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleOpenCash = async () => {
    try {
      const res = await fetch('/api/cash-registers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(openCashForm),
      });
      if (res.ok) {
        toast.success('Caja abierta');
        setShowOpenCashModal(false);
        setOpenCashForm({ openingCash: 0, pointOfSale: 1 });
        fetchCashRegisters();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al abrir caja');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const handleCloseCash = async () => {
    if (!openRegister) return;
    try {
      const res = await fetch(`/api/cash-registers/${openRegister.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', closingCash }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Caja cerrada exitosamente');
        setShowCloseCashModal(false);
        setClosingCash(0);
        fetchCashRegisters();
      } else {
        toast.error('Error al cerrar caja');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const handleCreateBank = async () => {
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });
      if (res.ok) {
        toast.success('Cuenta creada');
        setShowNewBankModal(false);
        setBankForm({ bankName: '', accountNumber: '', cbu: '', alias: '', accountType: 'checking', balance: 0 });
        fetchBankAccounts();
      } else {
        toast.error('Error al crear cuenta');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const handleCreateCheck = async () => {
    try {
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkForm),
      });
      if (res.ok) {
        toast.success('Cheque registrado');
        setShowNewCheckModal(false);
        setCheckForm({ type: 'received', checkNumber: '', bankName: '', amount: 0, issueDate: '', dueDate: '', drawer: '', payee: '' });
        fetchChecks();
      } else {
        toast.error('Error al registrar cheque');
      }
    } catch { toast.error('Error de conexión'); }
  };

  const handleCreateMovement = async () => {
    if (!selectedBank) return;
    try {
      const res = await fetch(`/api/bank-accounts/${selectedBank.id}/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementForm),
      });
      if (res.ok) {
        toast.success('Movimiento registrado');
        setShowMovementModal(false);
        setMovementForm({ type: 'deposit', concept: '', amount: 0 });
        fetchBankAccounts();
      }
    } catch { toast.error('Error de conexión'); }
  };

  const handleUpdateCheckStatus = async (checkId: string, status: string) => {
    try {
      const res = await fetch(`/api/checks/${checkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success('Estado actualizado');
        fetchChecks();
      }
    } catch { console.error('Error'); }
  };

  const fmt = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  const fmtDate = (date: string) => new Date(date).toLocaleDateString('es-AR');
  const fmtDateTime = (date: string) => new Date(date).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getCheckStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      in_portfolio: 'bg-blue-100 text-blue-700',
      deposited: 'bg-green-100 text-green-700',
      cashed: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      endorsed: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-slate-100 text-slate-700',
    };
    const labels: Record<string, string> = {
      in_portfolio: 'En Cartera', deposited: 'Depositado', cashed: 'Cobrado',
      rejected: 'Rechazado', endorsed: 'Endosado', cancelled: 'Anulado',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-slate-100'}`}>{labels[status] || status}</span>;
  };

  if (loading) {
    return (
      <ErpPageShell title="Tesorería" module="FINANZAS" userRole={userRole}>
        <div className="space-y-4">
          <div className="skeleton-shimmer h-12 rounded-2xl" />
          <div className="skeleton-shimmer h-[400px] rounded-2xl" />
        </div>
      </ErpPageShell>
    );
  }

  return (
    <ErpPageShell
      title="Tesorería"
      subtitle="Caja diaria, cuentas bancarias y cheques"
      module="FINANZAS"
      userRole={userRole}
      onRefresh={fetchAll}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'cash' as const, label: 'Caja Diaria', icon: DollarSign },
          { id: 'banks' as const, label: 'Bancos', icon: CreditCard },
          { id: 'checks' as const, label: 'Cheques', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ CAJA DIARIA ═══ */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          {/* Current status */}
          {openRegister ? (
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Unlock className="w-5 h-5" />
                    <span className="text-green-100 text-sm font-medium uppercase tracking-wider">Caja Abierta</span>
                  </div>
                  <p className="text-sm text-green-100">PdV {openRegister.pointOfSale} • Abierta: {fmtDateTime(openRegister.openingDate)}</p>
                  <p className="text-3xl font-bold mt-2">Fondo: {fmt(openRegister.openingCash)}</p>
                </div>
                <button
                  onClick={() => { setClosingCash(liveSummary?.expectedCash || openRegister.openingCash); setShowCloseCashModal(true); }}
                  className="px-4 py-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 flex items-center gap-2 font-medium text-sm"
                >
                  <Lock className="w-4 h-4" /> Cerrar Caja
                </button>
              </div>

              {liveSummary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                  <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-green-100">Ventas</p>
                    <p className="text-lg font-bold">{liveSummary.salesCount}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-green-100">Efectivo</p>
                    <p className="text-lg font-bold">{fmt(liveSummary.totalCash)}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-green-100">Tarjeta</p>
                    <p className="text-lg font-bold">{fmt(liveSummary.totalCard)}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-green-100">Transferencia</p>
                    <p className="text-lg font-bold">{fmt(liveSummary.totalTransfer)}</p>
                  </div>
                  <div className="bg-white/15 backdrop-blur rounded-xl p-3">
                    <p className="text-xs text-green-100">Efectivo Esperado</p>
                    <p className="text-lg font-bold">{fmt(liveSummary.expectedCash)}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Caja Cerrada</h3>
              <p className="text-slate-500 mb-6">Abrí la caja para empezar a registrar operaciones del día</p>
              <button
                onClick={() => setShowOpenCashModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-sm shadow-blue-500/20 font-medium inline-flex items-center gap-2"
              >
                <Unlock className="w-5 h-5" /> Abrir Caja
              </button>
            </div>
          )}

          {/* History */}
          <div className="erp-panel overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Historial de Cajas</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PdV</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Apertura</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cierre</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Fondo Inicial</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cierre Efectivo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ventas</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashRegisters.map(cr => (
                    <tr key={cr.id} className="hover:bg-blue-50/30 transition">
                      <td className="px-4 py-3 font-medium">{cr.pointOfSale}</td>
                      <td className="px-4 py-3 text-slate-600">{fmtDateTime(cr.openingDate)}</td>
                      <td className="px-4 py-3 text-slate-600">{cr.closingDate ? fmtDateTime(cr.closingDate) : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmt(cr.openingCash)}</td>
                      <td className="px-4 py-3 text-right font-mono">{cr.closingCash != null ? fmt(cr.closingCash) : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(cr.totalSales)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          cr.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>{cr.status === 'open' ? 'Abierta' : 'Cerrada'}</span>
                      </td>
                    </tr>
                  ))}
                  {cashRegisters.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay registros de caja</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BANCOS ═══ */}
      {activeTab === 'banks' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-blue-100 text-sm">Saldo Total en Bancos</p>
                <p className="text-4xl font-bold">{fmt(totalBalance)}</p>
              </div>
              <button
                onClick={() => setShowNewBankModal(true)}
                className="px-4 py-2.5 bg-white/20 backdrop-blur text-white rounded-xl hover:bg-white/30 flex items-center gap-2 font-medium text-sm"
              >
                <Plus className="w-5 h-5" /> Nueva Cuenta
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {bankAccounts.map((account) => (
              <div key={account.id} className="erp-panel overflow-hidden">
                <div className="p-5 flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{account.bankName}</h3>
                      <p className="text-sm text-slate-500">{account.accountType === 'checking' ? 'Cuenta Corriente' : 'Caja de Ahorro'} • {account.accountNumber}</p>
                      {account.cbu && <p className="text-xs text-slate-400 font-mono mt-0.5">CBU: {account.cbu}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{fmt(account.balance)}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setSelectedBank(account); setShowMovementModal(true); }}
                        className="text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                      >
                        + Movimiento
                      </button>
                      <button
                        onClick={() => setExpandedBank(expandedBank === account.id ? null : account.id)}
                        className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        {expandedBank === account.id ? 'Ocultar' : 'Movimientos'}
                        {expandedBank === account.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded movements */}
                {expandedBank === account.id && (
                  <div className="border-t border-slate-100">
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Fecha</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Tipo</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Concepto</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Monto</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Saldo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {(account.movements || []).map(mv => (
                            <tr key={mv.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2 text-slate-600">{fmtDate(mv.date)}</td>
                              <td className="px-4 py-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  ['deposit', 'transfer_in', 'interest'].includes(mv.type)
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                                }`}>{MOVEMENT_LABELS[mv.type] || mv.type}</span>
                              </td>
                              <td className="px-4 py-2 text-slate-700">{mv.concept}</td>
                              <td className={`px-4 py-2 text-right font-mono font-medium ${
                                ['deposit', 'transfer_in', 'interest'].includes(mv.type)
                                  ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {['deposit', 'transfer_in', 'interest'].includes(mv.type) ? '+' : '-'}{fmt(Math.abs(mv.amount))}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-slate-600">{fmt(mv.balance)}</td>
                            </tr>
                          ))}
                          {(!account.movements || account.movements.length === 0) && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Sin movimientos</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {bankAccounts.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-400">No hay cuentas bancarias registradas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CHEQUES ═══ */}
      {activeTab === 'checks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="erp-panel p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl"><Wallet className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-sm text-slate-500">En Cartera</p>
                  <p className="text-xl font-bold">{checkStats.inPortfolioCount}</p>
                  <p className="text-sm text-blue-600 font-medium">{fmt(checkStats.inPortfolioAmount)}</p>
                </div>
              </div>
            </div>
            <div className="erp-panel p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl"><ArrowDownRight className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-sm text-slate-500">Total Recibidos</p>
                  <p className="text-xl font-bold text-green-600">{fmt(checkStats.totalReceived)}</p>
                </div>
              </div>
            </div>
            <div className="erp-panel p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl"><ArrowUpRight className="w-5 h-5 text-red-600" /></div>
                <div>
                  <p className="text-sm text-slate-500">Total Emitidos</p>
                  <p className="text-xl font-bold text-red-600">{fmt(checkStats.totalIssued)}</p>
                </div>
              </div>
            </div>
            <div className="erp-panel p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
                <div>
                  <p className="text-sm text-slate-500">Vencen en 7 días</p>
                  <p className="text-xl font-bold text-orange-600">{checkStats.upcomingDue}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => setShowNewCheckModal(true)} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-sm shadow-blue-500/20 flex items-center gap-2 font-medium text-sm">
              <Plus className="w-5 h-5" /> Nuevo Cheque
            </button>
          </div>

          <div className="erp-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Número</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Banco</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checks.map((check) => (
                    <tr key={check.id} className="hover:bg-blue-50/30 transition">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${check.type === 'received' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {check.type === 'received' ? 'Recibido' : 'Emitido'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium font-mono">{check.checkNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{check.bankName}</td>
                      <td className="px-4 py-3 text-right font-semibold font-mono">{fmt(check.amount)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {fmtDate(check.dueDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getCheckStatusBadge(check.status)}</td>
                      <td className="px-4 py-3">
                        {check.status === 'in_portfolio' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleUpdateCheckStatus(check.id, 'deposited')} className="text-green-600 hover:text-green-800 text-xs font-medium">Depositar</button>
                            <button onClick={() => handleUpdateCheckStatus(check.id, 'endorsed')} className="text-purple-600 hover:text-purple-800 text-xs font-medium">Endosar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {checks.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay cheques registrados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALES ═══ */}

      {/* Abrir Caja */}
      {showOpenCashModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Abrir Caja</h2>
              <button onClick={() => setShowOpenCashModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Punto de Venta</label>
                <input type="number" min="1" value={openCashForm.pointOfSale} onChange={e => setOpenCashForm({ ...openCashForm, pointOfSale: parseInt(e.target.value) || 1 })} className="premium-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fondo Inicial ($)</label>
                <input type="number" step="0.01" value={openCashForm.openingCash} onChange={e => setOpenCashForm({ ...openCashForm, openingCash: parseFloat(e.target.value) || 0 })} className="premium-input w-full" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowOpenCashModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
              <button onClick={handleOpenCash} className="btn-primary px-4 py-2">Abrir Caja</button>
            </div>
          </div>
        </div>
      )}

      {/* Cerrar Caja */}
      {showCloseCashModal && openRegister && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Cerrar Caja - Arqueo</h2>
              <button onClick={() => setShowCloseCashModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {liveSummary && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Fondo Inicial</span><span className="font-medium">{fmt(openRegister.openingCash)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Ventas Efectivo</span><span className="font-medium text-green-600">+{fmt(liveSummary.totalCash)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Ventas Tarjeta</span><span className="font-medium">{fmt(liveSummary.totalCard)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Ventas Transferencia</span><span className="font-medium">{fmt(liveSummary.totalTransfer)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Facturas</span><span className="font-medium">{liveSummary.invoicesCount} ({fmt(liveSummary.invoiceTotal)})</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500">Tickets</span><span className="font-medium">{liveSummary.ticketsCount} ({fmt(liveSummary.ticketTotal)})</span></div>
                  <div className="border-t pt-2 mt-2 flex justify-between text-sm font-bold">
                    <span>Efectivo Esperado</span>
                    <span className="text-blue-600">{fmt(liveSummary.expectedCash)}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Efectivo Contado ($)</label>
                <input type="number" step="0.01" value={closingCash} onChange={e => setClosingCash(parseFloat(e.target.value) || 0)} className="premium-input w-full text-lg font-mono" />
              </div>
              {liveSummary && (
                <div className={`rounded-xl p-3 text-center font-bold text-lg ${
                  Math.abs(closingCash - liveSummary.expectedCash) < 0.01 ? 'bg-green-50 text-green-700' :
                  closingCash > liveSummary.expectedCash ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                }`}>
                  Diferencia: {fmt(closingCash - liveSummary.expectedCash)}
                  {Math.abs(closingCash - liveSummary.expectedCash) < 0.01 && ' ✓ Cuadra'}
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowCloseCashModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
              <button onClick={handleCloseCash} className="btn-primary px-4 py-2">Confirmar Cierre</button>
            </div>
          </div>
        </div>
      )}

      {/* Nueva Cuenta Bancaria */}
      {showNewBankModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nueva Cuenta Bancaria</h2>
              <button onClick={() => setShowNewBankModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
                <input type="text" value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })} className="premium-input w-full" placeholder="Ej: Banco Galicia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Cuenta</label>
                <input type="text" value={bankForm.accountNumber} onChange={e => setBankForm({ ...bankForm, accountNumber: e.target.value })} className="premium-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CBU</label>
                <input type="text" value={bankForm.cbu} onChange={e => setBankForm({ ...bankForm, cbu: e.target.value })} className="premium-input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alias</label>
                <input type="text" value={bankForm.alias} onChange={e => setBankForm({ ...bankForm, alias: e.target.value })} className="premium-input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select value={bankForm.accountType} onChange={e => setBankForm({ ...bankForm, accountType: e.target.value })} className="premium-select w-full">
                    <option value="checking">Cuenta Corriente</option>
                    <option value="savings">Caja de Ahorro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial</label>
                  <input type="number" value={bankForm.balance} onChange={e => setBankForm({ ...bankForm, balance: parseFloat(e.target.value) || 0 })} className="premium-input w-full" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowNewBankModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
              <button onClick={handleCreateBank} className="btn-primary px-4 py-2">Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* Nuevo Cheque */}
      {showNewCheckModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Nuevo Cheque</h2>
              <button onClick={() => setShowNewCheckModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select value={checkForm.type} onChange={e => setCheckForm({ ...checkForm, type: e.target.value })} className="premium-select w-full">
                  <option value="received">Recibido</option>
                  <option value="issued">Emitido</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                  <input type="text" value={checkForm.checkNumber} onChange={e => setCheckForm({ ...checkForm, checkNumber: e.target.value })} className="premium-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
                  <input type="text" value={checkForm.bankName} onChange={e => setCheckForm({ ...checkForm, bankName: e.target.value })} className="premium-input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                <input type="number" value={checkForm.amount} onChange={e => setCheckForm({ ...checkForm, amount: parseFloat(e.target.value) || 0 })} className="premium-input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Emisión</label>
                  <input type="date" value={checkForm.issueDate} onChange={e => setCheckForm({ ...checkForm, issueDate: e.target.value })} className="premium-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimiento</label>
                  <input type="date" value={checkForm.dueDate} onChange={e => setCheckForm({ ...checkForm, dueDate: e.target.value })} className="premium-input w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{checkForm.type === 'received' ? 'Librador' : 'Beneficiario'}</label>
                <input type="text" value={checkForm.type === 'received' ? checkForm.drawer : checkForm.payee} onChange={e => setCheckForm({ ...checkForm, ...(checkForm.type === 'received' ? { drawer: e.target.value } : { payee: e.target.value }) })} className="premium-input w-full" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowNewCheckModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
              <button onClick={handleCreateCheck} className="btn-primary px-4 py-2">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Movimiento Bancario */}
      {showMovementModal && selectedBank && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Nuevo Movimiento</h2>
                <p className="text-slate-500 text-sm">{selectedBank.bankName} - {selectedBank.accountNumber}</p>
              </div>
              <button onClick={() => setShowMovementModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select value={movementForm.type} onChange={e => setMovementForm({ ...movementForm, type: e.target.value })} className="premium-select w-full">
                  <option value="deposit">Depósito</option>
                  <option value="withdrawal">Extracción</option>
                  <option value="transfer_in">Transferencia Entrada</option>
                  <option value="transfer_out">Transferencia Salida</option>
                  <option value="fee">Comisión/Gasto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Concepto</label>
                <input type="text" value={movementForm.concept} onChange={e => setMovementForm({ ...movementForm, concept: e.target.value })} className="premium-input w-full" placeholder="Ej: Depósito en efectivo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto</label>
                <input type="number" value={movementForm.amount} onChange={e => setMovementForm({ ...movementForm, amount: parseFloat(e.target.value) || 0 })} className="premium-input w-full" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowMovementModal(false)} className="btn-secondary px-4 py-2">Cancelar</button>
              <button onClick={handleCreateMovement} className="btn-primary px-4 py-2">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </ErpPageShell>
  );
}
