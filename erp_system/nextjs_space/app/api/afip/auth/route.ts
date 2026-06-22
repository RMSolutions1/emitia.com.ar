export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTicketAcceso, getAFIPCredentials, clearTicketCache, getAFCertificateMeta } from '@/lib/afip';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    clearTicketCache();

    const { certPem, keyPem, cuit, environment } = getAFIPCredentials();
    const certificate = getAFCertificateMeta();
    
    const ticketWSFE = await getTicketAcceso('wsfe', certPem, keyPem, environment);

    const padronServices = ['ws_sr_padron_a13', 'ws_sr_padron_a10', 'ws_sr_padron_a5'] as const;
    const padronResults: Record<string, boolean | string> = {};
    let padronOk = false;
    let padronError = '';

    for (const svc of padronServices) {
      try {
        await getTicketAcceso(svc, certPem, keyPem, environment);
        padronResults[svc] = true;
        padronOk = true;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        padronResults[svc] = msg.includes('notAuthorized') ? 'notAuthorized' : msg.slice(0, 120);
        if (!padronError && msg.includes('notAuthorized')) {
          padronError =
            'El certificado emprenor (serial ' + (certificate?.serialNumber || '?') + ') no tiene ws_sr_padron_a13 habilitado en WSAA. ' +
            'En ARCA → Administrador de Certificados → emprenor → Agregar servicio ws_sr_padron_a13.';
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: padronOk
        ? 'Autenticación exitosa con ARCA'
        : 'Facturación OK. Padrón requiere habilitar ws_sr_padron_a13 en ARCA.',
      expirationTime: ticketWSFE.expirationTime,
      generationTime: ticketWSFE.generationTime,
      environment,
      cuit,
      certificate,
      services: {
        wsfe: true,
        ws_sr_padron_a13: padronResults.ws_sr_padron_a13 === true,
        padronDetails: padronResults,
        ...(padronError ? { padronError } : {}),
      },
    });
  } catch (error: any) {
    console.error('[AFIP Auth Error]', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al autenticar con AFIP',
    }, { status: 500 });
  }
}
