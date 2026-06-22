'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Building2, Phone, Mail, FileText, Truck, X, MapPin, Loader2, IdCard, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100/60 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Proveedores</p>
              <p className="text-xl font-bold text-slate-900">{suppliers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/60 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Órdenes de Compra</p>
              <p className="text-xl font-bold text-green-600">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100/60 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Con CUIT</p>
              <p className="text-xl font-bold text-purple-600">{suppliers.filter(s => s.cuit).length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="erp-panel p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, CUIT o contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 premium-input text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="erp-panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="space-y-4"><div className="skeleton-shimmer h-12 rounded-2xl" /><div className="skeleton-shimmer h-[300px] rounded-2xl" /></div>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay proveedores registrados</p>
            <p className="text-slate-400 text-sm mt-1">Agregá proveedores para gestionar tus compras</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Proveedor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">CUIT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Dirección</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Órdenes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-md bg-blue-50">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{supplier.name}</p>
                          {supplier.contactName && <p className="text-xs text-slate-400">{supplier.contactName}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {supplier.cuit ? (
                        <span className="text-sm text-slate-900 font-mono">{supplier.cuit}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {supplier.email && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />{supplier.email}
                          </p>
                        )}
                        {supplier.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{supplier.phone}
                          </p>
                        )}
                        {!supplier.email && !supplier.phone && <span className="text-xs text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {supplier.address ? (
                        <p className="text-xs text-slate-500 flex items-center gap-1 truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{supplier.address}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        (supplier._count?.purchaseOrders ?? 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {supplier._count?.purchaseOrders ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(supplier)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(supplier.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
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
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores
            </p>
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
