'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Building2, Phone, Mail, FileText, Truck, X, MapPin, Loader2, IdCard, CheckCircle2, AlertCircle, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell, ErpKpiBox } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  cuit?: string;
  notes?: string;
  _count?: { purchaseOrders: number };
}

export function ProveedoresClient() {
  const { userRole } = useErpSession();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [cuitSearching, setCuitSearching] = useState(false);
  const [cuitSearchResult, setCuitSearchResult] = useState<{ found: boolean; source?: string; message?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '', contactName: '', email: '', phone: '', address: '', cuit: '', notes: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // CUIT Lookup from AFIP for suppliers
  const searchCuit = useCallback(async (doc: string) => {
    const clean = doc.replace(/[-\s.]/g, '');
    if (clean.length < 7) return;

    setCuitSearching(true);
    setCuitSearchResult(null);
    try {
      // Use the same lookup API but without autoCreate (we don't want to create a customer)
      const res = await fetch(`/api/customers/lookup-document?document=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (data.found && data.customer) {
        setFormData(prev => ({
          ...prev,
          name: data.customer.name || prev.name,
          cuit: data.customer.document || clean,
          address: data.customer.address || prev.address,
        }));
        setCuitSearchResult({
          found: true,
          source: data.source,
          message: data.source === 'local'
            ? `Encontrado en tu base: ${data.customer.name}`
            : `Datos AFIP: ${data.customer.name} (${data.customer.taxCondition === 'responsable_inscripto' ? 'Resp. Inscripto' : data.customer.taxCondition === 'monotributista' ? 'Monotributista' : data.customer.taxCondition === 'exento' ? 'Exento' : 'Cons. Final'})`,
        });
        toast.success(`Datos encontrados: ${data.customer.name}`);
      } else if (data.suggestion) {
        setFormData(prev => ({ ...prev, cuit: data.suggestion.document }));
        setCuitSearchResult({ found: false, message: data.message || 'CUIT no encontrado. Completá los datos manualmente.' });
      } else if (data.error) {
        setCuitSearchResult({ found: false, message: data.error });
      }
    } catch (error) {
      console.error('Error searching CUIT:', error);
      toast.error('Error al consultar CUIT');
      setCuitSearchResult({ found: false, message: 'Error de conexión' });
    } finally {
      setCuitSearching(false);
    }
  }, []);

  const handleCuitChange = (value: string) => {
    setFormData(prev => ({ ...prev, cuit: value }));
    setCuitSearchResult(null);

    const clean = value.replace(/[-\s.]/g, '');
    if (clean.length === 11) {
      searchCuit(clean);
    }
  };

  const handleCuitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchCuit(formData.cuit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success(editingSupplier ? 'Proveedor actualizado' : 'Proveedor creado');
        closeModal();
        fetchSuppliers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      cuit: supplier.cuit || '',
      notes: supplier.notes || ''
    });
    setCuitSearchResult(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Proveedor eliminado');
        fetchSuppliers();
      } else {
        toast.error('Error al eliminar. Puede tener órdenes asociadas.');
      }
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setCuitSearchResult(null);
    setFormData({ name: '', contactName: '', email: '', phone: '', address: '', cuit: '', notes: '' });
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cuit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOrders = suppliers.reduce((sum, s) => sum + (s._count?.purchaseOrders ?? 0), 0);

  return (
    <ErpPageShell
      title="Proveedores"
      subtitle="Gestión de proveedores y órdenes de compra"
      module="GESTIÓN"
      userRole={userRole}
      onRefresh={fetchSuppliers}
      refreshing={loading}
      toolbar={[
        { label: 'Nuevo', icon: <Plus className="w-4 h-4" />, onClick: () => {
          setEditingSupplier(null);
          setFormData({ name: '', contactName: '', email: '', phone: '', address: '', cuit: '', notes: '' });
          setCuitSearchResult(null);
          setShowModal(true);
        }},
      ]}
    >
    <div className="space-y-2">
      {/* KPIs estilo ERP */}
      <div className="grid grid-cols-3 gap-2">
        <ErpKpiBox label="Total Proveedores" value={suppliers.length} accent="primary" />
        <ErpKpiBox label="Órdenes de Compra" value={totalOrders} />
        <ErpKpiBox label="Con CUIT" value={suppliers.filter(s => s.cuit).length} />
      </div>

      {/* Grilla de proveedores */}
      <div className="erp-panel">
        <div className="erp-panel-header flex items-center justify-between">
          <span>Lista de Proveedores</span>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5c7291]" />
            <input
              type="text"
              placeholder="Buscar…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="erp-input pl-6 w-48"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#5c7291] text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#5c7291]">
            <Building2 className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-xs">No hay proveedores. Presioná <strong>Nuevo</strong> para agregar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-grid-table">
              <thead>
                <tr>
                  <th>Razón Social / Proveedor</th>
                  <th className="w-32">CUIT</th>
                  <th>Contacto</th>
                  <th>Teléfono / Email</th>
                  <th>Dirección</th>
                  <th className="w-16 text-center">Órdenes</th>
                  <th className="w-16 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="cursor-pointer" onClick={() => handleEdit(supplier)}>
                    <td>
                      <span className="cell-text font-semibold">{supplier.name}</span>
                    </td>
                    <td><span className="cell-text font-mono text-[10px]">{supplier.cuit ?? '-'}</span></td>
                    <td><span className="cell-text">{supplier.contactName ?? '-'}</span></td>
                    <td>
                      <div className="px-2 py-0.5 text-[11px]">
                        {supplier.email && <div>{supplier.email}</div>}
                        {supplier.phone && <div className="text-[#5c7291]">{supplier.phone}</div>}
                        {!supplier.email && !supplier.phone && '-'}
                      </div>
                    </td>
                    <td><span className="cell-text">{supplier.address ?? '-'}</span></td>
                    <td className="text-center">
                      <span className={`text-[11px] font-bold ${(supplier._count?.purchaseOrders ?? 0) > 0 ? 'text-green-700' : 'text-[#5c7291]'}`}>
                        {supplier._count?.purchaseOrders ?? 0}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }}
                          className="erp-toolbtn p-0.5" title="Editar">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }}
                          className="erp-toolbtn p-0.5 text-red-500 hover:text-red-700" title="Eliminar">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filteredSuppliers.length > 0 && (
          <div className="erp-grid-footer">
            Mostrando {filteredSuppliers.length} de {suppliers.length} proveedor(es)
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-xl">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* CUIT Smart Search */}
              <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  Buscar por CUIT
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Ingresá el CUIT del proveedor..."
                      value={formData.cuit}
                      onChange={(e) => handleCuitChange(e.target.value)}
                      onKeyDown={handleCuitKeyDown}
                      className="w-full px-4 py-2.5 premium-input border-blue-300 text-sm font-mono pr-10"
                    />
                    {cuitSearching && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => searchCuit(formData.cuit)}
                    disabled={cuitSearching || !formData.cuit}
                    className="px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium text-sm"
                  >
                    <Search className="w-4 h-4" />
                    Buscar
                  </button>
                </div>

                {/* Search result feedback */}
                {cuitSearchResult && (
                  <div className={`mt-2.5 flex items-start gap-2 text-xs p-2 rounded-lg ${
                    cuitSearchResult.found
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {cuitSearchResult.found ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-600" />
                    )}
                    <span>{cuitSearchResult.message}</span>
                  </div>
                )}

                {!cuitSearchResult && !cuitSearching && (
                  <p className="mt-1.5 text-xs text-blue-500">
                    Se busca en tu base de datos y en ARCA/AFIP automáticamente
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de empresa *</label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 premium-input text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contacto</label>
                    <input type="text" value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full px-3 py-2 premium-input text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">CUIT</label>
                    <input type="text" value={formData.cuit} readOnly
                      className="w-full px-3 py-2 border border-slate-100/60 rounded-xl bg-slate-50 text-sm font-mono cursor-not-allowed" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                    <input type="tel" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 premium-input text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 premium-input text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                  <input type="text" value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 premium-input text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                  <textarea value={formData.notes} rows={2}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 premium-input text-sm" />
                </div>
                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={closeModal}
                    className="flex-1 px-4 py-2.5 border border-slate-100/60 rounded-xl font-medium text-sm hover:bg-slate-50 transition">Cancelar</button>
                  <button type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition">
                    {editingSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </ErpPageShell>
  );
}
