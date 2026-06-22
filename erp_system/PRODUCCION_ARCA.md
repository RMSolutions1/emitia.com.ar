# 🚀 EMITIA - Guía Migración a Producción ARCA

## Estado Actual

✅ **Ambiente**: Testing/Homologación (ARCA)  
✅ **Certificado**: Vigente hasta 4/10/2028  
✅ **Servicio**: ws_sr_padron_a5 autorizado  
✅ **Facturación**: Funcional en testing  

---

## Pasos para Producción Real

### 1. Obtener Certificado de Producción ARCA

**Dónde**:
- URL: https://www.arca.gob.ar (NO homotestigo)
- Entrá con tu Clave Fiscal nivel 3+

**Qué solicitar**:
1. Entrá a "Administración de Certificados Digitales"
2. Click "Solicitar Certificado"
3. Seleccioná "Certificado de Producción"
4. Completá datos de tu empresa
5. Enviá solicitud

**Espera**:
- Plazo: 24-48 horas (generalmente aprobado al instante)
- Notificación: Por email a tu Clave Fiscal

**Descarga**:
1. Volvé a ARCA → Mis Certificados
2. Descargá el archivo `.pem` o `.pfx`
3. Si es `.pfx`, necesitás extraer cert y key

### 2. Preparar el Certificado

**Si descargaste `.pem`** (listo):
```bash
# Ya está en formato correcto
cat tu-certificado.pem | base64 -w 0 > cert_base64.txt
cat tu-clave.pem | base64 -w 0 > key_base64.txt
```

**Si descargaste `.pfx`** (necesita conversión):
```bash
# Extraer certificado
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out cert.pem

# Extraer clave privada
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out key.pem

# Convertir a base64
cat cert.pem | base64 -w 0 > cert_base64.txt
cat key.pem | base64 -w 0 > key_base64.txt
```

### 3. Actualizar Archivo `.env`

```bash
# En /home/ubuntu/erp_system/nextjs_space/.env

# 1. Reemplazar certificados (pegá el contenido de cert_base64.txt y key_base64.txt)
AFIP_CERT=LS0tLS1CRUdJTi... # pegá acá el contenido base64 del certificado de producción
AFIP_KEY=LS0tLS1CRUdJTi... # pegá acá el contenido base64 de la clave de producción

# 2. Cambiar ambiente
AFIP_ENVIRONMENT=production  # ← CAMBIO CRÍTICO

# Mantener igual
AFIP_CUIT=20401546228
```

### 4. Probar la Conexión

```bash
cd /home/ubuntu/erp_system/nextjs_space

# Teste el SOAP de producción
npx ts-node --compiler-options '{"module":"commonjs","esModuleInterop":true}' -e "
require('dotenv').config();
import { getPersona } from './lib/afip/ws-padron';
getPersona('33710900979').then(r => console.log('✅ Producción SOAP funciona', r)).catch(e => console.error('❌ Error:', e.message));
"
```

**Resultado esperado**:
```
✅ Producción SOAP funciona { idPersona: 33710900979, ... }
```

### 5. Hacer Build y Desplegar

```bash
cd /home/ubuntu/erp_system/nextjs_space

# Build
yarn build

# Localmente puedes probar con
yarn dev

# Luego desplegar (ver sección Deploymenton abajo)
```

---

## Diferencias Testing vs Producción

| Aspecto | Testing | Producción |
|---------|---------|------------|
| **Padrón AFIP** | Sin datos (fallback funciona) | Datos reales del padrón |
| **Números comprobantes** | Can be cualquiera | Números reales emitidos |
| **CAE** | No se otorga | Válido legalmente |
| **Fiscalización** | Solo pruebas | Fiscalizable por AFIP |
| **URL ARCA** | `awshomo.afip.gov.ar` | `aws.afip.gov.ar` |
| **Validez** | Documentos no válidos | Documentos válidos |

---

## Consideraciones Legales

⚠️ **IMPORTANTE**: Una vez que empieces a emitir en producción:

1. ✅ Tus comprobantes son válidos ante AFIP
2. ✅ Debes mantener registro de toda la facturación
3. ✅ Los clientes pueden reclamar de manera legal
4. ✅ AFIP puede auditar tus registros
5. ✅ La numeración de comprobantes es secuencial y no se puede reiniciar

**Recomendación**: Haz un test pequeño (5-10 facturas) antes de lanzar completamente.

---

## Despliegue a Producción

### Opción 1: Usar Deploy Automático

```bash
cd /home/ubuntu/erp_system/nextjs_space

# Comitea los cambios del certificado
git add .env
git commit -m "Migración a producción ARCA"

# El sistema automáticamente detectará los cambios y desplegará
```

### Opción 2: Despliegue Manual

Va a usar el mismo sistema que antes. El archivo `.env` con las nuevas credenciales se cargará automáticamente.

---

## Validar Post-Deployment

1. **Login**: Accedé a https://emprenor.abacusai.app
2. **Dashboard**: Verificá que todo carga correctamente
3. **POS**: Intenta una venta de prueba
4. **Factura**: Emití una factura de prueba
5. **Padrón**: Buscá un CUIT real (ej: 33710900979 para CRONEC S.R.L)

---

## Rollback (Si Algo Sale Mal)

Si necesitás volver a testing:

```bash
# Cambiar en .env
AFIP_ENVIRONMENT=testing

# O restaurar de un checkpoint anterior
# (usar la interfaz de Abacus.AI para restaurar)
```

---

## FAQ

**P**: ¿Cuánto tiempo tarda la aprobación del certificado?  
**R**: 24-48 horas, pero generalmente es al instante.

**P**: ¿Puedo cambiar entre testing y producción?  
**R**: Sí, pero es riesgoso. Mantenete en producción una vez migrado.

**P**: ¿Se pierden los datos si cambio certificado?  
**R**: No. Los datos (empresas, facturas, etc.) se mantienen.

**P**: ¿Qué pasa si el certificado expira?  
**R**: Renovalo 30 días antes. ARCA te enviará notificación.

**P**: ¿Puedo usar certificados de terceros?  
**R**: No, debe ser tu propio certificado de ARCA.

---

## Soporte

Para dudas sobre ARCA, visitá: https://www.arca.gob.ar/ayuda  
Para dudas sobre EMITIA, contactá tu admin.

---

**Versión**: 1.0  
**Última actualización**: April 11, 2026  
**Estado**: Listo para migración
