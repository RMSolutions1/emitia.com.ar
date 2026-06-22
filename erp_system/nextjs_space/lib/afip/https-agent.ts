import https from 'https';
import axios from 'axios';

/**
 * AFIP/ARCA aún expone endpoints con parámetros DH legacy.
 * OpenSSL 3 (Node 17+) los rechaza con "dh key too small" sin bajar SECLEVEL.
 */
export const afipHttpsAgent = new https.Agent({
  ciphers: 'DEFAULT@SECLEVEL=1',
  minVersion: 'TLSv1.2',
});

export const afipAxios = axios.create({
  httpsAgent: afipHttpsAgent,
  timeout: 30000,
});

export const afipSoapClientOptions = {
  wsdl_options: {
    timeout: 30000,
    httpsAgent: afipHttpsAgent,
  },
  request: afipAxios,
};
