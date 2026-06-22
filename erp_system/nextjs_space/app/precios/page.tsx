import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export const metadata = {
  title: 'Precios — EMITIA Sistema de Gestión',
  description: 'Planes de gestión comercial y facturación ARCA para PyMEs.',
};

const plans = [
  {
    name: 'Starter',
    price: '$31.500',
    period: '+ IVA / mes',
    desc: 'Ideal para comenzar',
    features: ['Hasta 100 comprobantes/mes', '1 usuario', 'POS básico', 'Facturación ARCA', 'Soporte email'],
  },
  {
    name: 'Gestión',
    price: '$59.900',
    period: '+ IVA / mes',
    desc: 'El más elegido por comercios',
    featured: true,
    features: ['Comprobantes ilimitados', '5 usuarios', 'POS + inventario', 'Libro IVA', 'MercadoPago', 'Contador IA'],
  },
  {
    name: 'Empresa',
    price: '$99.900',
    period: '+ IVA / mes',
    desc: 'Multi-sucursal y contadores',
    features: ['Todo ilimitado', 'Multi-empresa', 'Admin central', 'API', 'Soporte prioritario'],
  },
];

export default function PreciosPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-[#0f172a] mb-4">Planes para tu comercio</h1>
          <p className="text-slate-600 text-lg">Probá el sistema completo desde $31.500 + IVA el primer mes.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-8 border flex flex-col ${
                plan.featured ? 'border-[#2563eb] shadow-xl ring-2 ring-[#2563eb]/20' : 'border-slate-200'
              }`}
            >
              {plan.featured && <span className="text-xs font-bold text-[#2563eb] uppercase mb-2">Recomendado</span>}
              <h2 className="text-2xl font-bold text-[#0f172a]">{plan.name}</h2>
              <p className="text-sm text-slate-500 mt-1 mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-3xl font-black text-[#2563eb]">{plan.price}</span>
                <span className="text-slate-500 text-sm ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#2563eb] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/registro" className={plan.featured ? 'dux-btn-primary text-center' : 'dux-btn-outline text-center'}>
                Empezar
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/registro" className="dux-btn-primary inline-flex items-center gap-2">
            Crear cuenta <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
