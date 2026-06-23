'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ErpModuleNav, ErpModuleNavToggle } from './erp-module-nav';
import { ErpTitleActions } from './erp-title-actions';

export interface ErpAppChromeProps {
  title: string;
  subtitle?: string;
  module?: string;
  statusText?: string;
  userRole?: string;
  showMenubar?: boolean;
  menubarExtra?: ReactNode;
  toolbar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  statusExtra?: ReactNode;
  children: ReactNode;
}

function EmpresaBrand() {
  const { data: session } = useSession();
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [cuit, setCuit] = useState<string | null>(null);

  // Try session first (fast), then API fallback
  useEffect(() => {
    const nameFromSession = (session?.user as any)?.companyName;
    if (nameFromSession) {
      setBusinessName(nameFromSession);
    }
    // Always try API to get CUIT
    fetch('/api/config/business')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          if (data.businessName) setBusinessName(data.businessName);
          if (data.cuit) setCuit(data.cuit);
        }
      })
      .catch(() => {});
  }, [session]);

  const displayName = businessName || 'Mi Empresa';

  return (
    <Link
      href="/dashboard"
      className="hidden sm:flex items-center gap-2 shrink-0 pr-3 border-r border-white/20 min-w-0 max-w-[220px] group"
    >
      <div className="w-7 h-7 bg-white/15 border border-white/30 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
        <Building2 className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0 hidden md:block">
        <p className="text-[11px] font-bold tracking-wide text-white truncate leading-tight">{displayName}</p>
        {cuit && (
          <p className="text-[9px] text-white/65 font-mono leading-tight">{cuit}</p>
        )}
      </div>
    </Link>
  );
}

function StatusClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono tabular-nums">{time}</span>;
}

export function ErpAppChrome({
  title,
  subtitle,
  module = 'FACTURACIÓN',
  statusText = 'Listo',
  userRole = 'ADMIN',
  showMenubar = true,
  menubarExtra,
  toolbar,
  header,
  footer,
  statusExtra,
  children,
}: ErpAppChromeProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="erp-window min-h-screen flex flex-col bg-[#dce6f2]">
      {/* ── Title bar ── */}
      <div className="erp-titlebar flex items-center gap-2 px-2 sm:px-3 py-1.5 shrink-0">
        {/* Izquierda: toggle móvil + marca */}
        <div className="flex items-center gap-2 shrink-0">
          <ErpModuleNavToggle onClick={() => setMobileNavOpen(!mobileNavOpen)} open={mobileNavOpen} />
          <EmpresaBrand />
        </div>

        {/* Centro: buscador global centrado */}
        <ErpTitleActions centered />

        {/* Derecha: título de página actual */}
        <div className="hidden md:block min-w-0 shrink-0 text-right max-w-[180px] xl:max-w-[240px]">
          <span className="block text-[11px] font-bold truncate leading-tight text-white/90">{title}</span>
          {subtitle && <span className="block text-[9px] font-normal opacity-60 truncate leading-tight">{subtitle}</span>}
        </div>
      </div>

      <ErpModuleNav mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      {showMenubar && menubarExtra && (
        <div className="erp-menubar flex items-center justify-end gap-2 px-3 py-1 shrink-0">
          {menubarExtra}
        </div>
      )}

      {toolbar && (
        <div className="erp-toolbar flex flex-wrap items-center gap-1 px-2 py-1.5 shrink-0">
          {toolbar}
        </div>
      )}

      {header && (
        <div className="erp-header bg-[#eef3f9] border-b border-[#b8c9dc] p-3 shrink-0">
          {header}
        </div>
      )}

      <div className="erp-body flex-1 overflow-auto p-2 min-h-0">{children}</div>

      {footer}

      {/* ── Status bar con reloj en tiempo real ── */}
      <div className="erp-statusbar flex items-center justify-between px-3 py-1 shrink-0">
        <div className="flex gap-3 min-w-0 items-center">
          <span className="font-semibold uppercase tracking-wider">{module}</span>
          <span className="text-white/60">|</span>
          <span className="truncate opacity-80">{statusText}</span>
          {statusExtra}
        </div>
        <div className="flex gap-3 shrink-0 items-center">
          <span className="opacity-75">{userRole}</span>
          <span className="text-white/60">|</span>
          <span className="opacity-75">{new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          <span className="text-white/60">|</span>
          <StatusClock />
        </div>
      </div>
    </div>
  );
}
