'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle, DollarSign, TrendingUp, BarChart3, Filter, X, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell, ErpKpiBox } from '@/components/erp/erp-page-shell';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  active: boolean;
  brand?: string;
  unit?: string;
  description?: string;
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

export function InventarioClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'ADMIN';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '10',
    categoryId: '',
    brand: '',
    unit: 'unidad',
    description: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data ?? []);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data ?? []);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const filteredProducts = (products ?? []).filter((p) => {
    const matchesSearch = !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category?.id === categoryFilter;
    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'low' && p.stock <= p.minStock && p.stock > 0) ||
      (stockFilter === 'out' && p.stock <= 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Stats
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const totalRetailValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
        resetForm();
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error?.error ?? 'Error al guardar producto');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name ?? '',
      sku: product.sku ?? '',
      barcode: product.barcode ?? '',
      price: product.price?.toString() ?? '',
      cost: product.cost?.toString() ?? '',
      stock: product.stock?.toString() ?? '',
      minStock: product.minStock?.toString() ?? '10',
      categoryId: product.category?.id ?? '',
      brand: product.brand ?? '',
      unit: product.unit ?? 'unidad',
      description: product.description ?? '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Producto eliminado');
        fetchProducts();
      } else {
        toast.error('Error al eliminar producto');
      }
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({ name: '', sku: '', barcode: '', price: '', cost: '', stock: '', minStock: '10', categoryId: '', brand: '', unit: 'unidad', description: '' });
  };

  const getMargin = (price: number, cost: number) => {
    if (!cost || cost === 0) return null;
    return ((price - cost) / cost * 100).toFixed(1);
  };

  return (
    <ErpPageShell
      title="Inventario"
      subtitle="Productos, stock y valorización"
      module="GESTIÓN"
      statusText={`${totalProducts} producto(s)`}
      userRole={userRole}
      onRefresh={fetchProducts}
      refreshing={loading}
      toolbar={[
        { label: 'Nuevo', icon: <Plus className="w-4 h-4" />, onClick: () => { setShowForm(true); setEditingProduct(null); } },
        { label: 'Importar', icon: <Sparkles className="w-4 h-4" />, onClick: () => router.push('/inventario/importar') },
        { label: 'Buscar', icon: <Search className="w-4 h-4" />, onClick: () => document.getElementById('inventario-search')?.focus() },
      ]}
    >
    <div className="space-y-2">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <ErpKpiBox label="Productos" value={totalProducts} accent="primary" />
        <ErpKpiBox label="Stock bajo" value={lowStockCount} accent="warning" />
        <ErpKpiBox label="Sin stock" value={outOfStockCount} />
        <ErpKpiBox label="Valor costo" value={'$' + totalValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })} />
        <ErpKpiBox label="Valor venta" value={'$' + totalRetailValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })} accent="success" />
      </div>

      {/* Search & Filters */}
      <div className="erp-panel">
        <div className="erp-panel-header"><span>Filtros</span></div>
        <div className="p-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#5c7291] w-4 h-4" />
            <input
              id="inventario-search"
              type="text"
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="erp-input w-full pl-8"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 border border-slate-100/60 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2.5 border border-slate-100/60 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todo el stock</option>
            <option value="low">⚠️ Stock bajo</option>
            <option value="out">❌ Sin stock</option>
          </select>
        </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="erp-panel">
          <div className="erp-panel-header flex items-center justify-between">
            <span>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</span>
            <button onClick={resetForm} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Fila 1: Nombre, SKU, Código de barras, Marca */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Nombre / Descripción *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                className="erp-input w-full" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">SKU *</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required
                className="erp-input w-full font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Marca</label>
              <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Ej: Weber, Klaukol…"
                className="erp-input w-full" />
            </div>
            {/* Fila 2: Cód. barras, Unidad, Categoría, Proveedor */}
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Código de Barras</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="erp-input w-full font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Unidad de Medida</label>
              <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="erp-input w-full">
                {['unidad', 'kg', 'g', 'bolsa', 'm', 'm²', 'm³', 'litro', 'caja', 'par', 'rollo', 'paquete', 'bidón', 'lata'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Categoría</label>
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="erp-input w-full">
                <option value="">Sin categoría</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Descripción adicional</label>
              <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Especificaciones, medidas…"
                className="erp-input w-full" />
            </div>
            {/* Fila 3: Precios y stock */}
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Costo ($)</label>
              <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="erp-input w-full text-right font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Precio Venta ($) *</label>
              <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required
                className="erp-input w-full text-right font-mono font-bold" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Stock Actual</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="erp-input w-full text-right font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#4a5a8c] mb-0.5 uppercase">Stock Mínimo</label>
              <input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="erp-input w-full text-right font-mono" />
            </div>
            {formData.cost && formData.price && parseFloat(formData.cost) > 0 && (
              <div className="lg:col-span-4 flex items-center gap-3 bg-[#e8f4ea] border border-[#a8d4ae] px-3 py-1.5">
                <span className="text-xs text-[#2a5c2a] font-bold">Margen:</span>
                <span className="text-lg font-black text-[#1e7c1e]">
                  {((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.cost) * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-[#4a8c4a]">sobre costo</span>
              </div>
            )}
            <div className="lg:col-span-4 flex gap-2 justify-end pt-2 border-t border-[#b8c4dc]">
              <button type="button" onClick={resetForm} className="erp-btn-secondary text-xs px-4 py-1.5">Cancelar</button>
              <button type="submit"
                className="erp-btn-primary text-xs px-6 py-1.5">
                {editingProduct ? 'Actualizar' : 'Crear Producto'}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* Products Table — estilo Dragonfish */}
      <div className="erp-panel">
        <div className="erp-panel-header">Artículos / Productos</div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#5c7291] text-xs gap-2">
            <Package className="w-4 h-4 animate-pulse" /> Cargando…
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#5c7291]">
            <Package className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-xs">No hay productos. Presioná <strong>Nuevo</strong> para agregar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-grid-table">
              <thead>
                <tr>
                  <th>Producto / Descripción</th>
                  <th className="w-24">Cód. / SKU</th>
                  <th className="w-20">Unidad</th>
                  <th className="w-24">Marca</th>
                  <th className="w-28">Categoría</th>
                  <th className="w-24 text-right">Costo</th>
                  <th className="w-24 text-right">Precio</th>
                  <th className="w-16 text-center">Margen</th>
                  <th className="w-20 text-center">Stock</th>
                  <th className="w-16 text-center">Estado</th>
                  <th className="w-16 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                  const isOutOfStock = product.stock <= 0;
                  const margin = getMargin(product.price, product.cost);
                  return (
                    <tr key={product.id} className="cursor-pointer" onClick={() => handleEdit(product)}>
                      <td>
                        <div className="px-2 py-0.5">
                          <div className="font-medium text-[11px] text-[#1a2a4c]">{product.name}</div>
                          {product.description && <div className="text-[9px] text-[#5c7291] truncate">{product.description}</div>}
                        </div>
                      </td>
                      <td><span className="cell-text font-mono text-[10px]">{product.sku}</span></td>
                      <td><span className="cell-text text-[10px]">{product.unit ?? 'unidad'}</span></td>
                      <td><span className="cell-text text-[10px]">{product.brand ?? '-'}</span></td>
                      <td><span className="cell-text">{product.category?.name ?? '-'}</span></td>
                      <td className="text-right pr-2 font-mono text-[11px]">
                        ${product.cost?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-right pr-2 font-mono text-[11px] font-bold">
                        ${product.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-center">
                        <span className={`text-[10px] font-bold px-1.5 ${
                          !margin ? 'text-[#5c7291]' :
                          parseFloat(margin) >= 30 ? 'text-green-700' :
                          parseFloat(margin) >= 15 ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>{margin ? `${margin}%` : '-'}</span>
                      </td>
                      <td className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-[11px] font-bold ${
                            isOutOfStock ? 'text-red-600' :
                            isLowStock ? 'text-yellow-600' :
                            'text-green-700'
                          }`}>{product.stock}</span>
                          {(isLowStock || isOutOfStock) && (
                            <AlertTriangle className={`w-3 h-3 ${isOutOfStock ? 'text-red-500' : 'text-yellow-500'}`} />
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={`text-[10px] font-bold ${product.active ? 'text-green-700' : 'text-[#5c7291]'}`}>
                          {product.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                            className="erp-toolbtn p-0.5" title="Editar">
                            <Edit className="w-3 h-3" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                            className="erp-toolbtn p-0.5 text-red-500 hover:text-red-700" title="Eliminar">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Pie de grilla */}
        {!loading && filteredProducts.length > 0 && (
          <div className="erp-grid-footer">
            Mostrando {filteredProducts.length} de {products.length} artículo(s)
            {totalValue > 0 && (
              <> · Valor total en stock: <strong>${totalValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</strong></>
            )}
          </div>
        )}
      </div>
    </div>
    </ErpPageShell>
  );
}
