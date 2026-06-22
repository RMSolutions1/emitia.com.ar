import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildMpOAuthAuthorizeUrl, isMpOAuthConfigured } from '@/lib/mercadopago/oauth';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/** Inicia flujo OAuth Mercado Pago → redirect a auth.mercadopago.com */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!isMpOAuthConfigured()) {
      return NextResponse.json(
        {
          error: 'OAuth no configurado. Definí MP_APP_ID y MP_CLIENT_SECRET en el servidor.',
          manualFallback: true,
        },
        { status: 400 }
      );
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Sin empresa asignada' }, { status: 403 });
    }

    const nonce = randomBytes(16).toString('hex');
    const state = Buffer.from(JSON.stringify({ companyId, nonce })).toString('base64url');
    const url = buildMpOAuthAuthorizeUrl(state);

    const accept = req.headers.get('accept') || '';
    if (accept.includes('application/json')) {
      return NextResponse.json({ url, configured: true });
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error('MP OAuth start error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error OAuth' },
      { status: 500 }
    );
  }
}
