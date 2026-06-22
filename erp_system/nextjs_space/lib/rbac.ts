export type Role =
  | 'superadmin'
  | 'owner'
  | 'company_admin'
  | 'manager'
  | 'accountant'
  | 'admin'
  | 'seller'
  | 'cashier'
  | 'purchasing'
  | 'warehouse'
  | 'user';

export type Permission =
  | 'admin.platform'
  | 'company.manage'
  | 'users.manage'
  | 'branches.manage'
  | 'warehouses.manage'
  | 'products.read'
  | 'products.write'
  | 'inventory.read'
  | 'inventory.write'
  | 'sales.read'
  | 'sales.write'
  | 'invoices.read'
  | 'invoices.write'
  | 'purchases.read'
  | 'purchases.write'
  | 'treasury.read'
  | 'treasury.write'
  | 'reports.read'
  | 'afip.manage';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  superadmin: [
    'admin.platform',
    'company.manage',
    'users.manage',
    'branches.manage',
    'warehouses.manage',
    'products.read',
    'products.write',
    'inventory.read',
    'inventory.write',
    'sales.read',
    'sales.write',
    'invoices.read',
    'invoices.write',
    'purchases.read',
    'purchases.write',
    'treasury.read',
    'treasury.write',
    'reports.read',
    'afip.manage',
  ],
  owner: [
    'company.manage',
    'users.manage',
    'branches.manage',
    'warehouses.manage',
    'products.read',
    'products.write',
    'inventory.read',
    'inventory.write',
    'sales.read',
    'sales.write',
    'invoices.read',
    'invoices.write',
    'purchases.read',
    'purchases.write',
    'treasury.read',
    'treasury.write',
    'reports.read',
    'afip.manage',
  ],
  company_admin: [
    'company.manage',
    'users.manage',
    'branches.manage',
    'warehouses.manage',
    'products.read',
    'products.write',
    'inventory.read',
    'inventory.write',
    'sales.read',
    'sales.write',
    'invoices.read',
    'invoices.write',
    'purchases.read',
    'purchases.write',
    'treasury.read',
    'treasury.write',
    'reports.read',
    'afip.manage',
  ],
  manager: [
    'branches.manage',
    'warehouses.manage',
    'products.read',
    'products.write',
    'inventory.read',
    'inventory.write',
    'sales.read',
    'sales.write',
    'invoices.read',
    'invoices.write',
    'purchases.read',
    'purchases.write',
    'treasury.read',
    'reports.read',
  ],
  accountant: [
    'products.read',
    'inventory.read',
    'sales.read',
    'invoices.read',
    'invoices.write',
    'purchases.read',
    'treasury.read',
    'treasury.write',
    'reports.read',
    'afip.manage',
  ],
  admin: [
    'products.read',
    'products.write',
    'inventory.read',
    'inventory.write',
    'sales.read',
    'sales.write',
    'invoices.read',
    'invoices.write',
    'purchases.read',
    'purchases.write',
    'treasury.read',
    'reports.read',
  ],
  seller: ['products.read', 'sales.read', 'sales.write', 'invoices.read', 'invoices.write'],
  cashier: ['products.read', 'sales.read', 'sales.write', 'invoices.read', 'invoices.write'],
  purchasing: ['products.read', 'products.write', 'inventory.read', 'purchases.read', 'purchases.write'],
  warehouse: ['products.read', 'inventory.read', 'inventory.write'],
  user: ['products.read', 'sales.read', 'invoices.read'],
};

export function normalizeRole(role: string | null | undefined): Role {
  const value = (role || 'user') as Role;
  return value in ROLE_PERMISSIONS ? value : 'user';
}

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  const normalized = normalizeRole(role);
  return ROLE_PERMISSIONS[normalized].includes(permission);
}

export function hasAnyPermission(
  role: string | null | undefined,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function isSuperadmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'superadmin';
}

export function isCompanyAdmin(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'superadmin' || normalized === 'owner' || normalized === 'company_admin';
}
