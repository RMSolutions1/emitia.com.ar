// @ts-nocheck
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { encrypt, decrypt, maskSecret } from '@/lib/encryption';

// GET - Obtener configuraciones de API del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userCompanyId = (session.user as any)?.companyId;

    if (!userCompanyId && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
    }

    const configs = await prisma.apiConfiguration.findMany({
      where: userCompanyId ? { companyId: userCompanyId } : undefined,
      orderBy: { createdAt: 'desc' }
    });

    // Enmascarar credenciales sensibles
    const maskedConfigs = configs.map(config => ({
      id: config.id,
      companyId: config.companyId,
      provider: config.provider,
      displayName: config.displayName,
      accessToken: config.accessToken ? maskSecret(decrypt(config.accessToken), 4) : null,
      publicKey: config.publicKey ? maskSecret(decrypt(config.publicKey), 4) : null,
      secretKey: config.secretKey ? maskSecret(decrypt(config.secretKey), 4) : null,
      webhookSecret: config.webhookSecret ? maskSecret(decrypt(config.webhookSecret), 4) : null,
      environment: config.environment,
      isActive: config.isActive,
      metadata: (() => {
        if (!config.metadata) return null;
        try {
          return JSON.parse(config.metadata);
        } catch {
          return null;
        }
      })(),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));

    return NextResponse.json(maskedConfigs);
  } catch (error) {
    console.error('Error fetching API configs:', error);
    return NextResponse.json({ error: 'Error al obtener configuraciones' }, { status: 500 });
  }
}

// POST - Crear o actualizar configuración de API
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userCompanyId = (session.user as any)?.companyId;

    // Solo admin puede configurar APIs
    if (userRole !== 'company_admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Sin permisos para configurar APIs' }, { status: 403 });
    }

    if (!userCompanyId && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Usuario sin empresa asignada' }, { status: 403 });
    }

    const body = await req.json();
    const {
      provider,
      displayName,
      accessToken,
      publicKey,
      secretKey,
      webhookSecret,
      environment,
      isActive,
      companyId: targetCompanyId,
      metadata,
    } = body;

    if (!provider) {
      return NextResponse.json({ error: 'Provider requerido' }, { status: 400 });
    }

    const normalizedProvider = String(provider).toLowerCase();

    const finalCompanyId = userRole === 'superadmin' && targetCompanyId ? targetCompanyId : userCompanyId;

    if (!finalCompanyId) {
      return NextResponse.json({ error: 'ID de empresa requerido' }, { status: 400 });
    }

    // Construir datos encriptados
    const data: any = {
      companyId: finalCompanyId,
      provider: normalizedProvider,
      displayName: displayName || normalizedProvider.charAt(0).toUpperCase() + normalizedProvider.slice(1),
      environment: environment || 'sandbox',
      isActive: isActive !== undefined ? isActive : true
    };

    if (accessToken) data.accessToken = encrypt(accessToken);
    if (publicKey) data.publicKey = encrypt(publicKey);
    if (secretKey) data.secretKey = encrypt(secretKey);
    if (webhookSecret) data.webhookSecret = encrypt(webhookSecret);
    if (metadata !== undefined) {
      data.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    }

    // Upsert: actualizar si existe, crear si no
    const config = await prisma.apiConfiguration.upsert({
      where: {
        companyId_provider: {
          companyId: finalCompanyId,
          provider: normalizedProvider
        }
      },
      update: data,
      create: data
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        provider: config.provider,
        displayName: config.displayName,
        environment: config.environment,
        isActive: config.isActive
      }
    });
  } catch (error) {
    console.error('Error saving API config:', error);
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 });
  }
}

// DELETE - Eliminar configuración de API
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role;
    const userCompanyId = (session.user as any)?.companyId;

    if (userRole !== 'company_admin' && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');
    const configId = searchParams.get('id');

    if (!provider && !configId) {
      return NextResponse.json({ error: 'Provider o ID requerido' }, { status: 400 });
    }

    if (configId) {
      // Verificar que pertenece a la empresa del usuario
      const config = await prisma.apiConfiguration.findUnique({
        where: { id: configId }
      });

      if (!config) {
        return NextResponse.json({ error: 'Configuración no encontrada' }, { status: 404 });
      }

      if (userRole !== 'superadmin' && config.companyId !== userCompanyId) {
        return NextResponse.json({ error: 'Sin acceso a esta configuración' }, { status: 403 });
      }

      await prisma.apiConfiguration.delete({
        where: { id: configId }
      });
    } else if (provider && userCompanyId) {
      await prisma.apiConfiguration.deleteMany({
        where: {
          companyId: userCompanyId,
          provider: { equals: provider, mode: 'insensitive' },
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API config:', error);
    return NextResponse.json({ error: 'Error al eliminar configuración' }, { status: 500 });
  }
}
