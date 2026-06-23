'use client';

import { useSession } from 'next-auth/react';

export function useErpSession() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role?.toUpperCase() || 'ADMIN';
  return { session, status, userRole };
}
