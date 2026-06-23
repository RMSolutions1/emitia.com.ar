'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ChevronDown, Menu, X, Zap, LayoutDashboard, FileSpreadsheet, Package, Landmark, Sparkles, Settings, Shield, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { buildErpNavSections, type ErpNavItem, type ErpNavSection } from '@/lib/erp-navigation';

const SECTION_ICONS: Record<string, LucideIcon> = {
  'Inicio': LayoutDashboard,
  'Facturación': FileSpreadsheet,
  'Gestión': Package,
  'Finanzas': Landmark,
  'IA': Sparkles,
  'Config': Settings,
  'Empresa': Building2,
  'Admin': Shield,
};

function isActive(pathname: string, item: ErpNavItem): boolean {
  if (item.href) return pathname === item.href || pathname.startsWith(`${item.href}/`);
  if (item.children) return item.children.some((c) => c.href && (pathname === c.href || pathname.startsWith(`${c.href}/`)));
  return false;
}

function NavDropdown({
  section,
  pathname,
  onNavigate,
}: {
  section: ErpNavSection;
  pathname: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sectionActive = section.items.some((item) => isActive(pathname, item));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const renderLink = (item: ErpNavItem, depth = 0) => {
    if (item.children?.length) {
      return (
        <div key={item.name} className="py-1">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5c7291]">{item.name}</p>
          {item.children.map((child) => renderLink(child, depth + 1))}
        </div>
      );
    }
    if (!item.href) return null;
    const Icon = item.icon;
    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => {
          setOpen(false);
          onNavigate?.();
        }}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs ${
          active ? 'bg-[#2563ad] text-white' : 'text-[#1a3a5c] hover:bg-[#eef3f9]'
        }`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {item.name}
      </Link>
    );
  };

  return (
    <div ref={ref} className="relative">
      {(() => {
        const SectionIcon = SECTION_ICONS[section.label];
        return (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="true"
            className={`erp-module-tab ${sectionActive ? 'erp-module-tab-active' : ''}`}
          >
            {SectionIcon && <SectionIcon className="w-3 h-3 shrink-0" />}
            {section.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        );
      })()}
      {open && (
        <div className="erp-module-dropdown">
          {section.items.map((item) => renderLink(item))}
        </div>
      )}
    </div>
  );
}

export function ErpModuleNav({ mobileOpen, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || 'user';
  const sections = useMemo(() => buildErpNavSections(userRole), [userRole]);

  return (
    <>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={onCloseMobile} aria-hidden />
      )}
      <nav
        className={`erp-module-nav flex items-center gap-0.5 px-2 shrink-0 ${
          mobileOpen
            ? 'fixed left-0 top-[4.5rem] bottom-0 w-64 z-50 flex-col items-stretch overflow-y-auto py-2 bg-[#eef3f9] border-r border-[#b8c9dc]'
            : 'hidden lg:flex overflow-visible'
        }`}
      >
        {mobileOpen && (
          <div className="flex items-center justify-between px-3 pb-2 border-b border-[#b8c9dc] mb-2 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#2563ad] flex items-center justify-center border border-[#1e4d8c]">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-[#1a3a5c]">Módulos</span>
            </div>
            <button type="button" onClick={onCloseMobile} className="erp-toolbtn p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {sections.map((section) => (
          <div key={section.label} className={mobileOpen ? 'w-full px-1' : ''}>
            {mobileOpen ? (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5c7291]">{section.label}</p>
                {section.items.flatMap((item) => {
                  const leaves = (item.children?.length
                    ? item.children.filter((c): c is ErpNavItem & { href: string } => !!c.href)
                    : item.href
                      ? [item as ErpNavItem & { href: string }]
                      : []);
                  return leaves.map((leaf) => {
                    const Icon = leaf.icon;
                    const active = pathname === leaf.href || pathname.startsWith(`${leaf.href}/`);
                    return (
                      <Link
                        key={leaf.href}
                        href={leaf.href}
                        onClick={onCloseMobile}
                        className={`flex items-center gap-2 px-3 py-2 text-xs ${active ? 'bg-[#2563ad] text-white' : 'text-[#1a3a5c] hover:bg-white'}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {leaf.name}
                      </Link>
                    );
                  });
                })}
              </div>
            ) : (
              <NavDropdown section={section} pathname={pathname} />
            )}
          </div>
        ))}
      </nav>
    </>
  );
}

export function ErpModuleNavToggle({ onClick, open }: { onClick: () => void; open: boolean }) {
  return (
    <button type="button" onClick={onClick} className="lg:hidden erp-titlebar-btn" title="Módulos">
      {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
    </button>
  );
}
