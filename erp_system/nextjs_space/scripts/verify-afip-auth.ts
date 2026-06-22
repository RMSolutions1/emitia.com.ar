import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import { getTicketAcceso, getAFIPCredentials, clearTicketCache, getAFCertificateMeta } from '../lib/afip/wsaa';

async function main() {
  clearTicketCache();

  const meta = getAFCertificateMeta();
  console.log('=== CERTIFICADO EMITIA ===');
  console.log(JSON.stringify(meta, null, 2));

  const { certPem, keyPem, cuit, environment } = getAFIPCredentials();
  const keyPemFile = fs.readFileSync('afip_private.key', 'utf8');
  const certPub = crypto.createPublicKey(certPem);
  const keyPub = crypto.createPublicKey(crypto.createPrivateKey(keyPemFile));
  const match = certPub.export({ type: 'spki', format: 'der' }).equals(keyPub.export({ type: 'spki', format: 'der' }));
  console.log('Clave privada ↔ certificado:', match ? 'OK' : 'NO COINCIDE');
  console.log('Ambiente:', environment, '| CUIT:', cuit);
  console.log('');

  for (const svc of ['wsfe', 'ws_sr_padron_a13']) {
    try {
      const t = await getTicketAcceso(svc, certPem, keyPem, environment);
      console.log(`✅ ${svc} — ticket OK hasta ${t.expirationTime}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`❌ ${svc} — ${msg.slice(0, 500)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
