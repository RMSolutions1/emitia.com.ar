'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Warehouse,
  Plus,
  MapPin,
  Phone,
  Star,
  RefreshCw,
  Package,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

type Branch = {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  isDefault: boolean;
  isActive: boolean;
  warehouses?: WarehouseItem[];
  _count?: { posPoints: number };
};

type WarehouseItem = {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  isActive: boolean;
  branch?: { id: string; name: string; code: string } | null;
  _count?: { stockLevels: number };
};

type MigrationStatus = {
  products: number;
  stockLevels: number;
  pendingMigration: boolean;
  warehouse?: { id: string; name: string; code: string } | null;
};

const emptyBranchForm = {
  code: '',
  name: '',
  address: '',
  city: '',
  province: '',
  phone: '',
  isDefault: false,
};

const emptyWarehouseForm = {
  code: '',
  name: '',
  branchId: '',
  isDefault: false,
};

export function OrganizacionClient() {
  const { userRole } = useErpSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [migration, setMigration] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingBranch, setSavingBranch] = useState(false);
  const [savingWarehouse, setSavingWarehouse] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [branchForm, setBranchForm] = useState(emptyBranchForm);
  const [warehouseForm, setWarehouseForm] = useState(emptyWarehouseForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchesRes, warehousesRes, migrationRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/warehouses'),
        fetch('/api/inventory/migrate-stock'),
      ]);

      if (branchesRes.ok) setBranches(await branchesRes.json());
      if (warehousesRes.ok) setWarehouses(await warehousesRes.json());
      if (migrationRes.ok) setMigration(await migrationRes.json());
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar organización');
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!branchForm.name.trim()) {
      toast.error('El nombre de la sucursal es requerido');
      return;
    }
    setSavingBranch(true);
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear sucursal');
      toast.success('Sucursal creada');
      setBranchForm(emptyBranchForm);
      setShowBranchForm(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear sucursal');
    } finally {
      setSavingBranch(false);
    }
  };

  const createWarehouse = async () => {
    if (!warehouseForm.name.trim()) {
      toast.error('El nombre del depósito es requerido');
      return;
    }
    setSavingWarehouse(true);
    try {
      const res = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...warehouseForm,
          branchId: warehouseForm.branchId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear depósito');
      toast.success('Depósito creado');
      setWarehouseForm(emptyWarehouseForm);
      setShowWarehouseForm(false);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear depósito');
    } finally {
      setSavingWarehouse(false);
    }
  };

  const runMigration = async () => {
    setMigrating(true);
    try {
      const res = await fetch('/api/inventory/migrate-stock', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al migrar stock');
      toast.success(`Migrados ${data.migrated} productos al depósito principal`);
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al migrar stock');
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <ErpPageShell title="Organización" module="CONFIGURACIÓN" userRole={userRole}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ErpPageShell>
    );
  }

  return (
    <ErpPageShell
      title="Organización"
      subtitle="Sucursales, depósitos e inventario multi-ubicación"
      module="CONFIGURACIÓN"
      userRole={userRole}
      onRefresh={loadData}
    >
    <div className="space-y-6">
      {migration?.pendingMigration && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900">Migración de stock pendiente</h3>
              <p className="text-sm text-amber-800 mt-1">
                Tenés {migration.products} productos y {migration.stockLevels} registros por depósito.
                Migrá el stock al depósito principal ({migration.warehouse?.name || 'Principal'}) para habilitar inventario multi-depósito.
              </p>
            </div>
          </div>
          <button
            onClick={runMigration}
            disabled={migrating}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
          >
            {migrating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Migrar stock
          </button>
        </div>
      )}

      {/* Sucursales */}
      <div className="erp-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Sucursales
          </h2>
          <button
            onClick={() => setShowBranchForm(!showBranchForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva sucursal
          </button>
        </div>

        {showBranchForm && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 grid md:grid-cols-2 gap-4">
            <input
              placeholder="Nombre *"
              value={branchForm.name}
              onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
              className="premium-input px-3 py-2"
            />
            <input
              placeholder="Código (opcional)"
              value={branchForm.code}
              onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
              className="premium-input px-3 py-2 font-mono"
            />
            <input
              placeholder="Dirección"
              value={branchForm.address}
              onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
              className="premium-input px-3 py-2 md:col-span-2"
            />
            <input
              placeholder="Ciudad"
              value={branchForm.city}
              onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
              className="premium-input px-3 py-2"
            />
            <input
              placeholder="Provincia"
              value={branchForm.province}
              onChange={(e) => setBranchForm({ ...branchForm, province: e.target.value })}
              className="premium-input px-3 py-2"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={branchForm.isDefault}
                onChange={(e) => setBranchForm({ ...branchForm, isDefault: e.target.checked })}
              />
              Marcar como sucursal principal
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={createBranch}
                disabled={savingBranch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Guardar sucursal
              </button>
              <button
                onClick={() => { setShowBranchForm(false); setBranchForm(emptyBranchForm); }}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ubicación</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Depósitos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-sm">{branch.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{branch.name}</span>
                      {branch.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <Star className="h-3 w-3" /> Principal
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {[branch.city, branch.province].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">{branch.warehouses?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {branch.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
              {branches.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No hay sucursales configuradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depósitos */}
      <div className="erp-panel p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-blue-600" />
            Depósitos
          </h2>
          <button
            onClick={() => setShowWarehouseForm(!showWarehouseForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo depósito
          </button>
        </div>

        {showWarehouseForm && (
          <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 grid md:grid-cols-2 gap-4">
            <input
              placeholder="Nombre *"
              value={warehouseForm.name}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
              className="premium-input px-3 py-2"
            />
            <input
              placeholder="Código (opcional)"
              value={warehouseForm.code}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })}
              className="premium-input px-3 py-2 font-mono"
            />
            <select
              value={warehouseForm.branchId}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, branchId: e.target.value })}
              className="premium-input px-3 py-2 md:col-span-2"
            >
              <option value="">Sin sucursal asignada</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={warehouseForm.isDefault}
                onChange={(e) => setWarehouseForm({ ...warehouseForm, isDefault: e.target.checked })}
              />
              Marcar como depósito principal
            </label>
            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={createWarehouse}
                disabled={savingWarehouse}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Guardar depósito
              </button>
              <button
                onClick={() => { setShowWarehouseForm(false); setWarehouseForm(emptyWarehouseForm); }}
                className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {warehouses.map((wh) => (
            <div key={wh.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">{wh.name}</span>
                    {wh.isDefault && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">Principal</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 font-mono mt-1">{wh.code}</p>
                  {wh.branch && (
                    <p className="text-sm text-slate-600 mt-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {wh.branch.name}
                    </p>
                  )}
                </div>
                <span className="text-sm text-slate-500">
                  {wh._count?.stockLevels ?? 0} productos
                </span>
              </div>
            </div>
          ))}
          {warehouses.length === 0 && (
            <div className="md:col-span-2 text-center py-8 text-slate-500">
              No hay depósitos configurados
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h4 className="font-medium text-blue-900 mb-2">Organización multi-sucursal</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Cada empresa puede tener varias sucursales y depósitos</li>
          <li>• El stock se gestiona por depósito; el total del producto es la suma de todos</li>
          <li>• Al registrar una cuenta nueva se crean sucursal Central, depósito Principal y POS 1</li>
        </ul>
      </div>
    </div>
    </ErpPageShell>
  );
}
