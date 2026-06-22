import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { exchangeMpOAuthCode } from '@/lib/mercadopago/oauth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  const redirectOk = `${baseUrl}/configuracion/integraciones?mp=connected`;
  const redirectErr = `${baseUrl}/configuracion/integraciones?mp=error`;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const stateRaw = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code || !stateRaw) {
      return NextResponse.redirect(`${redirectErr}&reason=${encodeURIComponent(error || 'missing_code')}`);
    }

    let companyId: string;
    try {
      const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
      companyId = state.companyId;
    } catch {
      return NextResponse.redirect(`${redirectErr}&reason=invalid_state`);
    }

    if (!companyId) {
      return NextResponse.redirect(`${redirectErr}&reason=no_company`);
    }

    const tokens = await exchangeMpOAuthCode(code);

    const existing = await prisma.apiConfiguration.findFirst({
      where: { companyId, provider: { equals: 'mercadopago', mode: 'insensitive' } },
    });

    const data = {
      accessToken: encrypt(tokens.access_token),
      publicKey: tokens.public_key ? encrypt(tokens.public_key) : undefined,
      environment: 'production' as const,
      isActive: true,
      metadata: JSON.stringify({
        oauth: true,
        mpUserId: tokens.user_id,
        connectedAt: new Date().toISOString(),
      }),
    };

    if (existing) {
      await prisma.apiConfiguration.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.apiConfiguration.create({
        data: {
          companyId,
          provider: 'mercadopago',
          displayName: 'Mercado Pago',
          ...data,
        },
      });
    }

    return NextResponse.redirect(redirectOk);
  } catch (err) {
    console.error('MP OAuth callback error:', err);
    return NextResponse.redirect(`${redirectErr}&reason=exchange_failed`);
  }
}
