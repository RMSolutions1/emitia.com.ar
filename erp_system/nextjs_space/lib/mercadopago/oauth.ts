const MP_AUTH_URL = 'https://auth.mercadopago.com/authorization';
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

export function isMpOAuthConfigured(): boolean {
  return !!(process.env.MP_APP_ID && process.env.MP_CLIENT_SECRET);
}

export function getMpOAuthRedirectUri(): string {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  return `${base}/api/payments/mercadopago/oauth/callback`;
}

export function buildMpOAuthAuthorizeUrl(state: string): string {
  const clientId = process.env.MP_APP_ID;
  if (!clientId) throw new Error('MP_APP_ID no configurado en el servidor');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: getMpOAuthRedirectUri(),
    state,
  });

  return `${MP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeMpOAuthCode(code: string): Promise<{
  access_token: string;
  public_key?: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: number;
}> {
  const clientId = process.env.MP_APP_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Credenciales OAuth MP no configuradas (MP_APP_ID / MP_CLIENT_SECRET)');
  }

  const response = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: getMpOAuthRedirectUri(),
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || body.error || 'Error al obtener token OAuth');
  }
  return body;
}
