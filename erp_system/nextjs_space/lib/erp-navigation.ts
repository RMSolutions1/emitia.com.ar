import type { LucideIcon } from 'lucide-react';
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
  Landmark,
  Printer,
  FileSpreadsheet,
  Shield,
  Plug,
  Crown,
  UserCog,
  Sparkles,
  BookOpen,
  MapPin,
} from 'lucide-react';

export interface ErpNavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  children?: ErpNavItem[];
}

export interface ErpNavSection {
  label: string;
  items: ErpNavItem[];
}

export function buildErpNavSections(userRole: string): ErpNavSection[] {
  const sections: ErpNavSection[] = [
    {
      label: 'Inicio',
      items: [
        { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Punto de Venta (POS)', href: '/pos', icon: ShoppingCart },
      ],
    },
    {
      label: 'Facturación',
      items: [
        { name: 'Emitir Comprobante', href: '/facturacion/emitir', icon: FileSpreadsheet },
        { name: 'Comprobantes emitidos', href: '/facturas', icon: Receipt },
        { name: 'Historial de Ventas', href: '/ventas', icon: FileText },
        { name: 'Recibos de cobranza', href: '/recibos', icon: Wallet },
        { name: 'Presupuestos', href: '/presupuestos', icon: FileCheck },
        { name: 'Tickets (historial)', href: '/tickets', icon: Printer },
        { name: 'Recurrentes', href: '/facturacion/recurrentes', icon: RefreshCw },
      ],
    },
    {
      label: 'Gestión',
      items: [
        {
          name: 'Inventario',
          icon: Package,
          children: [
            { name: 'Productos', href: '/inventario', icon: Package },
            { name: 'Importar con IA', href: '/inventario/importar', icon: Sparkles },
          ],
        },
        {
          name: 'Clientes',
          icon: Users,
          children: [
            { name: 'Lista de Clientes', href: '/clientes', icon: Users },
            { name: 'Cuentas Corrientes', href: '/cuentas-corrientes', icon: Wallet },
            { name: 'Listas de Precios', href: '/listas-precios', icon: Tags },
          ],
        },
        {
          name: 'Proveedores',
          icon: Building2,
          children: [
            { name: 'Lista de Proveedores', href: '/proveedores', icon: Building2 },
            { name: 'Órdenes de Compra', href: '/compras', icon: Truck },
          ],
        },
      ],
    },
    {
      label: 'Finanzas',
      items: [
        {
          name: 'Tesorería',
          icon: Landmark,
          children: [
            { name: 'Bancos y Cheques', href: '/tesoreria', icon: Landmark },
            { name: 'Transacciones', href: '/transacciones', icon: CreditCard },
            { name: 'Vendedores', href: '/vendedores', icon: UserCheck },
          ],
        },
        { name: 'Reportes', href: '/reportes', icon: BarChart3 },
        { name: 'Libro IVA', href: '/libro-iva', icon: BookOpen },
      ],
    },
    {
      label: 'IA',
      items: [{ name: 'Contador IA', href: '/contador-ia', icon: Sparkles }],
    },
  ];

  if (userRole === 'company_admin' || userRole === 'superadmin') {
    sections.push({
      label: 'Config',
      items: [
        {
          name: 'Configuración',
          icon: Settings,
          children: [
            { name: 'Empresa', href: '/configuracion', icon: Building2 },
            { name: 'Organización', href: '/configuracion/organizacion', icon: MapPin },
            { name: 'Integraciones', href: '/configuracion/integraciones', icon: Plug },
            { name: 'Plan EMITIA', href: '/configuracion/plan', icon: Crown },
            { name: 'ARCA/AFIP', href: '/configuracion/afip', icon: Shield },
            { name: 'Puntos de Venta', href: '/configuracion/puntos-venta', icon: ShoppingCart },
            { name: 'Mi Perfil', href: '/configuracion/perfil', icon: UserCog },
          ],
        },
      ],
    });
  }

  if (userRole === 'company_admin') {
    sections.push({
      label: 'Empresa',
      items: [
        {
          name: 'Mi Empresa',
          icon: UserCog,
          children: [{ name: 'Usuarios', href: '/admin/usuarios', icon: Users }],
        },
      ],
    });
  }

  if (userRole === 'superadmin') {
    sections.push({
      label: 'Admin',
      items: [
        {
          name: 'Administración',
          icon: Crown,
          children: [
            { name: 'Panel Admin', href: '/admin', icon: Shield },
            { name: 'Empresas', href: '/admin/empresas', icon: Building2 },
            { name: 'Usuarios Global', href: '/admin/usuarios', icon: Users },
          ],
        },
      ],
    });
  }

  return sections;
}

export function flattenNavItems(sections: ErpNavSection[]): ErpNavItem[] {
  const out: ErpNavItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href) out.push(item);
      if (item.children) out.push(...item.children.filter((c) => c.href));
    }
  }
  return out;
}
