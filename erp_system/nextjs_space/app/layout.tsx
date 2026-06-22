import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: 'EMITIA - Facturación Electrónica y Gestión Empresarial | Argentina',
  description: 'La plataforma #1 de facturación electrónica ARCA en Argentina. Emití facturas con CAE real, gestioná inventario, clientes y reportes. 100% online.',
  icons: {
    icon: '/favicon-emitia.png',
    shortcut: '/favicon-emitia.png',
    apple: '/favicon-emitia.png',
  },
  openGraph: {
    title: 'EMITIA - Facturación Electrónica y Gestión Empresarial',
    description: 'La plataforma más completa para emitir facturas electrónicas ARCA, gestionar tu negocio y tomar decisiones inteligentes. 100% online, 100% Argentina.',
    images: ['/logo-emitia.png'],
    siteName: 'EMITIA',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EMITIA - Facturación Electrónica Argentina',
    description: 'Facturación electrónica ARCA + ERP completo para PyMEs argentinas. Empezá gratis.',
  },
  keywords: ['facturación electrónica', 'AFIP', 'ARCA', 'CAE', 'ERP', 'Argentina', 'PyME', 'facturas', 'gestión empresarial', 'punto de venta', 'inventario'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={roboto.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
