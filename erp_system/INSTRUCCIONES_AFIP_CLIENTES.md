# 🇦🇷 Guía de Configuración AFIP/ARCA - EMITIA

## Para clientes: Cómo configurar tu cuenta y empezar a facturar

Esta guía te ayudará a configurar tu certificado digital de AFIP en EMITIA para emitir facturas electrónicas con CAE real.

---

## Paso 1: Obtener tu Certificado Digital de AFIP

### Requisitos previos:
- Tenés que ser contribuyente en AFIP (tener CUIT activo)
- Acceso a tu cuenta en AFIP

### Instrucciones:

1. **Accedé a AFIP**
   - Entrá a https://www.afip.gob.ar/
   - Iniciá sesión con tu CUIT y contraseña

2. **Bajá tu certificado digital**
   - Buscá "Certificados digitales" o "MI.PRE" (Mis Preceptos)
   - Bajá tu certificado en formato `.crt` o `.cer`
   - **Importante**: Guardá el archivo en tu computadora en un lugar seguro

3. **Si no tenés certificado aún**
   - AFIP te generará uno automáticamente
   - Puede tardar unos minutos
   - Refrescá la página y volvé a intentar

---

## Paso 2: Accedé a EMITIA y cargá tu certificado

### 2.1 Ingresá a tu cuenta
- URL: https://emprenor.abacusai.app
- Usuario: tu email
- Contraseña: la que hayas elegido

### 2.2 Configurá AFIP
1. Clickeá en **Configuración** (engranaje en la esquina superior derecha o menú lateral)
2. Seleccioná la pestaña **AFIP**
3. Cargá tu certificado `.crt`
4. Ingresá tu **CUIT** (sin guiones: ejemplo: 20404923456)
5. Seleccioná tu **Condición de IVA**:
   - **Responsable Inscripto**: si facturás como empresa normal
   - **Monotributista**: si sos monotributista
   - **Exento**: si tenés exención IVA
6. Clickeá **Guardar**

---

## Paso 3: Configura datos de tu negocio

1. Ve a **Configuración** → **Datos Comerciales**
2. Completá:
   - **Nombre de negocio**: el nombre de tu empresa
   - **Domicilio**: tu dirección comercial
   - **Ciudad**: tu ciudad
   - **Teléfono**: tu número
   - **Email**: tu contacto
   - **Logo**: (opcional) tu logo de empresa
3. En la pestaña **Datos Fiscales**:
   - Confirmá tu **CUIT**
   - Seleccioná tu **Condición de IVA**
   - Ingresá la **fecha de inicio de actividades**
4. Clickeá **Guardar**

---

## Paso 4: Configura tu Punto de Venta (POS)

Cada negocio necesita al menos un "Punto de Venta" para facturar.

1. Ve a **Configuración** → **Puntos de Venta**
2. Clickeá **Nuevo Punto de Venta**
3. Ingresá:
   - **Número de POS**: generalmente 0001 (el primero)
   - **Descripción**: ejemplo "POS Local"
4. Clickeá **Crear**

---

## Paso 5: Prueba la conexión con AFIP

1. Ve a **Facturación** → **Emitir Comprobante**
2. Elegí el tipo de comprobante: **Factura Tipo C** (la más sencilla para probar)
3. Cargá un cliente de prueba o creá uno nuevo
4. Agregá un producto
5. Clickeá **Emitir** 
6. EMITIA conectará con AFIP y te dará un **CAE** (Código de Autorización Electrónico)
7. ¡Listo! Tu factura está emitida y válida

---

## Paso 6: Cargá tus productos e inventario

1. Ve a **Inventario**
2. Clickeá **Nuevo Producto**
3. Completá:
   - **Nombre**: nombre del producto
   - **SKU**: código interno (puede ser el código de barra)
   - **Precio**: precio de venta
   - **Costo**: costo de compra (para calcular ganancias)
   - **Stock**: cantidad disponible
4. Clickeá **Crear**

---

## Paso 7: Cargá tus clientes

1. Ve a **Clientes**
2. Clickeá **Nuevo Cliente**
3. Completá:
   - **Nombre**: nombre del cliente
   - **Documento**: CUIT, CUIL o DNI (sin guiones)
   - **Teléfono**: (opcional)
   - **Email**: (opcional pero recomendado)
4. Clickeá **Crear**

---

## Tipos de comprobantes que podés usar

### Factura Tipo A
- Para clientes **Responsables Inscriptos**
- Factura completa con todos los datos
- Mayor validación fiscal

### Factura Tipo B
- Para clientes **Monotributistas o Consumidores Finales**
- IVA incluido en el precio
- Más simple

### Factura Tipo C
- Para ventas a **Consumidor Final** (sin documento)
- La más usada en comercios
- Sin discriminación de IVA

### Nota de Crédito / Nota de Débito
- Para devoluciones (Nota de Crédito)
- Para ampliaciones (Nota de Débito)

---

## Solución de problemas

### "No me conecta con AFIP"
1. ✅ Verificá que cargaste correctamente tu certificado `.crt`
2. ✅ Verificá que tu CUIT es correcto (sin guiones)
3. ✅ Asegurate de estar en la red de tu negocio (no VPN externa)
4. ✅ Contactá soporte si el problema persiste

### "El CAE no me aparece"
- Probablemente AFIP está rechazando la factura por algún dato incorrecto
- Revisá:
  - Domicilio del cliente
  - Condición de IVA correcta
  - Documento sin espacios ni guiones

### "Mi certificado expiró"
- Bajá uno nuevo de AFIP
- Cargalo nuevamente en EMITIA
- Los certificados son válidos por 2 años

---

## Ambiente de prueba vs. Producción

**EMITIA está configurada en el ambiente de PRUEBA (TESTING) de AFIP**

Esto significa:
- ✅ Podés facturas ilimitadas para probar
- ✅ Los CAE que recibís son reales pero de prueba
- ✅ Las facturas NO tienen valor legal
- ⚠️ Cuando quieras usar en producción, AFIP te pedirá que cambies el certificado

**Para pasar a Producción:**
- Contactá a AFIP y solicitá tu certificado de **Producción**
- Cargalo en EMITIA
- Desde ese momento, todas tus facturas serán legales

---

## Tips para usar EMITIA

1. **Punto de Venta (POS)**: Ve a **Punto de Venta** para ventas rápidas sin dejar registro de clientes
2. **Ventas en crédito**: Usa **Cuentas Corrientes** para registrar lo que te deben
3. **Reportes**: Ve a **Reportes** para ver estadísticas de ventas
4. **Exportar**: Podés exportar a Excel todas tus facturas, clientes y productos

---

## ¿Necesitás ayuda?

- **Email de soporte**: soporte@emitia.com.ar
- **Horario**: Lunes a viernes, 9:00 a 18:00 (Argentina)
- **Respuesta**: Típicamente en 24 horas

---

## Próximos pasos después de configurar

1. **Integra MercadoPago** (Configuración → Medios de Pago) para recibir pagos online
2. **Invita usuarios** a tu empresa (solo si tenés empleados que necesiten acceso)
3. **Crea listas de precios** si tenés clientes con precios especiales
4. **Revisa tus reportes** regularmente para ver cómo va tu negocio

---

✅ **¡Ya estás listo para facturar!**
