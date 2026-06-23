import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      companyId: string | null;
      companyName: string | null;
      companyPlan: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    companyId: string | null;
    companyName: string | null;
    companyPlan: string;
  }
}
