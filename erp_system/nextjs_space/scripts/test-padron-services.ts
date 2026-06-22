import 'dotenv/config';
import { getTicketAcceso, getAFIPCredentials, clearTicketCache } from '../lib/afip/wsaa';

const services = [
  'ws_sr_padron_a13',
  'ws_sr_padron_a10',
  'ws_sr_padron_a5',
  'wconscuit',
];

async function main() {
  clearTicketCache();
  const { certPem, keyPem, environment } = getAFIPCredentials();
  console.log('Ambiente:', environment);

  for (const svc of services) {
    try {
      const t = await getTicketAcceso(svc, certPem, keyPem, environment);
      console.log('OK', svc, t.expirationTime);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const short = msg.includes('notAuthorized') ? 'notAuthorized' : msg.slice(0, 100);
      console.log('FAIL', svc, short);
    }
  }
}

main();
