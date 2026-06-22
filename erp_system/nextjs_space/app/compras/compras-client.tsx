'use client';

import { useEffect, useState } from 'react';
import { Plus, Truck, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

interface Product {
  id: string;
  name: string;
  sku: string;
  cost: number;
  stock: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: Supplier;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  expectedDate?: string;
  items: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
    product: Product;
  }>;
}

export function ComprasClient() {
  const { userRole } = useErpSession();
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([]);
  const [notes, setNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/suppliers'),
        fetch('/api/products')
      ]);

      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...orderItems];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value as string,
        unitCost: product?.cost || 0
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setOrderItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || orderItems.length === 0) {
      toast.error('Seleccioná un proveedor y agregá productos');
      return;
    }

    const validItems = orderItems.filter(item => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Agrega al menos un producto válido');
      return;
    }

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          items: validItems,
          notes,
          expectedDate: expectedDate || null
        })
      });

      if (res.ok) {
        toast.success('Orden de compra creada');
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear orden');
      }
    } catch (error) {
      toast.error('Error al crear orden');
    }
  };

  const handleReceive = async (id: string) => {
    if (!confirm('¿Confirmar recepción de mercadería? Se actualizará el stock.')) return;
    
    try {
      const res = await fetch(`/api/purchases/${id}/receive`, { method: 'POST' });
      if (res.ok) {
        toast.success('Mercadería recibida - Stock actualizado');
        fetchData();
      } else {
        toast.error('Error al recibir mercadería');
      }
    } catch (error) {
      toast.error('Error al recibir mercadería');
    }
  };

  const resetForm = () => {
    setSelectedSupplier('');
    setOrderItems([]);
    setNotes('');
    setExpectedDate('');
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      received: 'Recibida',
      cancelled: 'Cancelada'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const orderTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  if (loading) {
    return (
      <ErpPageShell
        title="Órdenes de Compra"
        subtitle="Gestión de compras y recepción de mercadería"
        module="GESTIÓN"
        userRole={userRole}
        statusText="Cargando"
      >
        <div className="flex items-center justify-center py-16">
          <div className="space-y-4"><div className="skeleton-shimmer h-12 rounded-2xl" /><div className="skeleton-shimmer h-[400px] rounded-2xl" /></div>
        </div>
      </ErpPageShell>
    );
  }

  return (
    <ErpPageShell
      title="Órdenes de Compra"
      subtitle="Gestión de compras y recepción de mercadería"
      module="GESTIÓN"
      userRole={userRole}
      onRefresh={fetchData}
      toolbar={[
        { label: 'Nueva', icon: <Plus className="w-4 h-4" />, onClick: () => { resetForm(); setShowModal(true); } },
      ]}
    >
        {/* Orders List */}
        <div className="erp-panel p-2 space-y-4">
          {purchases.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Truck className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-slate-500">
                      {order.supplier.name} • {new Date(order.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">${order.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                    <p className="text-xs text-slate-500">{order.items.length} productos</p>
                  </div>
                  {expandedId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedId === order.id && (
                <div className="border-t px-4 py-4 bg-slate-50">
                  <table className="w-full text-sm mb-4">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="pb-2">Producto</th>
                        <th className="pb-2 text-center">Cantidad</th>
                        <th className="pb-2 text-right">Costo Unit.</th>
                        <th className="pb-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100">
                          <td className="py-2">
                            <span className="font-medium">{item.product.name}</span>
                            <span className="text-slate-500 ml-2">({item.product.sku})</span>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">${item.unitCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                          <td className="text-right">${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                      Subtotal: ${order.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })} | 
                      IVA: ${order.tax.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceive(order.id);
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        <CheckCircle size={18} />
                        Recibir Mercadería
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {purchases.length === 0 && (
            <div className="text-center py-12">
              <Truck className="mx-auto text-slate-300" size={48} />
              <p className="mt-4 text-slate-500">No hay órdenes de compra</p>
            </div>
          )}
        </div>

        {/* Modal Nueva Orden */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Nueva Orden de Compra</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Proveedor *
                      </label>
                      <select
                        required
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="w-full px-3 py-2 premium-input"
                      >
                        <option value="">Seleccionar...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Fecha esperada
                      </label>
                      <input
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className="w-full px-3 py-2 premium-input"
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-slate-700">Productos</label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        + Agregar producto
                      </button>
                    </div>
                    <div className="space-y-2">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="">Seleccionar producto...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-2 border rounded-lg text-sm text-center"
                            placeholder="Cant."
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => handleItemChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="w-28 px-3 py-2 border rounded-lg text-sm text-right"
                            placeholder="Costo"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {orderItems.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${orderTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>IVA (21%):</span>
                        <span>${(orderTotal * 0.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                        <span>Total:</span>
                        <span>${(orderTotal * 1.21).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 premium-input"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-slate-100/60 rounded-xl hover:bg-slate-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/20 transition"
                    >
                      Crear Orden
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </ErpPageShell>
  );
}
