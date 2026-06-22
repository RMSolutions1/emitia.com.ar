'use client';

import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STEPS = [
  { id: 'afip', label: 'Enlazar con ARCA (ex AFIP)', href: '/configuracion/afip' },
  { id: 'business', label: 'Completar datos del negocio', href: '/configuracion' },
  { id: 'products', label: 'Cargar productos o servicios', href: '/inventario' },
  { id: 'customers', label: 'Agregar tu primer cliente', href: '/clientes' },
  { id: 'invoice', label: 'Emitir tu primera factura', href: '/facturacion/emitir' },
];

export function SetupChecklist() {
  const [dismissed, setDismissed] = useState(false);
  const [afipOk, setAfipOk] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('emitia-setup-dismissed') === '1') {
      setDismissed(true);
    }
    fetch('/api/afip/status')
      .then((r) => r.json())
      .then((d) => setAfipOk(!!d.configured || d.status?.appServer === 'OK'))
      .catch(() => setAfipOk(false));
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('emitia-setup-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div className="erp-panel mb-2 relative">
      <div className="erp-panel-header flex items-center justify-between pr-2">
        <span>Asistente de configuración inicial</span>
        <button
          type="button"
          onClick={handleDismiss}
          className="erp-toolbtn p-1"
          aria-label="Ocultar guía"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2">
        <p className="text-[11px] text-[#5c7291] mb-2">Completá estos pasos para empezar a facturar legalmente.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
          {STEPS.map((step, index) => {
            const done = step.id === 'afip' && afipOk;
            return (
              <Link
                key={step.id}
                href={step.href}
                className="flex items-center gap-2 border border-[#b8c9dc] bg-white px-2 py-2 hover:border-[#2563ad] hover:bg-[#eef3f9] transition-colors"
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-[#2563ad] shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-[10px] text-[#5c7291] uppercase">Paso {index + 1}</p>
                  <p className="text-[11px] font-semibold text-[#1a3a5c] truncate">{step.label}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#9bb3cc] ml-auto shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
