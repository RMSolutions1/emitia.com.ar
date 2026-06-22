import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="bg-[#0f172a] text-slate-400">
      <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-bold">E</div>
            <span className="text-white font-bold text-lg">EMITIA</span>
          </div>
          <p className="text-sm leading-relaxed max-w-md">
            Sistema de gestión comercial para PyMEs argentinas. Ventas, stock, facturación ARCA y tesorería en la nube.
          </p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Funcionalidades</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/caracteristicas" className="hover:text-white">Facturación electrónica</Link></li>
            <li><Link href="/caracteristicas" className="hover:text-white">Punto de venta</Link></li>
            <li><Link href="/caracteristicas" className="hover:text-white">Control de stock</Link></li>
            <li><Link href="/precios" className="hover:text-white">Precios</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3 text-sm">Accesos rápidos</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-white">Iniciar sesión</Link></li>
            <li><Link href="/registro" className="hover:text-white">Crear cuenta</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} EMITIA — Hecho en Argentina
      </div>
    </footer>
  );
}
