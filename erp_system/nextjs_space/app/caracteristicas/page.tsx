import Link from 'next/link';
import {
  FileText,
  Package,
  Users,
  Landmark,
  Bot,
  ShoppingCart,
  ArrowRight,
} from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export const metadata = {
  title: 'Características — EMITIA Facturación ARCA',
  description: 'Funcionalidades de facturación electrónica, gestión y tesorería para Argentina.',
};

const modules = [
  {
    icon: FileText,
    title: 'Facturación electrónica',
    items: ['Facturas A, B, C, E y MiPyME', 'CAE y código QR automático', 'Notas de crédito/débito', 'Remitos y tickets', 'Facturas recurrentes'],
  },
  {
    icon: ShoppingCart,
    title: 'Punto de venta',
    items: ['POS rápido con stock', 'Múltiples medios de pago', 'Impresión de comprobantes', 'Sincronización con inventario'],
  },
  {
    icon: Package,
    title: 'Inventario',
    items: ['Catálogo de productos', 'Importación con IA', 'Alertas de stock mínimo', 'Listas de precios'],
  },
  {
    icon: Users,
    title: 'Clientes y ventas',
    items: ['Padrón y consulta CUIT', 'Cuentas corrientes', 'Presupuestos', 'Historial de ventas'],
  },
  {
    icon: Landmark,
    title: 'Tesorería',
    items: ['Cajas y bancos', 'Cheques', 'Libro IVA', 'Reportes financieros'],
  },
  {
    icon: Bot,
    title: 'Inteligencia artificial',
    items: ['Contador IA (consultas fiscales)', 'OCR de comprobantes', 'Importación inteligente de documentos'],
  },
];

export default function CaracteristicasPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-[#0e1a35] mb-4">Todo lo que necesitás en un solo lugar</h1>
          <p className="text-[#5c7291] text-lg max-w-2xl mx-auto">
            EMITIA combina facturación ARCA con gestión comercial, financiera e inteligencia artificial.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {modules.map(({ icon: Icon, title, items }) => (
            <div key={title} className="rounded-2xl border border-slate-100 p-8 hover:border-[#625bf6]/30 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-[#625bf6]/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#625bf6]" />
                </div>
                <h2 className="text-xl font-bold text-[#0e1a35]">{title}</h2>
              </div>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="text-sm text-[#5c7291] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#56cbdb]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center rounded-2xl bg-[#625bf6]/5 border border-[#625bf6]/20 p-10">
          <h2 className="text-2xl font-black text-[#0e1a35] mb-3">Probá EMITIA sin cargo</h2>
          <p className="text-[#5c7291] mb-6">Creá tu cuenta y empezá a facturar en minutos.</p>
          <Link href="/registro" className="btn-tf-primary inline-flex items-center gap-2">
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
