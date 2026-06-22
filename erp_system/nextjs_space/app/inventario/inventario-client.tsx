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
  category?: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

export function InventarioClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'ADMIN';
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
    setFormData({ name: '', sku: '', barcode: '', price: '', cost: '', stock: '', minStock: '10', categoryId: '' });
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded-xl">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                className="w-full px-3 py-2 premium-input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SKU *</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required
                className="w-full px-3 py-2 premium-input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 premium-input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Costo</label>
              <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-2 premium-input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio Venta *</label>
              <input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required
                className="w-full px-3 py-2 premium-input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock</label>
              <input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 premium-input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
              <input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3 py-2 premium-input text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 premium-input text-sm">
                <option value="">Sin categoría</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>
            {formData.cost && formData.price && (
              <div className="flex items-end">
                <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg w-full text-center">
                  <p className="text-xs text-green-600">Margen</p>
                  <p className="text-lg font-bold text-green-700">
                    {((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.cost) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
            <div className="lg:col-span-4 flex gap-3 justify-end pt-2">
              <button type="button" onClick={resetForm}
                className="px-5 py-2 border border-slate-100/60 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors">Cancelar</button>
              <button type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                {editingProduct ? 'Actualizar' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="space-y-4"><div className="skeleton-shimmer h-12 rounded-2xl" /><div className="skeleton-shimmer h-[300px] rounded-2xl" /></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay productos</p>
            <p className="text-slate-400 text-sm mt-1">Agregá tu primer producto con el botón de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Costo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Precio</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Margen</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock > 0 && product.stock <= product.minStock;
                  const isOutOfStock = product.stock <= 0;
                  const margin = getMargin(product.price, product.cost);
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md ${isOutOfStock ? 'bg-red-50' : isLowStock ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                            <Package className={`w-4 h-4 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-500' : 'text-blue-500'}`} />
                          </div>
                          <span className="font-medium text-slate-900 text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">{product.sku}</td>
                      <td className="px-4 py-3">
                        {product.category ? (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">{product.category.name}</span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-right">
                        ${product.cost?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 text-right">
                        ${product.price?.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {margin ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            parseFloat(margin) >= 30 ? 'bg-green-100 text-green-700' :
                            parseFloat(margin) >= 15 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {margin}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isOutOfStock ? 'bg-red-100 text-red-700' :
                            isLowStock ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {product.stock}
                          </span>
                          {(isLowStock || isOutOfStock) && (
                            <AlertTriangle className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-red-500' : 'text-yellow-500'}`} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
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
        {/* Results count */}
        {!loading && filteredProducts.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">
              Mostrando {filteredProducts.length} de {products.length} productos
              {totalValue > 0 && (
                <> • Valor total en stock: <span className="font-medium">${totalValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span></>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
    </ErpPageShell>
  );
}
