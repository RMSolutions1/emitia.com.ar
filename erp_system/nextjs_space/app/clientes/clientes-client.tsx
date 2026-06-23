'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search, Plus, Save, Trash2, Users, Loader2,
  IdCard, CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell, ErpKpiBox } from '@/components/erp/erp-page-shell';

/* ─────────────── Tipos ─────────────── */
interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  documentType?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  taxCondition?: string;
  notes?: string;
  website?: string;
}

const EMPTY_FORM: Omit<Customer, 'id'> = {
  name: '', email: '', phone: '', document: '', documentType: 'CUIT',
  address: '', city: '', province: '', postalCode: '', taxCondition: 'consumidor_final',
  notes: '', website: '',
};

const TAX_LABELS: Record<string, string> = {
  responsable_inscripto: 'Resp. Inscripto',
  monotributista: 'Monotributista',
  consumidor_final: 'Consumidor Final',
  exento: 'Exento',
};

const PROVINCIAS = [
  'Buenos Aires','CABA','Catamarca','Chaco','Chubut','Córdoba','Corrientes',
  'Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones',
  'Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe',
  'Santiago del Estero','Tierra del Fuego','Tucumán',
];

/* ─────────────── Campo de formulario ERP ─────────────── */
function EF({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span > 1 ? `col-span-${span}` : ''}>
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-[#5c7291] mb-0.5">{label}</label>
      {children}
    </div>
  );
}

/* ─────────────── Componente principal ─────────────── */
export function ClientesClient() {
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'ADMIN';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<Customer, 'id'>>(EMPTY_FORM);

  const [cuitSearching, setCuitSearching] = useState(false);
  const [cuitMsg, setCuitMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /* ──── fetch ──── */
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/customers${params}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch { /* silencioso */ } finally { setLoading(false); }
  }, [searchTerm]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  /* ──── selección ──── */
  const selectCustomer = (c: Customer) => {
    setSelectedId(c.id);
    setIsNew(false);
    setCuitMsg(null);
    setForm({
      name: c.name ?? '', email: c.email ?? '', phone: c.phone ?? '',
      document: c.document ?? '', documentType: c.documentType ?? 'CUIT',
      address: c.address ?? '', city: c.city ?? '', province: c.province ?? '',
      postalCode: c.postalCode ?? '', taxCondition: c.taxCondition ?? 'consumidor_final',
      notes: c.notes ?? '', website: c.website ?? '',
    });
  };

  const handleNew = () => {
    setSelectedId(null);
    setIsNew(true);
    setCuitMsg(null);
    setForm(EMPTY_FORM);
  };

  /* ──── CUIT lookup ──── */
  const lookupCuit = useCallback(async (doc: string) => {
    const clean = doc.replace(/[-\s.]/g, '');
    if (clean.length < 7) return;
    setCuitSearching(true); setCuitMsg(null);
    try {
      const res = await fetch(`/api/customers/lookup-document?document=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.found && data.customer) {
        setForm(prev => ({
          ...prev,
          name: data.customer.name || prev.name,
          document: data.customer.document || clean,
          documentType: data.customer.documentType || prev.documentType,
          address: data.customer.address || prev.address,
          city: data.customer.city || prev.city,
          province: data.customer.province || prev.province,
          taxCondition: data.customer.taxCondition || prev.taxCondition,
        }));
        setCuitMsg({ ok: true, text: data.source === 'local' ? 'Encontrado en base local' : 'Datos de ARCA/AFIP' });
      } else {
        setCuitMsg({ ok: false, text: data.message || 'No encontrado en padrón' });
      }
    } catch { setCuitMsg({ ok: false, text: 'Error al consultar CUIT' }); }
    finally { setCuitSearching(false); }
  }, []);

  const handleDocChange = (val: string) => {
    setForm(prev => ({ ...prev, document: val }));
    setCuitMsg(null);
    const clean = val.replace(/[-\s.]/g, '');
    if (clean.length === 11) lookupCuit(clean);
    else if (clean.length >= 7 && clean.length <= 8)
      setForm(prev => ({ ...prev, documentType: 'DNI' }));
  };

  /* ──── guardar ──── */
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const url = isNew ? '/api/customers' : `/api/customers/${selectedId}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) {
        const saved: Customer = await res.json();
        toast.success(isNew ? 'Cliente creado' : 'Cliente actualizado');
        await fetchCustomers();
        selectCustomer(saved);
      } else {
        const err = await res.json();
        toast.error(err?.error ?? 'Error al guardar');
      }
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  /* ──── eliminar ──── */
  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      const res = await fetch(`/api/customers/${selectedId}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Cliente eliminado'); setSelectedId(null); setIsNew(false); setForm(EMPTY_FORM); fetchCustomers(); }
      else toast.error('Error al eliminar. El cliente puede tener ventas asociadas.');
    } catch { toast.error('Error al eliminar'); }
  };

  /* ──── stats ──── */
  const total = customers.length;
  const riCount = customers.filter(c => c.taxCondition === 'responsable_inscripto').length;
  const monoCount = customers.filter(c => c.taxCondition === 'monotributista').length;
  const cfCount = customers.filter(c => c.taxCondition === 'consumidor_final' || !c.taxCondition).length;
  const showPanel = isNew || !!selectedId;

  return (
    <ErpPageShell
      title="Clientes"
      subtitle="Padrón de clientes — consulta CUIT/CUIL en ARCA"
      module="GESTIÓN"
      statusText={`${total} cliente(s)${selectedId ? ' · 1 seleccionado' : ''}`}
      userRole={userRole}
      onRefresh={fetchCustomers}
      refreshing={loading}
      toolbar={[
        { label: 'Nuevo', icon: <Plus className="w-4 h-4" />, onClick: handleNew },
        { label: 'Guardar', icon: saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />, onClick: handleSave, disabled: !showPanel || saving },
        { label: 'Eliminar', icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, disabled: !selectedId },
        { label: 'Actualizar', icon: <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />, onClick: fetchCustomers },
      ]}
    >
      <div className="space-y-2">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <ErpKpiBox label="Total clientes" value={total} accent="primary" />
          <ErpKpiBox label="Resp. Inscripto" value={riCount} />
          <ErpKpiBox label="Monotributistas" value={monoCount} />
          <ErpKpiBox label="Consumidor Final" value={cfCount} />
        </div>

        {/* Layout master-detail */}
        <div className={`grid gap-2 ${showPanel ? 'grid-cols-1 xl:grid-cols-[1fr_420px]' : 'grid-cols-1'}`}>

          {/* ── GRILLA MASTER ── */}
          <div className="erp-panel">
            <div className="erp-panel-header flex items-center justify-between">
              <span>Lista de Clientes</span>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5c7291]" />
                <input
                  type="text"
                  placeholder="Buscar…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="erp-input pl-6 w-48"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-[#5c7291] text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
                </div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#5c7291]">
                  <Users className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-xs">No hay clientes. Presioná <strong>Nuevo</strong> para agregar.</p>
                </div>
              ) : (
                <table className="erp-grid-table">
                  <thead>
                    <tr>
                      <th>Razón Social / Nombre</th>
                      <th>Documento</th>
                      <th>Cond. IVA</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Localidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => (
                      <tr
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        data-selected={selectedId === c.id ? 'true' : undefined}
                        className="cursor-pointer"
                      >
                        <td className="px-2 py-1">{c.name}</td>
                        <td className="px-2 py-1 font-mono text-[11px]">
                          {c.document ? `${c.documentType ?? 'CUIT'}: ${c.document}` : '-'}
                        </td>
                        <td className="px-2 py-1">
                          {TAX_LABELS[c.taxCondition ?? ''] ?? 'Cons. Final'}
                        </td>
                        <td className="px-2 py-1">{c.phone ?? '-'}</td>
                        <td className="px-2 py-1">{c.email ?? '-'}</td>
                        <td className="px-2 py-1">
                          {[c.city, c.province].filter(Boolean).join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {!loading && customers.length > 0 && (
              <div className="erp-statusbar flex items-center justify-between px-2 py-0.5 text-[10px]">
                <span>{customers.length} registro(s)</span>
                {selectedId && <span>Reg. seleccionado: {customers.find(c => c.id === selectedId)?.name}</span>}
              </div>
            )}
          </div>

          {/* ── PANEL DETALLE / FORMULARIO ── */}
          {showPanel && (
            <div className="erp-panel">
              <div className="erp-panel-header flex items-center justify-between">
                <span>{isNew ? 'NUEVO CLIENTE' : 'DATOS DEL CLIENTE'}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={handleSave} disabled={saving} className="erp-btn-primary text-[10px] px-2 py-0.5 flex items-center gap-1">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Guardar
                  </button>
                  {!isNew && (
                    <button type="button" onClick={handleDelete} className="erp-btn-secondary text-[10px] px-2 py-0.5 flex items-center gap-1 text-red-600 border-red-300 hover:bg-red-50">
                      <Trash2 className="w-3 h-3" /> Eliminar
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2 space-y-3">

                {/* Sección: Identificación CUIT */}
                <fieldset className="border border-[#b8c9dc] px-2 pb-2 pt-0">
                  <legend className="text-[10px] font-bold text-[#2563ad] uppercase px-1 -mt-0.5">
                    Identificación Fiscal
                  </legend>
                  <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1.5 items-center pt-1">
                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Tipo Doc.</label>
                    <select className="erp-input" value={form.documentType} onChange={e => setForm(p => ({ ...p, documentType: e.target.value }))}>
                      <option value="CUIT">CUIT</option>
                      <option value="CUIL">CUIL</option>
                      <option value="DNI">DNI</option>
                      <option value="PASAPORTE">Pasaporte</option>
                    </select>

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Nº Documento</label>
                    <div className="flex gap-1">
                      <input className="erp-input flex-1 font-mono" placeholder="20-12345678-9"
                        value={form.document} onChange={e => handleDocChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && lookupCuit(form.document ?? '')} />
                      <button type="button" onClick={() => lookupCuit(form.document ?? '')}
                        disabled={cuitSearching || !form.document}
                        className="erp-btn-primary px-1.5 disabled:opacity-40" title="Consultar ARCA/AFIP">
                        {cuitSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <IdCard className="w-3 h-3" />}
                      </button>
                    </div>

                    {cuitMsg && (
                      <div className={`col-span-2 flex items-center gap-1 text-[10px] px-2 py-1 border ${
                        cuitMsg.ok ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'
                      }`}>
                        {cuitMsg.ok ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
                        {cuitMsg.text}
                      </div>
                    )}

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Cond. IVA</label>
                    <select className="erp-input" value={form.taxCondition} onChange={e => setForm(p => ({ ...p, taxCondition: e.target.value }))}>
                      <option value="consumidor_final">Consumidor Final</option>
                      <option value="responsable_inscripto">Responsable Inscripto</option>
                      <option value="monotributista">Monotributista</option>
                      <option value="exento">IVA Exento</option>
                      <option value="sujeto_no_categorizado">No Categorizado</option>
                    </select>
                  </div>
                </fieldset>

                {/* Sección: Datos Generales */}
                <fieldset className="border border-[#b8c9dc] px-2 pb-2 pt-0">
                  <legend className="text-[10px] font-bold text-[#2563ad] uppercase px-1 -mt-0.5">
                    Datos Generales
                  </legend>
                  <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1.5 items-center pt-1">
                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Razón Social *</label>
                    <input className="erp-input" placeholder="Nombre o razón social"
                      value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Teléfono</label>
                    <input className="erp-input" placeholder="+54 11 1234-5678"
                      value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Email</label>
                    <input className="erp-input" type="email" placeholder="contacto@empresa.com"
                      value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Sitio Web</label>
                    <input className="erp-input" placeholder="https://www.empresa.com"
                      value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} />
                  </div>
                </fieldset>

                {/* Sección: Domicilio */}
                <fieldset className="border border-[#b8c9dc] px-2 pb-2 pt-0">
                  <legend className="text-[10px] font-bold text-[#2563ad] uppercase px-1 -mt-0.5">
                    Domicilio Comercial
                  </legend>
                  <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1.5 items-center pt-1">
                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Dirección</label>
                    <input className="erp-input" placeholder="Av. Corrientes 1234"
                      value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Localidad</label>
                    <input className="erp-input" placeholder="Ciudad / Localidad"
                      value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Provincia</label>
                    <select className="erp-input" value={form.province} onChange={e => setForm(p => ({ ...p, province: e.target.value }))}>
                      <option value="">— Seleccionar —</option>
                      {PROVINCIAS.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                    </select>

                    <label className="text-[10px] text-[#5c7291] font-semibold text-right">Cód. Postal</label>
                    <input className="erp-input w-28" placeholder="C1043"
                      value={form.postalCode} onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))} />
                  </div>
                </fieldset>

                {/* Sección: Observaciones */}
                <fieldset className="border border-[#b8c9dc] px-2 pb-2 pt-0">
                  <legend className="text-[10px] font-bold text-[#2563ad] uppercase px-1 -mt-0.5">
                    Observaciones
                  </legend>
                  <textarea
                    rows={3}
                    className="erp-input w-full mt-1 resize-none"
                    placeholder="Notas internas sobre el cliente…"
                    value={form.notes}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  />
                </fieldset>

              </div>
            </div>
          )}
        </div>
      </div>
    </ErpPageShell>
  );
}
