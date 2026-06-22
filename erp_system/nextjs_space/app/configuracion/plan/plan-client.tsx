'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Crown, CreditCard, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface PlanInfo {
  name: string;
  subscriptionPrice: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  nextBillingDate?: string | null;
  plan?: string | null;
}

export default function PlanClient() {
  const { userRole } = useErpSession();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetch('/api/platform/billing/mercadopago')
      .then((r) => r.json())
      .then((d) => setPlan(d.company || null))
      .catch(() => toast.error('Error al cargar plan'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') toast.success('Pago del plan registrado. Gracias.');
    if (payment === 'failure') toast.error('El pago del plan no se completó.');
  }, [searchParams]);

  const payPlan = async () => {
    setPaying(true);
    try {
      const res = await fetch('/api/platform/billing/mercadopago', { method: 'POST' });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || 'No se pudo iniciar el pago');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setPaying(false);
    }
  };

  const statusLabel: Record<string, string> = {
    paid: 'Al día',
    pending: 'Pendiente',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
  };

  return (
    <ErpPageShell
      title="Plan EMITIA"
      subtitle="Suscripción de la plataforma y facturación SaaS"
      module="CONFIG"
      userRole={userRole}
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="max-w-lg mx-auto erp-panel p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Crown className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1a3a5c]">{plan?.name || 'Mi empresa'}</h2>
              <p className="text-sm text-[#5c7291]">Plan: {plan?.plan || 'Estándar'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#eef3f9] border border-[#b8c9dc] p-3 rounded">
              <p className="text-[10px] uppercase font-bold text-[#5c7291]">Mensual</p>
              <p className="text-lg font-bold text-[#1a3a5c]">
                ${(plan?.subscriptionPrice || 0).toLocaleString('es-AR')}
              </p>
            </div>
            <div className="bg-[#eef3f9] border border-[#b8c9dc] p-3 rounded">
              <p className="text-[10px] uppercase font-bold text-[#5c7291]">Estado</p>
              <p className={`text-lg font-bold ${
                plan?.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {statusLabel[plan?.paymentStatus || 'pending'] || plan?.paymentStatus}
              </p>
            </div>
          </div>

          {plan?.nextBillingDate && (
            <p className="text-sm text-[#5c7291] mb-4">
              Próximo vencimiento: {new Date(plan.nextBillingDate).toLocaleDateString('es-AR')}
            </p>
          )}

          {plan?.paymentStatus === 'paid' ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              Tu plan está activo. Podés renovar antes del vencimiento.
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mb-4">
              <AlertCircle className="w-5 h-5 shrink-0" />
              Regularizá el pago para mantener todos los servicios activos.
            </div>
          )}

          <button
            type="button"
            onClick={payPlan}
            disabled={paying || !plan?.subscriptionPrice}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 disabled:opacity-50"
          >
            {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            Pagar plan con Mercado Pago
            <ExternalLink className="w-4 h-4 opacity-70" />
          </button>
        </div>
      )}
    </ErpPageShell>
  );
}
