'use client';

import { useState, useEffect } from 'react';
import { Wallet, Users, Search, Eye, ArrowUpRight, ArrowDownRight, DollarSign, AlertCircle, FileText, CheckCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { PrintDocument, DocumentCompany, DocumentCustomer, DocumentData } from '@/components/print-document';
import { ErpPageShell, ErpKpiBox } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface CustomerAccount {
  id: string;
  customerId: string;
  creditLimit: number;
  balance: number;
  status: string;
  lastMovementAt: string | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;
    taxCondition?: string;
  };
  movements: AccountMovement[];
  pendingInvoices?: PendingInvoice[];
}

interface AccountMovement {
  id: string;
  type: string;
  concept: string;
  description: string;
  amount: number;
  balance: number;
  dueDate: string | null;
  createdAt: string;
}

interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  documentCode: string;
  invoiceType: string;
  total: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  paymentDueDate: string | null;
}

interface InvoicePayment {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  pending: number;
  amount: number;
}

export default function CuentasCorrientesClient() {
  const { userRole } = useErpSession();
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [stats, setStats] = useState({ totalAccounts: 0, totalDebt: 0, totalCredit: 0, accountsWithDebt: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [invoicePayments, setInvoicePayments] = useState<InvoicePayment[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'movements' | 'invoices'>('invoices');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [businessConfig, setBusinessConfig] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
    fetchBusinessConfig();
  }, []);

  const fetchBusinessConfig = async () => {
    try {
      const res = await fetch('/api/business');
      if (res.ok) setBusinessConfig(await res.json());
    } catch {}
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts/customers');
      const data = await res.json();
      setAccounts(data.accounts || []);
      setStats(data.stats || { totalAccounts: 0, totalDebt: 0, totalCredit: 0, accountsWithDebt: 0 });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountDetails = async (customerId: string) => {
    try {
      const res = await fetch(`/api/accounts/customers/${customerId}`);
      const data = await res.json();
      setSelectedAccount(data);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar detalle');
    }
  };

  const openPaymentModal = () => {
    if (!selectedAccount?.pendingInvoices) return;
    const payments = selectedAccount.pendingInvoices.map(inv => ({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      total: inv.total,
      pending: inv.total - (inv.paidAmount || 0),
      amount: 0,
    }));
    setInvoicePayments(payments);
    setCustomAmount('');
    setPaymentMethod('cash');
    setShowPaymentModal(true);
  };

  const payAllPending = () => {
    setInvoicePayments(prev => prev.map(ip => ({ ...ip, amount: ip.pending })));
  };

  const updateInvoicePayment = (invoiceId: string, amount: number) => {
    setInvoicePayments(prev => prev.map(ip =>
      ip.invoiceId === invoiceId ? { ...ip, amount: Math.min(amount, ip.pending) } : ip
    ));
  };

  const totalPayment = invoicePayments.reduce((s, ip) => s + ip.amount, 0) + (parseFloat(customAmount) || 0);

  const handleSubmitPayment = async () => {
    if (totalPayment <= 0 || !selectedAccount) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedAccount.customerId,
          customerName: selectedAccount.customer.name,
          items: [{ paymentMethod, amount: totalPayment }],
          invoicePayments: invoicePayments.filter(ip => ip.amount > 0).map(ip => ({
            invoiceId: ip.invoiceId,
            amount: ip.amount,
          })),
        }),
      });
      if (res.ok) {
        const receipt = await res.json();
        setLastReceipt(receipt);
        toast.success(`Recibo ${receipt.receiptNumber} creado`);
        setShowPaymentModal(false);
        fetchAccounts();
        fetchAccountDetails(selectedAccount.customerId);
      } else {
        toast.error('Error al crear recibo');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Efectivo', transfer: 'Transferencia', check: 'Cheque', card: 'Tarjeta',
  };

  const DOC_CODE_LABELS: Record<string, string> = {
    '001': 'FC A', '002': 'ND A', '003': 'NC A',
    '006': 'FC B', '007': 'ND B', '008': 'NC B',
    '011': 'FC C', '012': 'ND C', '013': 'NC C',
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const filteredAccounts = accounts.filter(acc =>
    acc.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.customer.document?.includes(searchTerm)
  );

  if (loading) {
    return (
      <ErpPageShell title="Cuentas Corrientes" module="FINANZAS" userRole={userRole}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-shimmer h-[88px] rounded-2xl" />)}
          </div>
          <div className="skeleton-shimmer h-[400px] rounded-2xl" />
        </div>
      </ErpPageShell>
    );
  }

  return (
    <ErpPageShell
      title="Cuentas Corrientes"
      subtitle="Saldos pendientes, pagos y recibos"
      module="FINANZAS"
      userRole={userRole}
      onRefresh={fetchAccounts}
    >
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Cuentas</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalAccounts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-xl"><ArrowUpRight className="w-5 h-5 text-red-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Total Deuda</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-xl"><ArrowDownRight className="w-5 h-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Saldo a Favor</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalCredit)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 rounded-xl"><AlertCircle className="w-5 h-5 text-orange-600" /></div>
            <div>
              <p className="text-sm text-slate-500">Con Deuda</p>
              <p className="text-xl font-bold text-slate-900">{stats.accountsWithDebt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o documento..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 premium-input" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 overflow-hidden">
        <table className="w-full premium-table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Documento</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Saldo</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAccounts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                <div className="empty-state"><Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />No hay cuentas corrientes</div>
              </td></tr>
            ) : filteredAccounts.map((account) => (
              <tr key={account.id} className="hover:bg-blue-50/30">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{account.customer.name}</div>
                  {account.customer.email && <div className="text-sm text-slate-500">{account.customer.email}</div>}
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm">{account.customer.document || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${account.balance > 0 ? 'text-red-600' : account.balance < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                    {formatCurrency(Math.abs(account.balance))}
                    <span className="text-xs font-normal ml-1">{account.balance > 0 ? 'Debe' : account.balance < 0 ? 'A favor' : ''}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    account.status === 'active' ? 'bg-green-100 text-green-700' :
                    account.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {account.status === 'active' ? 'Activa' : account.status === 'suspended' ? 'Suspendida' : 'Bloqueada'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => fetchAccountDetails(account.customerId)}
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium">
                    <Eye className="w-4 h-4" /> Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showModal && selectedAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedAccount.customer.name}</h2>
                <p className="text-slate-500 text-sm">{selectedAccount.customer.document || 'Sin documento'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={openPaymentModal}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 shadow-sm shadow-emerald-500/20 flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="w-4 h-4" /> Registrar Cobro
                </button>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">&times;</button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-100">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Saldo Actual</p>
                <p className={`text-2xl font-bold ${selectedAccount.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(Math.abs(selectedAccount.balance))}
                </p>
                <p className="text-xs text-slate-500">{selectedAccount.balance > 0 ? 'Debe' : selectedAccount.balance < 0 ? 'A favor' : 'Sin saldo'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Facturas Pendientes</p>
                <p className="text-2xl font-bold text-slate-900">{selectedAccount.pendingInvoices?.length || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500">Deuda en Facturas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency((selectedAccount.pendingInvoices || []).reduce((s, i) => s + (i.total - (i.paidAmount || 0)), 0))}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4">
              <button onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium ${activeTab === 'invoices' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <FileText className="w-4 h-4 inline mr-1" /> Facturas Pendientes
              </button>
              <button onClick={() => setActiveTab('movements')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium ${activeTab === 'movements' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <ArrowUpRight className="w-4 h-4 inline mr-1" /> Movimientos
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[45vh]">
              {activeTab === 'invoices' ? (
                <div className="space-y-2">
                  {!selectedAccount.pendingInvoices?.length ? (
                    <p className="text-slate-500 text-center py-8">No hay facturas pendientes de cobro</p>
                  ) : selectedAccount.pendingInvoices.map(inv => {
                    const pending = inv.total - (inv.paidAmount || 0);
                    const pctPaid = inv.total > 0 ? ((inv.paidAmount || 0) / inv.total) * 100 : 0;
                    return (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`px-2 py-0.5 text-xs font-bold rounded ${inv.invoiceType === 'A' ? 'bg-blue-100 text-blue-700' : inv.invoiceType === 'B' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                            {DOC_CODE_LABELS[inv.documentCode] || inv.invoiceType}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{inv.invoiceNumber}</p>
                            <p className="text-xs text-slate-500">{formatDate(inv.createdAt)}
                              {inv.paymentDueDate && <> · Vence: {formatDate(inv.paymentDueDate)}</>}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{formatCurrency(inv.total)}</p>
                          {pctPaid > 0 && pctPaid < 100 && (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pctPaid}%` }} />
                              </div>
                              <span className="text-xs text-slate-500">Pagado: {formatCurrency(inv.paidAmount || 0)}</span>
                            </div>
                          )}
                          <p className="text-xs font-semibold text-red-600">Pendiente: {formatCurrency(pending)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {!selectedAccount.movements?.length ? (
                    <p className="text-slate-500 text-center py-8">No hay movimientos</p>
                  ) : selectedAccount.movements.map(mov => (
                    <div key={mov.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${mov.type === 'debit' ? 'bg-red-100' : 'bg-green-100'}`}>
                          {mov.type === 'debit' ? <ArrowUpRight className="w-4 h-4 text-red-600" /> : <ArrowDownRight className="w-4 h-4 text-green-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{mov.description}</p>
                          <p className="text-xs text-slate-500">{formatDate(mov.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${mov.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                          {mov.type === 'debit' ? '+' : '-'}{formatCurrency(mov.amount)}
                        </p>
                        <p className="text-xs text-slate-500">Saldo: {formatCurrency(mov.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedAccount && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Registrar Cobro</h2>
              <p className="text-slate-500 text-sm">{selectedAccount.customer.name}</p>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Pending invoices to pay */}
              {invoicePayments.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-slate-700">Imputar a facturas</label>
                    <button onClick={payAllPending} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Pagar todo</button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {invoicePayments.map(ip => (
                      <div key={ip.invoiceId} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ip.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">Pendiente: {formatCurrency(ip.pending)}</p>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input type="number" min={0} max={ip.pending} step="0.01"
                            value={ip.amount || ''}
                            onChange={(e) => updateInvoicePayment(ip.invoiceId, parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-2 py-1.5 text-sm premium-input text-right" placeholder="0.00" />
                        </div>
                        <button onClick={() => updateInvoicePayment(ip.invoiceId, ip.pending)}
                          className="text-xs text-emerald-600 hover:text-emerald-800 font-medium whitespace-nowrap">Total</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional/free amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto adicional (a cuenta)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="0.00" className="w-full pl-9 pr-4 py-2.5 premium-input" />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Pago</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-2.5 premium-input">
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="check">Cheque</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>

              {/* Total */}
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 mb-1">Total a Cobrar</p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(totalPayment)}</p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3 justify-end">
              <button onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm">Cancelar</button>
              <button onClick={handleSubmitPayment} disabled={totalPayment <= 0 || submitting}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 shadow-sm shadow-emerald-500/20 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {submitting ? 'Procesando...' : 'Crear Recibo de Cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print receipt */}
      {showReceipt && lastReceipt && businessConfig && (
        <PrintDocument
          company={{
            businessName: businessConfig.businessName || '',
            legalName: businessConfig.legalName,
            cuit: businessConfig.cuit,
            condicionIva: businessConfig.condicionIva,
            address: businessConfig.address,
            city: businessConfig.city,
            province: businessConfig.province,
          }}
          customer={{
            name: lastReceipt.customerName,
          }}
          document={{
            documentType: 'recibo',
            documentLetter: 'X',
            documentNumber: lastReceipt.receiptNumber,
            pointOfSale: businessConfig.defaultPOS || 1,
            date: new Date(lastReceipt.date || lastReceipt.createdAt),
            items: (lastReceipt.items || []).map((it: any) => ({
              name: `Pago - ${PAYMENT_LABELS[it.paymentMethod] || it.paymentMethod}`,
              quantity: 1,
              unitPrice: it.amount,
              discount: 0,
              subtotal: it.amount,
            })),
            subtotal: lastReceipt.totalAmount,
            ivaTotal: 0,
            total: lastReceipt.totalAmount,
            template: 'profesional',
            currency: 'ARS',
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
    </ErpPageShell>
  );
}
