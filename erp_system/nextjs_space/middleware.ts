export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/facturacion/:path*',
    '/ventas/:path*',
    '/compras/:path*',
    '/inventario/:path*',
    '/tesoreria/:path*',
    '/contabilidad/:path*',
    '/configuracion/:path*',
    '/admin/:path*',
    '/pos/:path*',
    '/api/branches/:path*',
    '/api/warehouses/:path*',
    '/api/inventory/migrate-stock',
  ],
};
