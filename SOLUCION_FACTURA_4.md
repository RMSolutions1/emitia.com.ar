# 🔧 SOLUCIÓN: Problema de Número de Factura Incorrecto al Imprimir

## 📋 Problema Identificado

Cuando se emitía una factura (ej: Factura A 0006-00000004 con CAE), al intentar imprimirla 
inmediatamente después de la emisión, aparecía un número diferente (ej: 0006-00000030).

## 🔍 Causa Raíz

El flujo de emisión de facturas tiene estos pasos:

1. **POST /api/invoices**: Crea la factura en BD con un número temporal/estimado
2. **POST /api/afip/invoice**: Solicita CAE a AFIP
3. **AFIP responde** con el número REAL de comprobante
4. **UPDATE en BD**: El endpoint de AFIP actualiza la factura con el número real
5. **Modal de éxito**: Se muestra el comprobante para imprimir

**EL PROBLEMA**: El objeto `createdInvoice` que se usa en el modal de impresión 
se construye ANTES del paso 4, por lo que contiene el número temporal, no el real.

## ✅ Solución Implementada

Se agregó un paso adicional después de obtener el CAE exitosamente:

```typescript
// CRITICAL FIX: Refresh invoice data from DB to get the real AFIP number
if (afipSuccess && data.invoice?.id) {
  try {
    const refreshRes = await fetch(`/api/invoices/${data.invoice.id}`);
    if (refreshRes.ok) {
      const refreshedInvoice = await refreshRes.json();
      // Update the invoice number with the real one from AFIP
      data.invoice.invoiceNumber = refreshedInvoice.invoiceNumber;
      data.invoice.sequenceNumber = refreshedInvoice.sequenceNumber;
      afipComprobanteNum = refreshedInvoice.sequenceNumber || afipComprobanteNum;
    }
  } catch (refreshError) {
    console.warn('Could not refresh invoice data:', refreshError);
  }
}
```

## 📁 Archivo Modificado

- `app/facturacion/emitir/emitir-factura-client.tsx` (líneas ~698-714)

## 🎯 Resultado

Ahora, cuando se emite una factura:
1. Se crea en BD con número temporal
2. Se obtiene CAE de AFIP con número real
3. **NUEVO**: Se refresca la factura desde la BD
4. El modal de impresión muestra el número CORRECTO (el de AFIP)

## ✅ Testing

Para verificar que funciona:
1. Emitir una Factura A con CAE
2. Verificar que el número mostrado en el modal coincide con el CAE
3. Imprimir y verificar que el PDF tiene el número correcto
4. Verificar en el listado de facturas que el número es el mismo

