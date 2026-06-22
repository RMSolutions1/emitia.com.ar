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

    // Solo ws_sr_padron_a13 es obligatorio para EMITIA (A10/A5 no están en el certificado y no se usan)
    let padronA13Ok = false;
    let padronError = '';

    try {
      await getTicketAcceso('ws_sr_padron_a13', certPem, keyPem, environment);
      padronA13Ok = true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('notAuthorized') || msg.includes('no autorizado')) {
        padronError =
          'El certificado emprenor (serial ' + (certificate?.serialNumber || '?') + ') no tiene ws_sr_padron_a13 habilitado en WSAA. ' +
          'En ARCA → Administrador de Certificados → emprenor → Agregar servicio ws_sr_padron_a13.';
      } else {
        padronError = msg.slice(0, 200);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: padronA13Ok
        ? 'Autenticación exitosa con ARCA'
        : 'Facturación OK. Padrón requiere habilitar ws_sr_padron_a13 en ARCA.',
      expirationTime: ticketWSFE.expirationTime,
      generationTime: ticketWSFE.generationTime,
      environment,
      cuit,
      certificate,
      services: {
        wsfe: true,
        ws_sr_padron_a13: padronA13Ok,
        ...(padronError && !padronA13Ok ? { padronError } : {}),
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
