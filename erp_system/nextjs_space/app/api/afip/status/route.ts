export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkServerStatus } from '@/lib/afip';
import { getAFCertificateMeta } from '@/lib/afip/wsaa';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const status = await checkServerStatus();
    
    return NextResponse.json({
      success: true,
      status,
      environment: process.env.AFIP_ENVIRONMENT || 'testing',
      configured: !!(process.env.AFIP_CERT && process.env.AFIP_KEY && process.env.AFIP_CUIT),
      certificate: getAFCertificateMeta(),
    });
  } catch (error: any) {
    console.error('[AFIP Status Error]', error);
    const message = error.message || 'Error al verificar estado de AFIP';
    const isTls =
      message.includes('dh key too small') ||
      message.includes('EPROTO') ||
      message.includes('SSL routines');
    return NextResponse.json({
      success: false,
      error: isTls
        ? 'Error TLS al conectar con AFIP (OpenSSL). Reiniciá el servidor tras la actualización.'
        : message,
      configured: !!(process.env.AFIP_CERT && process.env.AFIP_KEY && process.env.AFIP_CUIT),
      environment: process.env.AFIP_ENVIRONMENT || 'testing',
    }, { status: 500 });
  }
}
