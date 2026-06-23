'use client';

import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

const publicPaths = ['/login', '/registro', '/recuperar-clave'];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = publicPaths.includes(pathname);

  if (isPublicPage) {
    return (
      <>
        <Toaster position="top-right" />
        {children}
      </>
    );
  }

  return (
    <div className="erp-app min-h-screen">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '0',
            fontSize: '13px',
            fontFamily: 'Segoe UI, Tahoma, sans-serif',
          },
        }}
      />
      {children}
    </div>
  );
}
