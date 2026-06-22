'use client';

import { ReactNode, useState } from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';
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

export function ErpAppChrome({
  title,
  subtitle,
  module = 'EMITIA',
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
      {/* Title bar */}
      <div className="erp-titlebar flex items-center gap-2 px-2 sm:px-3 py-1.5 shrink-0">
        <ErpModuleNavToggle onClick={() => setMobileNavOpen(!mobileNavOpen)} open={mobileNavOpen} />
        <Link href="/dashboard" className="hidden sm:flex items-center gap-1.5 shrink-0 pr-2 border-r border-white/20">
          <div className="w-6 h-6 bg-white/15 border border-white/25 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[11px] font-bold tracking-wide hidden md:inline">EMITIA</span>
        </Link>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-semibold truncate">{title}</span>
          {subtitle && <span className="block text-[10px] font-normal opacity-75 truncate">{subtitle}</span>}
        </div>
        <ErpTitleActions />
      </div>

      <ErpModuleNav mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      {showMenubar && (
        <div className="erp-menubar flex items-center justify-between gap-2 px-3 py-1 shrink-0">
          <div className="flex gap-1">
            <span>Archivo</span>
            <span>Edición</span>
            <span>Ver</span>
            <span>Informes</span>
          </div>
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

      <div className="erp-statusbar flex items-center justify-between px-3 py-1 shrink-0">
        <div className="flex gap-4 min-w-0">
          <span>{module}</span>
          <span className="truncate">{statusText}</span>
          {statusExtra}
        </div>
        <div className="flex gap-4 shrink-0">
          <span>{userRole}</span>
          <span>{new Date().toLocaleDateString('es-AR')}</span>
        </div>
      </div>
    </div>
  );
}
