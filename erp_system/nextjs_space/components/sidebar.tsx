'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  FileText,
  Building2,
  Truck,
  BarChart3,
  CreditCard,
  Settings,
  Receipt,
  Wallet,
  FileCheck,
  Tags,
  UserCheck,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Landmark,
  Printer,
  FileSpreadsheet,
  Shield,
  Plug,
  ChevronLeft,
  Crown,
  UserCog,
  Sparkles,
  BookOpen,
  Repeat,
  MapPin,
  Zap
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavItem[];
  roles?: string[];
  color?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const buildNavSections = (userRole: string): NavSection[] => {
  const sections: NavSection[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'blue' },
        { name: 'Punto de Venta', href: '/pos', icon: ShoppingCart, color: 'emerald' },
      ]
    },
    {
      label: 'FACTURACIÓN',
      items: [
        { name: 'Emitir Comprobante', href: '/facturacion/emitir', icon: FileSpreadsheet, color: 'blue' },
        { name: 'Comprobantes', href: '/facturas', icon: Receipt, color: 'sky' },
        { name: 'Tickets', href: '/tickets', icon: Printer, color: 'cyan' },
        { name: 'Remitos', href: '/facturacion/remito', icon: Truck, color: 'teal' },
        { name: 'Recurrentes', href: '/facturacion/recurrentes', icon: RefreshCw, color: 'indigo' },
      ]
    },
    {
      label: 'VENTAS',
      items: [
        { name: 'Historial', href: '/ventas', icon: FileText, color: 'violet' },
        { name: 'Presupuestos', href: '/presupuestos', icon: FileCheck, color: 'purple' },
      ]
    },
    {
      label: 'GESTIÓN',
      items: [
        {
          name: 'Inventario',
          icon: Package,
          color: 'orange',
          children: [
            { name: 'Productos', href: '/inventario', icon: Package, color: 'orange' },
            { name: 'Importar con IA', href: '/inventario/importar', icon: Sparkles, color: 'purple' },
          ]
        },
        {
          name: 'Clientes',
          icon: Users,
          color: 'violet',
          children: [
            { name: 'Lista de Clientes', href: '/clientes', icon: Users, color: 'violet' },
            { name: 'Cuentas Corrientes', href: '/cuentas-corrientes', icon: Wallet, color: 'amber' },
            { name: 'Listas de Precios', href: '/listas-precios', icon: Tags, color: 'pink' },
          ]
        },
        {
          name: 'Proveedores',
          icon: Building2,
          color: 'teal',
          children: [
            { name: 'Lista de Proveedores', href: '/proveedores', icon: Building2, color: 'teal' },
            { name: 'Órdenes de Compra', href: '/compras', icon: Truck, color: 'cyan' },
          ]
        },
      ]
    },
    {
      label: 'FINANZAS',
      items: [
        {
          name: 'Tesorería',
          icon: Landmark,
          color: 'emerald',
          children: [
            { name: 'Bancos y Cheques', href: '/tesoreria', icon: Landmark, color: 'emerald' },
            { name: 'Transacciones', href: '/transacciones', icon: CreditCard, color: 'blue' },
            { name: 'Vendedores', href: '/vendedores', icon: UserCheck, color: 'indigo' },
          ]
        },
        { name: 'Reportes', href: '/reportes', icon: BarChart3, color: 'blue' },
        { name: 'Libro IVA', href: '/libro-iva', icon: BookOpen, color: 'rose' },
      ]
    },
    {
      label: 'INTELIGENCIA',
      items: [
        { name: 'Contador IA', href: '/contador-ia', icon: Sparkles, color: 'purple' },
      ]
    },
  ];

  if (userRole === 'company_admin' || userRole === 'superadmin') {
    sections.push({
      label: 'CONFIGURACIÓN',
      items: [
        {
          name: 'Configuración',
          icon: Settings,
          color: 'slate',
          children: [
            { name: 'Empresa', href: '/configuracion', icon: Building2, color: 'slate' },
            { name: 'Organización', href: '/configuracion/organizacion', icon: MapPin, color: 'indigo' },
            { name: 'Integraciones', href: '/configuracion/integraciones', icon: Plug, color: 'cyan' },
            { name: 'ARCA/AFIP', href: '/configuracion/afip', icon: Shield, color: 'red' },
            { name: 'Puntos de Venta', href: '/configuracion/puntos-venta', icon: ShoppingCart, color: 'emerald' },
          ]
        },
      ]
    });
  }

  if (userRole === 'company_admin') {
    sections.push({
      label: 'MI EMPRESA',
      items: [
        {
          name: 'Mi Empresa',
          icon: UserCog,
          color: 'blue',
          children: [
            { name: 'Usuarios', href: '/admin/usuarios', icon: Users, color: 'blue' },
          ]
        },
      ]
    });
  }

  if (userRole === 'superadmin') {
    sections.push({
      label: 'ADMINISTRACIÓN',
      items: [
        {
          name: 'Administración',
          icon: Crown,
          color: 'amber',
          children: [
            { name: 'Panel Admin', href: '/admin', icon: Shield, color: 'amber' },
            { name: 'Empresas', href: '/admin/empresas', icon: Building2, color: 'blue' },
            { name: 'Usuarios Global', href: '/admin/usuarios', icon: Users, color: 'violet' },
          ]
        },
      ]
    });
  }

  return sections;
};

const COLOR_MAP: Record<string, { bg: string; text: string; activeBg: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-[#2563eb]', activeBg: 'from-[#2563eb] to-[#1d4ed8]' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'from-emerald-600 to-emerald-700' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', activeBg: 'from-violet-600 to-violet-700' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', activeBg: 'from-purple-600 to-purple-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', activeBg: 'from-orange-600 to-orange-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'from-amber-600 to-amber-700' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', activeBg: 'from-teal-600 to-teal-700' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', activeBg: 'from-cyan-600 to-cyan-700' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', activeBg: 'from-sky-600 to-sky-700' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', activeBg: 'from-indigo-600 to-indigo-700' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', activeBg: 'from-rose-600 to-rose-700' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', activeBg: 'from-pink-600 to-pink-700' },
  red: { bg: 'bg-red-50', text: 'text-red-600', activeBg: 'from-red-600 to-red-700' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', activeBg: 'from-slate-600 to-slate-700' },
};

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen?: boolean; onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const userRole = (session?.user as any)?.role || 'user';
  const navSections = useMemo(() => buildNavSections(userRole), [userRole]);

  useEffect(() => {
    navSections.forEach(section => {
      section.items.forEach(item => {
        if (item.children) {
          const isChildActive = item.children.some(child => pathname === child.href);
          if (isChildActive && !expandedItems.includes(item.name)) {
            setExpandedItems(prev => [...prev, item.name]);
          }
        }
      });
    });
  }, [pathname, navSections]);

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(i => i !== name) 
        : [...prev, name]
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    if (item.href) return pathname === item.href;
    if (item.children) return item.children.some(child => pathname === child.href);
    return false;
  };

  const renderNavItem = (item: NavItem, depth: number = 0) => {
    const Icon = item.icon;
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;
    const colors = COLOR_MAP[item.color || 'blue'];

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleExpand(item.name)}
            className={`sidebar-nav-item group ${
              isActive
                ? 'bg-slate-50/80 text-slate-800'
                : 'text-slate-500 hover:bg-slate-50/60 hover:text-slate-700'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <div className={`sidebar-icon-wrapper ${
              isActive ? `${colors.bg} ${colors.text}` : 'bg-transparent text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500'
            }`}>
              <Icon className="w-4 h-4" />
            </div>
            {!collapsed && (
              <>
                <span className="flex-1 text-left font-medium text-[13px]">{item.name}</span>
                <ChevronDown 
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isExpanded ? 'rotate-180' : ''
                  } ${isActive ? 'text-slate-500' : 'text-slate-300'}`} 
                />
              </>
            )}
          </button>
          {!collapsed && isExpanded && (
            <div className="ml-5 mt-0.5 space-y-0.5 border-l-2 border-slate-100 pl-3 py-1">
              {item.children?.map(child => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href!}
        onClick={() => onCloseMobile?.()}
        className={`sidebar-nav-item group ${
          isActive
            ? 'sidebar-nav-active'
            : 'text-slate-500 hover:bg-slate-50/60 hover:text-slate-700'
        } ${collapsed ? 'justify-center' : ''} ${depth > 0 ? 'py-1.5' : ''}`}
        title={collapsed ? item.name : undefined}
      >
        <div className={`sidebar-icon-wrapper ${
          isActive 
            ? `bg-gradient-to-br ${colors.activeBg} text-white shadow-sm` 
            : `bg-transparent ${colors.text} group-hover:${colors.bg}`
        }`}>
          <Icon className={`${depth > 0 ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        </div>
        {!collapsed && (
          <span className={`font-medium ${depth > 0 ? 'text-[12.5px]' : 'text-[13px]'}`}>{item.name}</span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <>
      {/* ═══════ HEADER ═══════ */}
      <div className={`p-5 pb-4 ${collapsed ? 'flex items-center justify-center' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="sidebar-logo bg-[#2563ad] rounded-none border border-[#1e4d8c]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#1a3a5c]">EMITIA</h1>
              <p className="text-[10px] text-[#5c7291] font-semibold -mt-0.5 tracking-widest uppercase">Gestión Comercial</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ NAVIGATION ═══════ */}
      <div className="flex-1 overflow-y-auto sidebar-scroll px-3 pb-4">
        {navSections.map((section, sIdx) => (
          <div key={section.label} className={sIdx > 0 ? 'mt-5' : 'mt-1'}>
            {!collapsed && (
              <div className="sidebar-section-label">
                {section.label}
              </div>
            )}
            {collapsed && sIdx > 0 && (
              <div className="my-3 mx-2 border-t border-slate-100/80" />
            )}
            <div className="space-y-0.5">
              {section.items.map(item => renderNavItem(item))}
            </div>
          </div>
        ))}
      </div>

      {/* ═══════ FOOTER ═══════ */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-slate-100/60">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-slate-400 font-medium">Sistema activo</span>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-sm items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:shadow-md transition-all z-10"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => onCloseMobile?.()}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 w-72 erp-sidebar shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col erp-sidebar transition-all duration-300 relative ${
          collapsed ? 'w-20' : 'w-[252px]'
        } min-h-screen sticky top-11`}
        style={{ height: 'calc(100vh - 2.75rem)' }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
