# 🔐 EMITIA - Guía de Configuración AFIP/ARCA

**Para**: Administradores y Usuarios Técnicos  
**Versión**: 1.0  
**Última actualización**: Abril 11, 2026  

---

## ¿QUÉ ES AFIP Y POR QUÉ LA NECESITO?

**AFIP** = Administración Federal de Ingresos Públicos (Argentina)  
**ARCA** = Administración de Certificados Digitales

**Es obligatorio si:**
- ✅ Facturas facturas electrónicas (A, B, C)
- ✅ Tienes ingresos brutos
- ✅ Necesitas CAE (Código de Autorización Electrónica)
- ✅ Quieres emitir comprobantes válidos legalmente

---

## PASO 1: OBTENER CERTIFICADO DIGITAL

### Opción A: Certificado de TESTING (Aprendizaje)

**¿Para qué sirve?**
- Aprender a usar EMITIA
- Probar facturas sin validez legal
- No tiene costo

**¿Cuál es el problema?**
- Tus facturas NO son válidas
- Los clientes NO pueden usarlas
- Solo es para pruebas

**Ya tienes uno si:**
- Recibiste las credenciales de testing
- Tienes certificado "emprenor" en ARCA homotestigo

---

### Opción B: Certificado de PRODUCCIÓN (RECOMENDADO)

**¿Para qué sirve?**
- ✅ Emitir facturas VÁLIDAS
- ✅ Recibir CAE de AFIP
- ✅ Cumplir legalmente
- ✅ Facturación real

**¿Cuánto cuesta?**
- GRATIS

**¿Cuánto tarda?**
- 24-48 horas (generalmente 5-10 minutos)

---

## PASO 2: SOLICITAR CERTIFICADO DE PRODUCCIÓN EN ARCA

### Requisitos:
- ✅ Clave Fiscal de AFIP (nivel 3 mínimo)
- ✅ Acceso a https://www.arca.gob.ar (portal oficial)
- ✅ Navegador actualizado

### Instrucciones Detalladas:

**1. Entra a ARCA**
```
URL: https://www.arca.gob.ar
(NO uses "homotestigo" - usa producción)
```

**2. Inicia sesión**
```
Usuario: Tu CUIT o número de solicitud
Contraseña: Tu Clave Fiscal
Verificación 2FA: Completa el segundo factor
```

**3. Busca "Administración de Certificados Digitales"**
```
Puede estar bajo:
- Mi AFIP
- Servicios
- Trámites
- Certificados Digitales
```

**4. Click en "Solicitar Certificado"**

**5. Selecciona:**
```
✅ Certificado de PRODUCCIÓN (no testing)
```

**6. Completa formulario:**
```
Razón Social:        [Tu empresa]
CUIT:               [Tu CUIT]
Tipo de Solicitud:  [Web Services - AFIP]
Propósito:          [Facturación Electrónica]
```

**7. Envía solicitud**

**8. Espera confirmación**
```
📧 Recibirás email cuando esté listo
Generalmente: 5 minutos a 24 horas
```

**9. Descarga el certificado**
```
Vuelve a ARCA → Mis Certificados
Haz click en "Descargar"
Formatos disponibles: .pem o .pfx
(Elige .pem si es posible)
```

---

## PASO 3: PREPARAR EL CERTIFICADO

### Si descargaste .PEM (Recomendado)

**El archivo .pem es un texto base64**

**Opción 1: Windows (PowerShell)**
```powershell
# Convertir a base64
$content = Get-Content -Path "C:\ruta\certificado.pem" -Raw
$base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($content))
$base64 | Out-File -FilePath "C:\ruta\cert_base64.txt"

# Copiar a portapapeles
Get-Content "C:\ruta\cert_base64.txt" | Set-Clipboard
```

**Opción 2: Mac/Linux**
```bash
# Convertir certificado a base64
cat certificado.pem | base64 -w 0 > cert_base64.txt

# Copiar contenido
cat cert_base64.txt | pbcopy  # (Mac)
cat cert_base64.txt | xclip   # (Linux)

# Convertir clave privada
cat clave_privada.pem | base64 -w 0 > key_base64.txt
```

**Opción 3: Online (si no tienes terminal)**
```
1. Ve a: https://www.base64encode.org
2. Copia el contenido de tu certificado.pem
3. Pega en el campo
4. Click en "Encode"
5. Copia el resultado
```

---

### Si descargaste .PFX (Formato encriptado)

**Necesitas extraerlo primero**

**Opción 1: Usar OpenSSL (recomendado)**

```bash
# IMPORTANTE: Necesitas OpenSSL instalado

# Extraer el certificado
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out cert.pem

# Extraer la clave privada (te pedirá contraseña)
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out key.pem

# Convertir a base64
cat cert.pem | base64 -w 0 > cert_base64.txt
cat key.pem | base64 -w 0 > key_base64.txt
```

**¿Dónde está la contraseña?**
- ARCA te la envía por email
- Es única para ese certificado

**Opción 2: Usar herramienta online**
```
1. Ve a: https://convertpfx.com
2. Sube tu .pfx
3. Ingresa la contraseña
4. Descarga cert.pem y key.pem
5. Convierte a base64 como arriba
```

---

## PASO 4: CONFIGURAR EN EMITIA

### Donde entra la información

**URL**: https://emprenor.abacusai.app/configuracion

**Sección**: ARCA/AFIP (parte superior)

### Campos a completar:

**1. Certificado (PEM)***
```
- Pega el contenido completo de cert_base64.txt
- Comienza con: LS0tLS1CRUdJTi...
- Termina con: ...Y3JlQ3V1VFEwPT1LS0tLS1FTkQ=
```

**2. Clave Privada (PEM)***
```
- Pega el contenido completo de key_base64.txt
- Comienza con: LS0tLS1CRUdJTi...
- Termina con: ...UxMFA0LmZy4xPT0tLS01FTkQ=
```

**3. Ambiente***
```
✅ SELECCIONA: Producción
(NO testing)
```

**4. CUIT***
```
- Debe coincidir con el del certificado
- Formato: XX-XXXXXXXX-X
- Ejemplo: 20-40154622-8
```

### Validación

Antes de guardar, EMITIA verificará:
- ✅ Certificado válido (no expirado)
- ✅ La clave coincida con el certificado
- ✅ El CUIT sea correcto
- ✅ El ambiente sea soportado

---

## PASO 5: GUARDAR Y PROBAR

**Haz click en "Guardar Cambios"**

```
✅ Verde: Configuración exitosa
❌ Rojo: Error - revisa los pasos anteriores
```

### Prueba tu conexión AFIP

**1. Ve a**: Facturación → Emitir Comprobante

**2. Busca un cliente con CUIT real**
```
Ejemplo: 33-71099779-9 (CRONEC S.R.L)
O cualquier otro CUIT válido
```

**3. Crea una factura de prueba**
```
- Monto: $1 (mínimo)
- Cliente: Real o generado
- Tipo: Factura B (más simple)
```

**4. Emite la factura**
```
✅ ÉXITO: Recibirás un CAE (ej: 1234567890123)
❌ ERROR: Revisa que el Punto de Venta esté habilitado en AFIP
```

**5. Verifica**
```
Ve a: Facturas
Busca tu comprobante de prueba
Debe mostrar el CAE
```

---

## TROUBLESHOOTING (Solución de Problemas)

### Error: "Certificado inválido"

**Posibles causas:**
```
❌ Base64 incorrecto
   → Verifica que no haya espacios en blanco

❌ Certificado expirado
   → Solicita uno nuevo en ARCA

❌ CUIT no coincide
   → Verifica que sea el correcto

❌ Formato .pem incorrecto
   → Descarga nuevamente de ARCA
```

### Error: "Clave privada no coincide"

**Solución:**
```
1. Descarga nuevamente los archivos de ARCA
2. Asegúrate de usar:
   - Certificado (.pem o .crt) para el campo "Certificado"
   - Clave privada (.pem o .key) para el campo "Clave"
3. Convierte ambos a base64
4. Pega en los campos correctos
```

### Error: "Punto de Venta no autorizado"

**Solución:**
```
1. Ve a AFIP (www.afip.gob.ar)
2. Verifica que tu POS esté registrado
3. El POS debe estar en el mismo CUIT
4. Debe estar "Activo"
5. Recarga EMITIA
```

### Error: "Ambiente no soportado"

**Solución:**
```
Selecciona "Producción" en el dropdown
NO uses "Testing" a menos que sea para aprender
```

---

## DIFERENCIA ENTRE TESTING Y PRODUCCIÓN

| Aspecto | Testing | Producción |
|---------|---------|------------|
| **URL AFIP** | awshomo.afip.gov.ar | aws.afip.gov.ar |
| **Certificado** | De prueba/homologación | Real/vigente |
| **CAE** | No se otorga | Válido y legal |
| **Padrón** | Sin datos reales | Datos actuales de AFIP |
| **Validez fiscal** | ❌ No | ✅ Sí |
| **Para qué** | Aprender | Facturación real |

---

## CHECKLIST FINAL

Antes de emitir tu primera factura:

- [ ] ✅ Certificado de Producción obtenido de ARCA
- [ ] ✅ Base64 del certificado preparado
- [ ] ✅ Base64 de la clave privada preparado
- [ ] ✅ CUIT verificado y coincide
- [ ] ✅ Punto de Venta activo en AFIP
- [ ] ✅ Datos comerciales y fiscales completados en EMITIA
- [ ] ✅ Certificado y clave pegados en EMITIA
- [ ] ✅ Ambiente puesto en "Producción"
- [ ] ✅ Cambios guardados
- [ ] ✅ Prueba de conexión exitosa
- [ ] ✅ Primera factura emitida con CAE

---

## PREGUNTAS FRECUENTES

**P: ¿Necesito certificado para ver el dashboard?**  
R: No, solo para emitir facturas

**P: ¿Puedo cambiar de testing a producción después?**  
R: Sí, solo reconfigura el certificado

**P: ¿Qué pasa si mi certificado vence?**  
R: AFIP te avisa 30 días antes. Solicita uno nuevo

**P: ¿Puedo usar el mismo certificado en múltiples POS?**  
R: Sí, siempre y cuando sean del mismo CUIT

**P: ¿Cuál es el formato correcto del CUIT?**  
R: XX-XXXXXXXX-X (con guiones)

---

## CONTACTO Y SOPORTE

**AFIP Oficial**: https://www.afip.gob.ar  
**ARCA Portal**: https://www.arca.gob.ar  
**EMITIA Support**: support@emitia.com  

---

**Última actualización**: Abril 11, 2026  
**Versión**: 1.0  

✅ **¡Listo! Tu EMITIA está conectada con AFIP en Producción**
