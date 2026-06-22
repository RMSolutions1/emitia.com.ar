import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Package,
  FileText,
  ShoppingCart,
  Quote,
} from 'lucide-react';
import { MarketingHeader } from './marketing-header';
import { MarketingFooter } from './marketing-footer';

const logos = ['PyME Norte', 'Comercio Sur', 'Distribuidora AR', 'Retail Express', 'Indumentaria BA', 'Ferretería Plus'];

const features = [
  {
    icon: ShoppingCart,
    title: 'Sistema POS y ventas unificadas',
    bullets: [
      'Registrá ventas y emití facturas electrónicas al instante.',
      'Mantené tu stock actualizado en todos los depósitos.',
      'Controlá compras, gastos y pagos en un solo lugar.',
      'Integrá MercadoPago y sincronizá cobros.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Gestión de stock y finanzas',
    bullets: [
      'Controlá ingresos y egresos para mejorar tus finanzas.',
      'Libro IVA y reportes exportables a Excel.',
      'Dashboard en tiempo real para tomar decisiones.',
      'Multi-empresa con roles y permisos.',
    ],
  },
];

const testimonials = [
  {
    quote: 'Excelente ERP. Lo usamos para stock, POS, compras, ventas y facturas automáticas con CAE. Ahorra mucho tiempo.',
    author: 'Emmanuel S.',
    role: 'Comercio minorista',
  },
  {
    quote: 'Súper conforme con EMITIA. El sistema es robusto, fácil de usar y el soporte responde rápido.',
    author: 'Diego B.',
    role: 'Distribuidor',
  },
  {
    quote: 'Lo utilizo a diario para tomar decisiones. Muy fácil de usar y con ayuda cuando la necesitás.',
    author: 'Patricia C.',
    role: 'Dueña de negocio',
  },
];

export function HomeLanding() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      {/* Hero — estilo Dux */}
      <section className="dux-hero-gradient border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-[#2563eb] uppercase tracking-wider mb-3">
              Sistema de Gestión Comercial
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-[#0f172a] leading-tight mb-6">
              El sistema de gestión que ordena tu negocio
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Hacé tu gestión más simple centralizando ventas, facturación ARCA, stock, tesorería
              y números de tu negocio en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/registro" className="dux-btn-primary">
                Crear cuenta ahora
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="dux-btn-outline">
                Iniciar sesión
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-blue-500/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-slate-800">Panel EMITIA</span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">ARCA OK</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { l: 'Ventas hoy', v: '$ 842.300' },
                  { l: 'Facturas', v: '128' },
                  { l: 'Stock bajo', v: '5 ítems' },
                  { l: 'Cobranzas', v: '$ 210.000' },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs text-slate-500">{k.l}</p>
                    <p className="text-lg font-bold text-[#0f172a]">{k.v}</p>
                  </div>
                ))}
              </div>
              <div className="h-32 rounded-xl bg-gradient-to-r from-[#2563eb]/10 to-[#3b82f6]/5 flex items-end p-4 gap-2">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 bg-[#2563eb] rounded-t opacity-80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos clientes */}
      <section className="py-10 border-b border-slate-100 bg-slate-50/50">
        <p className="text-center text-sm text-slate-500 mb-6">Más de 500 empresas confían en EMITIA</p>
        <div className="max-w-5xl mx-auto px-4 flex flex-wrap justify-center gap-8 opacity-70">
          {logos.map((name) => (
            <span key={name} className="text-sm font-bold text-slate-400 uppercase tracking-wide">{name}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="soluciones" className="py-20">
        <div className="max-w-6xl mx-auto px-4 space-y-20">
          {features.map(({ icon: Icon, title, bullets }, idx) => (
            <div key={title} className={`grid lg:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'lg:direction-rtl' : ''}`}>
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#2563eb]" />
                </div>
                <h2 className="text-3xl font-bold text-[#0f172a] mb-4">{title}</h2>
                <ul className="space-y-3">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link href="/caracteristicas" className="inline-flex items-center gap-1 mt-6 text-[#2563eb] font-semibold hover:underline">
                  Explorar herramientas <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className={`rounded-2xl bg-gradient-to-br from-[#eff6ff] to-white border border-slate-100 h-64 flex items-center justify-center ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                <Icon className="w-24 h-24 text-[#2563eb]/20" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Funcionalidades grid */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#0f172a] mb-10">Todo lo que necesita tu comercio</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText, t: 'Facturación ARCA' },
              { icon: ShoppingCart, t: 'Punto de venta' },
              { icon: Package, t: 'Control de stock' },
              { icon: BarChart3, t: 'Informes' },
            ].map(({ icon: Icon, t }) => (
              <div key={t} className="bg-white rounded-xl p-5 border border-slate-100 hover:border-[#2563eb]/30 transition-colors">
                <Icon className="w-8 h-8 text-[#2563eb] mb-3" />
                <p className="font-semibold text-[#0f172a]">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#0f172a] mb-12">Lo que dicen nuestros clientes</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, author, role }) => (
              <div key={author} className="rounded-2xl border border-slate-100 p-6 bg-white shadow-sm">
                <Quote className="w-8 h-8 text-[#2563eb]/30 mb-4" />
                <p className="text-slate-600 text-sm leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
                <p className="font-semibold text-[#0f172a]">{author}</p>
                <p className="text-xs text-slate-500">{role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0f172a] text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Automatizá la gestión de tu comercio</h2>
          <p className="text-slate-300 mb-8">Probá EMITIA desde $31.500 + IVA el primer mes. Sin permanencia.</p>
          <Link href="/registro" className="dux-btn-primary bg-[#2563eb] hover:bg-[#1d4ed8]">
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
