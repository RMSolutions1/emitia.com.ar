import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { HomeLanding } from '@/components/marketing/home-landing';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }
  return <HomeLanding />;
}
