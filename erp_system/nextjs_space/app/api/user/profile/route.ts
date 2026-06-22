export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

const MAX_IMAGE_LENGTH = 500_000;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('[User Profile GET]', error);
    return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
    }

    const body = await request.json();
    const data: { name?: string; image?: string | null } = {};

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (name.length < 1 || name.length > 120) {
        return NextResponse.json({ error: 'El nombre debe tener entre 1 y 120 caracteres' }, { status: 400 });
      }
      data.name = name;
    }

    if (body.image === null || body.image === '') {
      data.image = null;
    } else if (typeof body.image === 'string') {
      const image = body.image.trim();
      if (image.startsWith('data:image/') && image.length > MAX_IMAGE_LENGTH) {
        return NextResponse.json({ error: 'La imagen es demasiado grande (máx. ~350 KB)' }, { status: 400 });
      }
      if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:image/') || image.startsWith('/')) {
        data.image = image;
      } else if (image.length > 0) {
        return NextResponse.json({ error: 'Formato de imagen no válido' }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, image: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('[User Profile PATCH]', error);
    return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
  }
}
