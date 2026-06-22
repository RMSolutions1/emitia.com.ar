# 📘 EMITIA - Guía Completa de Usuario Final

**Versión**: 1.0  
**Última actualización**: Abril 11, 2026  
**Para**: Usuarios y Clientes EMITIA  

---

## 🎯 Introducción

Bienvenido a **EMITIA**, tu plataforma profesional de facturación electrónica y gestión empresarial.

Esta guía te mostrará paso a paso cómo:
- ✅ Crear tu cuenta
- ✅ Configurar tu empresa
- ✅ Conectar con AFIP (para Argentina)
- ✅ Agregar productos/servicios
- ✅ Emitir facturas y tickets
- ✅ Gestionar tu punto de venta (POS)
- ✅ Monitorear ventas y reportes

---

## SECCIÓN 1: INICIO DE SESIÓN Y REGISTRO

### 1.1 Crear tu cuenta

**Paso 1**: Ve a https://emprenor.abacusai.app

**Paso 2**: Haz clic en "Probar Gratis" o "Regístrate Aquí"

**Paso 3**: Completa el formulario:
```
Nombre Completo:     [Tu nombre]
Email:              [Tu correo empresarial] *
Contraseña:         [Mínimo 8 caracteres]
Confirmar:          [Repite la contraseña]
```

**Paso 4**: Haz clic en "Crear Cuenta"

✅ **¡Listo!** Serás redirigido automáticamente al panel de control.

---

### 1.2 Iniciar sesión después

**Si ya tienes cuenta:**

1. Ve a https://emprenor.abacusai.app/login
2. Ingresa tu email y contraseña
3. Haz clic en "Iniciar Sesión"

**¿Olvidaste tu contraseña?**  
*(Esta función estará disponible próximamente)*

---

## SECCIÓN 2: CONFIGURACIÓN INICIAL

### 2.1 Datos Comerciales de tu Empresa

**¿Dónde?** Menú Izquierdo → Configuración → Pestaña "Datos Comerciales"

**Información a completar:**

| Campo | Ejemplo | Obligatorio |
|-------|---------|------------|
| **Nombre Comercial** | Test Enterprise SRL | ✅ Sí |
| **Razón Social** | Test Enterprise Sociedad de Responsabilidad Limitada | ✅ Sí |
| **Teléfono** | +54 11 5555-8888 | ✅ Recomendado |
| **Email** | contacto@empresa.com.ar | ✅ Recomendado |
| **Sitio Web** | https://www.empresa.com.ar | ❌ Opcional |
| **Dirección** | Av. Corrientes 1234 | ✅ Recomendado |
| **Ciudad** | Buenos Aires | ✅ Recomendado |
| **Provincia** | CABA | ✅ Recomendado |
| **Código Postal** | C1043AAE | ✅ Recomendado |

**Paso a Paso:**
1. Abre la página de Configuración
2. Completa los campos
3. Haz clic en "Guardar Cambios" (botón azul)
4. Verás un mensaje de confirmación ✅

---

### 2.2 Datos Fiscales (MUY IMPORTANTE)

**¿Dónde?** Configuración → Pestaña "Datos Fiscales"

**⚠️ IMPORTANTE**: Esta información debe coincidir exactamente con lo registrado en AFIP

#### a) CUIT / CUIL

**¿Cuál es tu CUIT?**

- Si eres **Empresa**: Tu CUIT de empresa (11 dígitos)
  - Formato: XX-XXXXXXXX-X
  - Ejemplo: 30-71234567-8

- Si eres **Persona Física (Monotributista)**: Tu DNI como CUIT
  - Formato: XX-XXXXXXXX-X
  - Ejemplo: 20-40154622-8

**¿Dónde encontrar tu CUIT?**

1. **Online en AFIP**: https://www.afip.gob.ar
2. **En tu certificado digital**
3. **En tus documentos tributarios** (facturas, formularios)
4. **Escribiendo el CUIT en**: https://www.cuitonline.com (sin guiones)

**Ingresalo en el formato**: XX-XXXXXXXX-X

#### b) Condición ante IVA

**¿Qué significa?** Es tu estatus fiscal en AFIP

**Opciones según tu tipo de negocio:**

```
📌 IVA RESPONSABLE INSCRIPTO (Recomendado)
   - Empresas que facturan >$50,000 mensuales
   - Pueden emitir todas las facturas
   - Pueden recuperar IVA

📌 MONOTRIBUTISTA
   - Pequeños emprendimientos
   - Ingresos anuales < $928,000 (2026)
   - Emiten Factura C

📌 CONSUMIDOR FINAL
   - Solo compran (no venden regularmente)

📌 NO RESPONSABLE
   - Exentos de IVA
   - Actividades específicas
```

**¿Cuál es la tuya?**  
→ Comprobalo en: https://www.afip.gob.ar → Mi AFIP → Trámites

#### c) Número IIBB (Ingresos Brutos)

**¿Qué es?** Impuesto provincial sobre los ingresos

**Ejemplo**: 901-123456-7

**¿Dónde encontrarlo?**
- En tu certificado de registración provincial
- En tus declaraciones juradas de IIBB
- Consultando a tu contador

#### d) Punto de Venta Activo

**¿Qué es?** El número de POS autorizado en AFIP (ejemplo: 0001)

**Importante**: Este POS debe estar:
1. ✅ Registrado en AFIP
2. ✅ Activo y autorizado
3. ✅ En el mismo CUIT

#### e) Fecha de Inicio de Actividades

**Formato**: dd/mm/yyyy  
**Ejemplo**: 15/03/2024

**¿Dónde encontrarla?** En tu certificado de inscripción de AFIP

#### f) Alícuota IVA General

**Por defecto**: 21% (vigente en 2026)

Esto afecta automáticamente a todas tus facturas, a menos que especifiques otro porcentaje en artículos específicos.

---

### 2.3 Conectar con AFIP para Facturación Electrónica

**Este es el paso más importante** ⭐

#### Paso 1: Obtener tu certificado digital de AFIP

**Opción A: Ya tengo certificado de prueba (homologación)**
- Sigues siendo el usuario de prueba
- Tus facturas NO son válidas legalmente
- Sirve solo para aprender

**Opción B: Quiero usar producción real (RECOMENDADO)**
- Necesitas obtener certificado de **PRODUCCIÓN** de AFIP

**¿Cómo obtener certificado de producción?**

1. Entra a: https://www.arca.gob.ar
2. Inicia sesión con tu Clave Fiscal (nivel 3+)
3. Ve a: "Administración de Certificados Digitales"
4. Haz clic en: "Solicitar Certificado"
5. Selecciona: "Certificado de PRODUCCIÓN"
6. Completa los datos de tu empresa
7. Haz clic en: "Solicitar"
8. **Espera**: 24-48 horas (generalmente al instante)
9. Recibirás email de confirmación
10. Descarga el certificado en formato .pem

#### Paso 2: Configurar el certificado en EMITIA

**¿Dónde?** Configuración → Pestaña "ARCA/AFIP"

**Campos:**
- **Certificado (PEM)**: Tu archivo .pem del certificado
- **Clave Privada (PEM)**: Tu archivo .pem de la clave
- **Ambiente**: Selecciona "Producción"

**¿Cómo preparar los archivos?**

Si descargaste .pem:
```bash
# Convertir a base64 (necesario para EMITIA)
cat certificado.pem | base64 -w 0 > cert_base64.txt
cat clave_privada.pem | base64 -w 0 > key_base64.txt

# Copiar el contenido de cert_base64.txt
# Pegarlo en el campo "Certificado (PEM)"

# Copiar el contenido de key_base64.txt
# Pegarlo en el campo "Clave Privada (PEM)"
```

Si descargaste .pfx (formato alternativo):
```bash
# Extraer certificado
openssl pkcs12 -in certificado.pfx -clcerts -nokeys -out cert.pem

# Extraer clave privada
openssl pkcs12 -in certificado.pfx -nocerts -nodes -out key.pem

# Luego convertir a base64 como arriba
```

**Haz clic en "Guardar Cambios"**

✅ **¡Listo!** Tu EMITIA está conectada con AFIP

---

## SECCIÓN 3: GESTIONAR INVENTARIO

### 3.1 Agregar Productos/Servicios

**¿Dónde?** Menú Izquierdo → "Inventario"

**Paso 1**: Haz clic en el botón azul "+Nuevo Producto"

**Paso 2**: Completa el formulario:

| Campo | Descripción | Ejemplo |
|-------|-------------|----------|
| **Nombre*** | Descripción del producto | Monitor LED 24" |
| **SKU*** | Código único del artículo | MONITOR-001 |
| **Precio*** | Precio de venta unitario | 2499.99 |
| **Costo** | Costo de compra (opcional) | 1800.00 |
| **Stock** | Cantidad en almacén | 50 |
| **Stock Mínimo** | Alerta cuando baja de este nivel | 5 |
| **Categoría** | Tipo de producto (ej: Electrónica) | Electrónica |

**Paso 3**: Haz clic en "Crear"

✅ El producto aparecerá en tu inventario

### 3.2 Editar o Eliminar Productos

**En la tabla de Inventario:**

- **Icono Lápiz** 🖊️ → Editar el producto
- **Icono Papelera** 🗑️ → Eliminar del inventario

---

## SECCIÓN 4: EMITIR FACTURAS

### 4.1 Primeros pasos

**¿Dónde?** Menú Izquierdo → "Facturación" → "Emitir Comprobante"

### 4.2 Seleccionar tipo de comprobante

**¿Qué tipo emito?**

```
📄 FACTURA A
   - Para IVA Responsables Inscritos
   - Discrimina IVA
   - Válida legalmente

📄 FACTURA B
   - Para Monotributistas o IVA Responsables
   - NO discrimina IVA
   - Más común

📄 FACTURA C
   - Para Monotributistas
   - Solo ingresos
   - Máximo $928,000 anuales

📄 NOTA DE DÉBITO / CRÉDITO
   - Ajustes a facturas anteriores
```

### 4.3 Buscar cliente

1. Ingresa el **CUIT o DNI** del cliente
2. El sistema buscará en:
   - Tu base de datos
   - Padrón de AFIP (automático)
   - Base de datos fallback
3. Si existe, se completan automáticamente:
   - Nombre
   - Dirección
   - Ciudad
   - Condición IVA

**Si no existe el cliente:**
- Se creará automáticamente
- Se cargarán sus datos de AFIP

### 4.4 Agregar items a la factura

**Paso 1**: Haz clic en "+Agregar Artículo"

**Paso 2**: Selecciona el producto

**Paso 3**: Ingresa:
- Cantidad
- Precio Unitario
- Descuento (opcional)

**Paso 4**: El sistema calcula automáticamente:
- Subtotal
- IVA (21%)
- Total

### 4.5 Emitir la factura

1. Verifica todos los datos
2. Haz clic en "Emitir Comprobante"
3. El sistema enviará a AFIP y recibirá el **CAE** (Código de Autorización Electrónica)
4. Se imprime automáticamente el PDF

✅ **¡Factura emitida!** Válida ante AFIP y tus clientes

**CAE**: Tu comprobante tiene autorización fiscal

---

## SECCIÓN 5: PUNTO DE VENTA (POS)

### 5.1 Acceder al POS

**¿Dónde?** Menú Izquierdo → "Punto de Venta"

### 5.2 Flujo de venta rápida

1. **Buscar producto**: Escribe el nombre o SKU
2. **Agregar a carrito**: Cantidad automática
3. **Seleccionar cliente** (opcional): Buscar por documento
4. **Método de pago**: 
   - 💵 Efectivo
   - 💳 Tarjeta (MercadoPago)
   - ✓ Otro método
5. **Procesar pago**:
   - **Si es efectivo**: Ingresar monto recibido, calcula cambio
   - **Si es MercadoPago**: Se abre ventana de pago
6. **Generar ticket**: No-fiscal (imprime recibo)

### 5.3 Diferencia: Ticket vs Factura

```
🎟️ TICKET (No-Fiscal)
   - Para ventas rápidas
   - Solo recibo de pago
   - No es válido fiscalmente
   - Se imprime al momento

📄 FACTURA (Comprobante)
   - Válida legalmente
   - Tiene CAE de AFIP
   - Puede ser A, B o C
   - Más formal
```

---

## SECCIÓN 6: VER HISTORIAL DE VENTAS Y FACTURAS

### 6.1 Ventas

**¿Dónde?** Menú Izquierdo → "Ventas"

**Verás:**
- Todas tus ventas
- Fecha y hora
- Cliente
- Monto total
- Estado del pago

**Filtros disponibles:**
- Por rango de fechas
- Por cliente
- Por estado

### 6.2 Facturas

**¿Dónde?** Menú Izquierdo → "Facturas"

**Información mostrada:**
- Número de factura
- Tipo (A, B, C, etc.)
- Cliente
- Fecha
- Total
- CAE
- Estado (Emitida, Anulada)

**Acciones:**
- 👁️ Ver detalles
- 📥 Descargar PDF
- ❌ Anular factura (si es necesario)

---

## SECCIÓN 7: REPORTES Y DASHBOARD

### 7.1 Dashboard Principal

**¿Dónde?** Menú Izquierdo → "Dashboard"

**Verás:**

**📊 Gráficos:**
- Ventas por día
- Ingresos acumulados
- Productos más vendidos

**📈 Estadísticas:**
- Total de ventas (hoy, mes, año)
- Total de facturas emitidas
- Clientes registrados
- Stock disponible

### 7.2 Reportes Detallados

**¿Dónde?** Menú Izquierdo → "Reportes"

**Disponibles:**
- Reporte de ventas
- Reporte de inventario
- Reporte de clientes
- Análisis de ingresos
- Export a Excel

---

## SECCIÓN 8: GESTIONAR CLIENTES

### 8.1 Agregar cliente manual

**¿Dónde?** Menú Izquierdo → "Clientes" → "+Nuevo Cliente"

**Información:**
- Nombre
- Documento (DNI/CUIT)
- Email
- Teléfono
- Dirección
- Condición IVA

### 8.2 Ver historial de cliente

**En la tabla de Clientes:**
- Haz clic en el cliente
- Ver todas sus facturas
- Ver todas sus compras
- Ver saldo pendiente

---

## SECCIÓN 9: INTEGRACIÓN CON MERCADOPAGO

### 9.1 Configurar MercadoPago

**¿Dónde?** Configuración → "Integraciones" → "MercadoPago"

**Necesitas:**
- Access Token de MercadoPago
- Public Key

**¿Cómo obtenerlos?**

1. Ve a: https://www.mercadopago.com.ar (Argentina)
2. Inicia sesión / Crea cuenta
3. Ve a: Configuración → Credenciales
4. Copia tus claves
5. Pégalas en EMITIA
6. Haz clic en "Guardar"

**Para qué sirve:**
- Cobrar en el POS con tarjeta
- Recibir dinero al instante
- Ver transacciones en tiempo real

---

## PREGUNTAS FRECUENTES

### P: ¿Cuánto cuesta EMITIA?
**R:** $29.99 USD/mes (Plan Enterprise)

### P: ¿Puedo tener múltiples POS?
**R:** Sí, y puedes controlar cada uno desde el mismo panel

### P: ¿Las facturas son válidas ante AFIP?
**R:** Sí, si estás en **Producción** con certificado válido

### P: ¿Se pierden mis datos si cancelo?
**R:** No, tus datos se conservan 6 meses

### P: ¿Puedo integrar con mi contador?
**R:** Sí, exporta a Excel desde Reportes

### P: ¿Funciona sin internet?
**R:** No, EMITIA es cloud-only (necesita conexión)

### P: ¿Puedo usar en móvil?
**R:** Sí, funciona en cualquier navegador

### P: ¿Cuántas empresas puedo administrar?
**R:** Puedes crear múltiples cuentas

---

## SOPORTE

**¿Problema o duda?**

📧 Email: support@emitia.com  
💬 Chat en vivo: (Próximamente)  
📞 Teléfono: (Próximamente)  

---

**Última actualización**: Abril 11, 2026  
**Versión**: 1.0  

¡Gracias por usar EMITIA! 🎉
