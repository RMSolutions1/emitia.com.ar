'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const nav = [
  { href: '/#soluciones', label: 'Soluciones' },
  { href: '/caracteristicas', label: 'Funcionalidades' },
  { href: '/precios', label: 'Precios' },
  { href: '/caracteristicas', label: 'Recursos' },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100">
      <div className="bg-[#0f172a] text-white text-center text-sm py-2 px-4">
        Probá el sistema completo desde <strong>$31.500 + IVA</strong> el primer mes →{' '}
        <Link href="/registro" className="underline hover:text-blue-200">Empezar hoy</Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[#2563eb] flex items-center justify-center text-white font-black">E</div>
          <div>
            <span className="font-bold text-[#0f172a] text-lg leading-none">EMITIA</span>
            <p className="text-[10px] text-slate-500">Sistema de Gestión Comercial</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-700">
          {nav.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="hover:text-[#2563eb] transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-[#2563eb]">
            Iniciar sesión
          </Link>
          <Link href="/registro" className="dux-btn-primary text-sm py-2.5 px-5">
            Crear cuenta
          </Link>
        </div>

        <button type="button" className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menú">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t px-4 py-4 space-y-3 bg-white">
          {nav.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="block py-2 font-medium" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="block py-2" onClick={() => setOpen(false)}>Iniciar sesión</Link>
          <Link href="/registro" className="dux-btn-primary block text-center" onClick={() => setOpen(false)}>Crear cuenta</Link>
        </div>
      )}
    </header>
  );
}
