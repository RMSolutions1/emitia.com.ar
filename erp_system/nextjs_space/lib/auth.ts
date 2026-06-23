import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from './db';
import { logAuditEvent } from './audit';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciales inválidas');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            company: true,
          },
        });

        if (!user || !user?.password) {
          throw new Error('Usuario no encontrado');
        }

        // Verificar si el usuario está activo
        if (user.status === 'blocked') {
          throw new Error('Usuario bloqueado. Contacte al administrador.');
        }

        if (user.status === 'inactive') {
          throw new Error('Usuario inactivo. Contacte al administrador.');
        }

        // Verificar si la empresa está activa (solo para usuarios no superadmin)
        if (user.companyId && user.company) {
          if (user.company.status === 'blocked') {
            throw new Error('Empresa bloqueada. Contacte al administrador.');
          }
          if (user.company.status === 'suspended') {
            throw new Error('Empresa suspendida. Contacte al administrador.');
          }
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }

        // Actualizar último login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await logAuditEvent({
          companyId: user.companyId,
          userId: user.id,
          action: 'user.login',
          entity: 'User',
          entityId: user.id,
          metadata: { role: user.role },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          companyId: user.companyId,
          companyName: user.company?.name || null,
          companyPlan: user.company?.plan || 'free',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as typeof user & { id: string; role: string; companyId: string | null; companyName: string | null; companyPlan: string };
        token.id = u.id;
        token.role = u.role;
        token.companyId = u.companyId;
        token.companyName = u.companyName;
        token.companyPlan = u.companyPlan;
        token.picture = u.image || null;
      }
      if (trigger === 'update' && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.picture = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.companyName = token.companyName;
        session.user.companyPlan = token.companyPlan;
        session.user.name = token.name as string | undefined;
        session.user.image = (token.picture as string | null) || null;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

