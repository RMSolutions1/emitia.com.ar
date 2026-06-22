'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Trash2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MercadoPagoPanel } from '@/components/integraciones/mercadopago-panel';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

const OTHER_INTEGRATIONS = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pagos internacionales con tarjetas de crédito',
    icon: '💳',
    color: 'bg-purple-500',
    fields: ['secretKey', 'publicKey'],
    docsUrl: 'https://stripe.com/docs'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Pagos con cuenta PayPal y tarjetas',
    icon: '🌐',
    color: 'bg-yellow-500',
    fields: ['clientId', 'secretKey'],
    docsUrl: 'https://developer.paypal.com/docs'
  },
];

export function IntegracionesClient() {
  const { userRole } = useErpSession();
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/config/api-keys');
      const data = await res.json();
      const configMap: Record<string, any> = {};
      const configs = Array.isArray(data) ? data : (data.configs || []);
      configs.forEach((config: any) => {
        configMap[config.provider.toLowerCase()] = config;
      });
      setConfigs(configMap);
    } catch (error) {
      console.error('Error fetching configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (integrationId: string) => {
    setSaving(integrationId);
    try {
      const data = formData[integrationId] || {};
      const res = await fetch('/api/config/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: integrationId,
          ...data,
          environment: data.environment || 'sandbox',
        }),
      });

      if (res.ok) {
        toast.success('Configuración guardada');
        fetchConfigs();
        setFormData(prev => ({ ...prev, [integrationId]: {} }));
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm('¿Está seguro de eliminar esta integración?')) return;

    try {
      const res = await fetch(`/api/config/api-keys?provider=${integrationId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Integración eliminada');
        fetchConfigs();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar integración');
    }
  };

  const updateFormData = (integrationId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [integrationId]: {
        ...(prev[integrationId] || {}),
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <ErpPageShell title="Integraciones" module="CONFIGURACIÓN" userRole={userRole}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ErpPageShell>
    );
  }

  return (
    <ErpPageShell
      title="Integraciones"
      subtitle="Conecta con servicios externos de pago y facturación"
      module="CONFIGURACIÓN"
      userRole={userRole}
      onRefresh={fetchConfigs}
    >
    <div className="space-y-8">
      <MercadoPagoPanel />

      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Otras integraciones</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-blue-700 text-sm">
            Las credenciales se almacenan encriptadas. Usá sandbox antes de producción.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {OTHER_INTEGRATIONS.map((integration) => {
            const config = configs[integration.id];
            const isConfigured = !!config;
            const data = formData[integration.id] || {};

            return (
              <div
                key={integration.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-100/60 overflow-hidden"
              >
                <div className={`${integration.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <h3 className="font-bold">{integration.name}</h3>
                        <p className="text-sm opacity-90">{integration.description}</p>
                      </div>
                    </div>
                    {isConfigured ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <XCircle className="w-6 h-6 opacity-50" />
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {integration.fields.map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">{field}</label>
                      <div className="relative">
                        <input
                          type={showSecrets[`${integration.id}-${field}`] ? 'text' : 'password'}
                          value={data[field] || ''}
                          onChange={(e) => updateFormData(integration.id, field, e.target.value)}
                          placeholder={isConfigured ? '••••••••' : 'Ingrese ' + field}
                          className="w-full px-3 py-2 pr-10 text-sm premium-input"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecrets(prev => ({
                            ...prev,
                            [`${integration.id}-${field}`]: !prev[`${integration.id}-${field}`]
                          }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showSecrets[`${integration.id}-${field}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleSave(integration.id)}
                      disabled={saving === integration.id}
                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Guardar
                    </button>
                    {isConfigured && (
                      <button onClick={() => handleDelete(integration.id)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-xl">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </ErpPageShell>
  );
}
