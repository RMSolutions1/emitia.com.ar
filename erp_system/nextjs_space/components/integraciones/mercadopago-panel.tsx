'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  QrCode,
  Link2,
  Smartphone,
  Shield,
  CheckCircle,
  XCircle,
  ExternalLink,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Store,
  Webhook,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { MPIntegrationMetadata } from '@/lib/mercadopago/metadata';

const MP_DOCS = 'https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/overview';
const MP_PANEL = 'https://www.mercadopago.com.ar/developers/panel/app';
const MP_TEST_USERS = 'https://www.mercadopago.com.ar/developers/panel/app/78818222780861/test-users';

interface MPStatus {
  configured?: boolean;
  environment?: string;
  account?: { id: number; nickname: string; email?: string; testUser?: boolean };
  accountError?: string;
  qrConfigured?: boolean;
  metadata?: MPIntegrationMetadata;
  stats?: { pendingSales: number; transactions: number };
  webhook?: { configured: boolean; url: string | null; publicRequired: boolean };
  quality?: { minScore: number; tips: string[] };
}

const MP_SERVICES = [
  {
    id: 'checkoutPro',
    key: 'checkoutPro' as const,
    name: 'Checkout Pro',
    description: 'Redirección a Mercado Pago (tarjetas, transferencia, dinero en cuenta)',
    icon: CreditCard,
    status: 'integrated' as const,
  },
  {
    id: 'qrInstore',
    key: 'qrInstore' as const,
    name: 'QR Presencial',
    description: 'Cobro con código QR en sucursal (API Orders)',
    icon: QrCode,
    status: 'integrated' as const,
  },
  {
    id: 'paymentLink',
    key: 'paymentLink' as const,
    name: 'Link de pago',
    description: 'Misma preferencia Checkout Pro; compartible por WhatsApp o email',
    icon: Link2,
    status: 'integrated' as const,
  },
  {
    id: 'point',
    key: 'point' as const,
    name: 'Point (lector)',
    description: 'Terminal física Mercado Pago — configuración en app MP',
    icon: Smartphone,
    status: 'external' as const,
    href: 'https://www.mercadopago.com.ar/herramientas-para-vender/lectores-point',
  },
  {
    id: 'bills',
    name: 'Pagos de servicios',
    description: 'Recargas y facturas — programa comercial MP (no API pública estándar)',
    icon: BarChart3,
    status: 'partner' as const,
    href: 'https://www.mercadopago.com.ar/developers/es/docs',
  },
];

export function MercadoPagoPanel() {
  const [status, setStatus] = useState<MPStatus | null>(null);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingUpQR, setSettingUpQR] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    accessToken: '',
    publicKey: '',
    webhookSecret: '',
    environment: 'sandbox',
    externalPosId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, keysRes] = await Promise.all([
        fetch('/api/payments/mercadopago/status'),
        fetch('/api/config/api-keys'),
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (keysRes.ok) {
        const keys = await keysRes.json();
        const list = Array.isArray(keys) ? keys : keys.configs || [];
        const mp = list.find((c: { provider: string }) => c.provider?.toLowerCase() === 'mercadopago');
        setConfig(mp || null);
        const meta = mp?.metadata as MPIntegrationMetadata | undefined;
        setForm((f) => ({
          ...f,
          environment: mp?.environment || 'sandbox',
          externalPosId: meta?.externalPosId || '',
        }));
      }
    } catch {
      toast.error('Error al cargar MercadoPago');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata: MPIntegrationMetadata = {
        ...(status?.metadata || {}),
        externalPosId: form.externalPosId || undefined,
        enabledServices: status?.metadata?.enabledServices,
      };
      const res = await fetch('/api/config/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'mercadopago',
          accessToken: form.accessToken || undefined,
          publicKey: form.publicKey || undefined,
          webhookSecret: form.webhookSecret || undefined,
          environment: form.environment,
          metadata,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('MercadoPago guardado');
      setForm({ accessToken: '', publicKey: '', webhookSecret: '', environment: form.environment, externalPosId: form.externalPosId });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSetupQR = async () => {
    setSettingUpQR(true);
    try {
      const res = await fetch('/api/payments/mercadopago/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_setup' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || 'QR configurado');
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear sucursal/caja');
    } finally {
      setSettingUpQR(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar integración MercadoPago?')) return;
    const res = await fetch('/api/config/api-keys?provider=mercadopago', { method: 'DELETE' });
    if (res.ok) { toast.success('Eliminado'); load(); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const isConfigured = !!status?.configured;
  const isSandbox = status?.environment === 'sandbox' || form.environment === 'sandbox';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-7 h-7" /> Mercado Pago
            </h2>
            <p className="text-sky-100 mt-1 text-sm max-w-xl">
              Pagos online, QR presencial, webhooks y calidad de integración. Usá credenciales de{' '}
              <strong>prueba</strong> en desarrollo y <strong>producción</strong> solo en emitia.com.ar.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 text-sm flex items-center gap-1">
              <RefreshCw className="w-4 h-4" /> Actualizar
            </button>
            <a href={MP_PANEL} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-white text-sky-700 rounded-lg text-sm font-medium flex items-center gap-1">
              Panel MP <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isConfigured ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
            {isConfigured ? '● Conectado' : '○ Sin configurar'}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isSandbox ? 'bg-amber-400/30' : 'bg-white/20'}`}>
            {isSandbox ? 'Sandbox' : 'Producción'}
          </span>
          {status?.qrConfigured && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20">QR listo</span>
          )}
          {status?.webhook?.configured && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20">Webhook secret OK</span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Credenciales */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-600" /> Credenciales y ambiente
          </h3>
          <p className="text-sm text-slate-600">
            Copiá las credenciales de <strong>prueba</strong> desde el panel MP → Tu aplicación → Credenciales de prueba.
          </p>
          {(['accessToken', 'publicKey', 'webhookSecret'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {field === 'accessToken' ? 'Access Token' : field === 'publicKey' ? 'Public Key' : 'Webhook Secret'}
              </label>
              <div className="relative">
                <input
                  type={showSecrets[field] ? 'text' : 'password'}
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder={isConfigured ? '•••••••• (dejar vacío para no cambiar)' : `Ingresá ${field}`}
                  className="w-full px-3 py-2 pr-10 text-sm premium-input"
                />
                <button type="button" onClick={() => setShowSecrets((s) => ({ ...s, [field]: !s[field] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
                  {showSecrets[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Ambiente</label>
            <select value={form.environment} onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
              className="w-full px-3 py-2 text-sm premium-input">
              <option value="sandbox">Sandbox / Prueba (desarrollo y homologación)</option>
              <option value="production">Producción (solo HTTPS público)</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-sky-600 text-white rounded-xl font-medium text-sm hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar credenciales
            </button>
            {isConfigured && (
              <button onClick={handleDelete} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cuenta MP */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
          <h3 className="font-semibold text-slate-900">Cuenta vinculada</h3>
          {status?.account ? (
            <div className="text-sm space-y-2">
              <p><span className="text-slate-500">ID:</span> {status.account.id}</p>
              <p><span className="text-slate-500">Usuario:</span> {status.account.nickname}</p>
              {status.account.testUser && (
                <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">Cuenta de prueba</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{status?.accountError || 'Guardá credenciales válidas para validar la cuenta'}</p>
          )}
          <div className="pt-2 border-t text-sm">
            <p className="text-slate-500">Transacciones: <strong>{status?.stats?.transactions ?? 0}</strong></p>
            <p className="text-slate-500">Ventas pendientes MP: <strong>{status?.stats?.pendingSales ?? 0}</strong></p>
          </div>
          <a href={MP_TEST_USERS} target="_blank" rel="noopener noreferrer" className="text-sky-600 text-sm hover:underline flex items-center gap-1">
            Usuarios de prueba <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* QR */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <Store className="w-5 h-5 text-sky-600" /> QR presencial (sucursal y caja)
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Mercado Pago exige una sucursal y caja para QR. Podés crearlas automáticamente o pegar el <code className="bg-slate-100 px-1 rounded">external_pos_id</code> si ya las tenés.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-600 mb-1">External POS ID</label>
            <input value={form.externalPosId} onChange={(e) => setForm((f) => ({ ...f, externalPosId: e.target.value }))}
              placeholder="emitia-xxxxx-pos" className="w-full px-3 py-2 text-sm premium-input" />
          </div>
          <button onClick={handleAutoSetupQR} disabled={settingUpQR || !isConfigured}
            className="px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-sm font-medium hover:bg-sky-100 disabled:opacity-50 flex items-center gap-2">
            {settingUpQR ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
            Crear sucursal + caja
          </button>
        </div>
        {status?.qrConfigured ? (
          <p className="mt-3 text-sm text-green-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> QR habilitado en el POS</p>
        ) : (
          <p className="mt-3 text-sm text-amber-700 flex items-center gap-1"><XCircle className="w-4 h-4" /> Configurá la caja para cobrar con QR en el POS</p>
        )}
      </div>

      {/* Webhook */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
          <Webhook className="w-5 h-5 text-sky-600" /> Webhooks (producción)
        </h3>
        {status?.webhook?.publicRequired ? (
          <p className="text-sm text-amber-700">En localhost no se envía <code>notification_url</code>. El POS usa polling. En producción registrá:</p>
        ) : (
          <p className="text-sm text-slate-600">URL para el panel de Mercado Pago → Webhooks:</p>
        )}
        <code className="block mt-2 p-3 bg-slate-50 rounded-lg text-sm break-all">
          {status?.webhook?.url || 'https://emitia.com.ar/api/payments/mercadopago/webhook'}
        </code>
      </div>

      {/* Servicios */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Servicios Mercado Pago</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MP_SERVICES.map((svc) => {
            const Icon = svc.icon;
            const integrated = svc.status === 'integrated';
            return (
              <div key={svc.id} className={`p-4 rounded-xl border ${integrated ? 'border-sky-100 bg-sky-50/50' : 'border-slate-100'}`}>
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${integrated ? 'text-sky-600' : 'text-slate-400'}`} />
                  <div>
                    <p className="font-medium text-sm text-slate-900">{svc.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{svc.description}</p>
                    {integrated ? (
                      <span className="inline-block mt-2 text-xs text-green-700 font-medium">✓ En EMITIA</span>
                    ) : svc.href ? (
                      <a href={svc.href} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-xs text-sky-600 hover:underline">
                        Ver en Mercado Pago →
                      </a>
                    ) : (
                      <span className="inline-block mt-2 text-xs text-slate-400">Requiere programa MP</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calidad */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="font-semibold text-amber-900 mb-2">Calidad de integración (mín. {status?.quality?.minScore ?? 73} pts)</h3>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          {(status?.quality?.tips || []).map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
        <a href={MP_DOCS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm text-amber-900 font-medium hover:underline">
          Documentación Checkout Pro <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
