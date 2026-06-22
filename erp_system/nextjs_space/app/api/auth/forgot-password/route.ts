import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'Si el email existe, recibirás instrucciones.' });
    }

    if (user.status === 'blocked') {
      return NextResponse.json({ error: 'Tu cuenta está bloqueada. Contactá al soporte.' }, { status: 403 });
    }

    // Generate temporary password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 char hex string
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Log the temp password for now (until email notification is set up)
    console.log(`[PASSWORD RESET] User: ${email}, Temp Password: ${tempPassword}`);

    // Note: Email notification can be configured later. For now, the temp password is logged above.
    // When email notifications are set up, this endpoint will automatically send the temp password via email.

    return NextResponse.json({ message: 'Si el email existe, recibirás instrucciones.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
