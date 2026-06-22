'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Search, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface Transaction {
  id: string;
  saleId?: string;
  provider: string;
  externalId?: string;
  preferenceId?: string;
  status: string;
  statusDetail?: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  paymentTypeId?: string;
  installments: number;
  fee: number;
  netAmount?: number;
  payerEmail?: string;
  payerDocument?: string;
  webhookReceived: boolean;
  createdAt: string;
}

interface Stats {
  [key: string]: { count: number; total: number };
}

export function TransaccionesClient() {
  const { userRole } = useErpSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [refundingId, setRefundingId] = useState<string | null>(null);

  const handleRefund = async (tx: Transaction) => {
    if (tx.provider !== 'mercadopago' || tx.status !== 'approved') return;
    if (!confirm(`¿Reembolsar ${formatCurrency(tx.amount, tx.currency)}?`)) return;

    setRefundingId(tx.id);
    try {
      const res = await fetch('/api/payments/mercadopago/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: tx.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Reembolso procesado');
        fetchTransactions();
      } else {
        toast.error(data.error || 'Error al reembolsar');
      }
    } catch {
      toast.error('Error al procesar reembolso');
    } finally {
      setRefundingId(null);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, providerFilter]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (providerFilter) params.append('provider', providerFilter);

      const res = await fetch(`/api/payments/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      approved: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-4 w-4" />, label: 'Aprobado' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-4 w-4" />, label: 'Pendiente' },
      rejected: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-4 w-4" />, label: 'Rechazado' },
      cancelled: { color: 'bg-slate-100 text-slate-700', icon: <XCircle className="h-4 w-4" />, label: 'Cancelado' },
      refunded: { color: 'bg-purple-100 text-purple-700', icon: <AlertCircle className="h-4 w-4" />, label: 'Reembolsado' }
    };
    const c = config[status] || { color: 'bg-slate-100 text-slate-700', icon: <Clock className="h-4 w-4" />, label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${c.color}`}>
        {c.icon}
        {c.label}
      </span>
    );
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      mercadopago: 'bg-blue-500',
      stripe: 'bg-purple-500',
      paypal: 'bg-yellow-500',
      cash: 'bg-green-500'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${colors[provider] || 'bg-slate-500'}`}>
        {provider.charAt(0).toUpperCase() + provider.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <ErpPageShell title="Transacciones de Pago" module="FINANZAS" userRole={userRole}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="space-y-4"><div className="skeleton-shimmer h-12 rounded-2xl" /><div className="skeleton-shimmer h-[400px] rounded-2xl" /></div>
        </div>
      </ErpPageShell>
    );
  }

  const totalApproved = stats.approved?.total || 0;
  const totalPending = stats.pending?.total || 0;

  return (
    <ErpPageShell
      title="Transacciones de Pago"
      subtitle="Historial de pagos procesados"
      module="FINANZAS"
      userRole={userRole}
      onRefresh={fetchTransactions}
      refreshing={loading}
    >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Transacciones</p>
                <p className="text-2xl font-bold text-slate-900">{transactions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalApproved)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Comisiones</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(transactions.reduce((sum, t) => sum + (t.fee || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="erp-panel p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 premium-input"
            >
              <option value="">Todos los estados</option>
              <option value="approved">Aprobadas</option>
              <option value="pending">Pendientes</option>
              <option value="rejected">Rechazadas</option>
              <option value="cancelled">Canceladas</option>
              <option value="refunded">Reembolsadas</option>
            </select>
            <select
              value={providerFilter}
              onChange={e => setProviderFilter(e.target.value)}
              className="px-3 py-2 premium-input"
            >
              <option value="">Todos los proveedores</option>
              <option value="mercadopago">MercadoPago</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="erp-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Monto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Comisión</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Neto</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pagador</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No hay transacciones para mostrar</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-500">{tx.id.slice(0, 8)}...</span>
                        {tx.externalId && (
                          <p className="font-mono text-xs text-blue-600">{tx.externalId}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getProviderBadge(tx.provider)}
                        {tx.paymentMethodId && (
                          <p className="text-xs text-slate-500 mt-1">{tx.paymentMethodId}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-semibold">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 text-sm">
                        -{formatCurrency(tx.fee, tx.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 font-medium">
                        {tx.netAmount ? formatCurrency(tx.netAmount, tx.currency) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-6 py-4">
                        {tx.payerEmail && <p className="text-sm text-slate-600">{tx.payerEmail}</p>}
                        {tx.payerDocument && <p className="text-xs text-slate-400">Doc: {tx.payerDocument}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {tx.provider === 'mercadopago' && tx.status === 'approved' && (
                          <button
                            onClick={() => handleRefund(tx)}
                            disabled={refundingId === tx.id}
                            className="text-xs px-3 py-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
                          >
                            {refundingId === tx.id ? '...' : 'Reembolsar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
    </ErpPageShell>
  );
}
