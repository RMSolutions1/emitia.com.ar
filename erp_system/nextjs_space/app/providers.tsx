'use client';

import { SessionProvider } from 'next-auth/react';
import { MainLayout } from '@/components/main-layout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MainLayout>{children}</MainLayout>
    </SessionProvider>
  );
}
