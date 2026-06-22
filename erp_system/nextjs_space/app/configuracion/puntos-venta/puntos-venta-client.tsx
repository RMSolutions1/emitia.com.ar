'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Edit2, 
  Trash2,
  Hash,
  CheckCircle,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ErpPageShell } from '@/components/erp/erp-page-shell';
import { useErpSession } from '@/components/erp/use-erp-session';

export function PuntosVentaClient() {
  const { userRole } = useErpSession();
  const [businessConfig, setBusinessConfig] = useState<any>(null);
  const [sequences, setSequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configRes, seqRes] = await Promise.all([
        fetch('/api/config/business'),
        fetch('/api/config/sequences'),
      ]);
      
      const configData = await configRes.json();
      setBusinessConfig(configData);

      if (seqRes.ok) {
        const seqData = await seqRes.json();
        setSequences(seqData.sequences || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ErpPageShell title="Puntos de Venta" module="CONFIGURACIÓN" userRole={userRole}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </ErpPageShell>
    );
  }

  const defaultPOS = businessConfig?.defaultPOS || 1;

  return (
    <ErpPageShell
      title="Puntos de Venta"
      subtitle="Administre los puntos de venta y numeración de comprobantes"
      module="CONFIGURACIÓN"
      userRole={userRole}
      onRefresh={fetchData}
    >
    <div className="space-y-6">
      {/* Default POS Card */}
      <div className="erp-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            Punto de Venta Predeterminado
          </h3>
          <span className="text-4xl font-mono font-bold text-blue-600">
            {defaultPOS.toString().padStart(4, '0')}
          </span>
        </div>
        
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-1">Próxima Factura</div>
            <div className="text-lg font-mono font-bold">
              {defaultPOS.toString().padStart(4, '0')}-{(businessConfig?.nextInvoiceNum || 1).toString().padStart(8, '0')}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-1">Próximo Ticket</div>
            <div className="text-lg font-mono font-bold">
              T{defaultPOS.toString().padStart(4, '0')}-{(businessConfig?.nextTicketNum || 1).toString().padStart(8, '0')}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-sm text-slate-600 mb-1">Estado</div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Activo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sequences by Document Type */}
      <div className="erp-panel p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Hash className="w-5 h-5 text-blue-600" />
          Secuencias por Tipo de Documento
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Punto de Venta</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Próximo Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Próximo Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sequences.length > 0 ? sequences.map((seq) => (
                <tr key={seq.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-medium">{seq.documentCode}</td>
                  <td className="px-4 py-3">
                    {seq.documentCode === '001' ? 'Factura A' :
                     seq.documentCode === '006' ? 'Factura B' :
                     seq.documentCode === '011' ? 'Factura C' :
                     seq.documentCode}
                  </td>
                  <td className="px-4 py-3 font-mono">{seq.pointOfSale.toString().padStart(4, '0')}</td>
                  <td className="px-4 py-3 font-mono">{seq.nextNumber}</td>
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {seq.pointOfSale.toString().padStart(4, '0')}-{seq.nextNumber.toString().padStart(8, '0')}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Las secuencias se crearán automáticamente al emitir el primer comprobante de cada tipo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-medium text-blue-800 mb-2">Información sobre Puntos de Venta</h4>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• El Punto de Venta es un número de 4 dígitos que identifica el origen de los comprobantes</li>
          <li>• Cada tipo de documento (Factura A, B, C, etc.) mantiene su propia numeración correlativa</li>
          <li>• El formato estándar es PPPP-NNNNNNNN (ej: 0001-00000001)</li>
          <li>• Para usar múltiples puntos de venta, debe habilitarlos en AFIP</li>
        </ul>
      </div>
    </div>
    </ErpPageShell>
  );
}
