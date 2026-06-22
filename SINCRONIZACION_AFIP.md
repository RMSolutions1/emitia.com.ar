# 🔄 SINCRONIZACIÓN AUTOMÁTICA CON AFIP

## 📋 Funcionalidad Implementada

Se agregó un sistema de sincronización automática que consulta a AFIP/ARCA los comprobantes autorizados en tu punto de venta y los compara con los registrados en el sistema EMITIA.

## ✨ Características

### 1. **Botón de Sincronización AFIP**
- Ubicado en la página de "Comprobantes Emitidos" (Facturas)
- Botón verde "Sincronizar AFIP" junto a "Nuevo Comprobante"
- Acceso rápido al estado de sincronización

### 2. **Modal de Estado de Sincronización**
Al hacer clic en "Sincronizar AFIP", se abre un modal que muestra:

#### Información General:
- **Punto de Venta** configurado
- **CUIT** de la empresa
- Estado de conexión con AFIP

#### Estado por Tipo de Comprobante:
Para cada tipo de documento (Factura A, B, C, NC A, NC B, NC C):
- ✅ **Último comprobante en AFIP**: Número más alto autorizado
- 📊 **Comprobantes locales**: Cantidad registrada en EMITIA
- 🔄 **Estado de sincronización**:
  - ✅ **Sincronizado**: Coinciden AFIP y sistema local
  - ⚠️ **Desincronizado**: Faltan comprobantes (muestra cuántos)
  - ❌ **Error**: Problema al consultar AFIP

### 3. **Verificación Automática**
- Consulta en tiempo real a los webservices de AFIP
- Compara automáticamente con la base de datos local
- Identifica discrepancias y comprobantes faltantes

## 🔧 Endpoints API Creados

### `GET /api/afip/sync-invoices`
Obtiene el estado actual de sincronización:
```json
{
  "success": true,
  "pointOfSale": 6,
  "cuit": "20401546228",
  "status": [
    {
      "code": "1",
      "name": "Factura A",
      "lastVoucherAFIP": 4,
      "localCount": 4,
      "synced": true
    },
    {
      "code": "6",
      "name": "Factura B",
      "lastVoucherAFIP": 10,
      "localCount": 8,
      "synced": false
    }
  ]
}
```

### `POST /api/afip/sync-invoices`
Ejecuta la sincronización:
```json
{
  "pointOfSale": 6,
  "documentCodes": ["1", "6", "11", "3", "8", "13"]
}
```

## 📊 Casos de Uso

### Caso 1: Sistema Nuevo
**Situación**: Acabás de configurar EMITIA pero ya tenías facturas emitidas desde otro sistema.

**Solución**:
1. Hacé clic en "Sincronizar AFIP"
2. El sistema te mostrará cuántas facturas hay en AFIP vs. en EMITIA
3. Podrás ver exactamente qué comprobantes faltan

### Caso 2: Verificación Diaria
**Situación**: Querés asegurarte de que todas las facturas del día están correctamente registradas.

**Solución**:
1. Al final del día, abrí "Sincronizar AFIP"
2. Verificá que todos los tipos de comprobantes estén sincronizados (✅)
3. Si hay discrepancias, investigá qué comprobantes faltan

### Caso 3: Auditoría
**Situación**: Necesitás verificar la integridad de tus registros contables.

**Solución**:
1. Usá "Sincronizar AFIP" para obtener un reporte completo
2. Compará los números de AFIP con tu sistema
3. Identificá y corregí cualquier discrepancia

## ⚠️ Limitaciones Actuales

1. **Solo Verificación**: La función actual solo **verifica** la cantidad de comprobantes, no los importa automáticamente.

2. **Importación Manual**: Si detectás comprobantes faltantes emitidos desde otro sistema, contactá a soporte para importarlos.

3. **Tipos de Comprobante**: Actualmente verifica:
   - Factura A (001)
   - Factura B (006)
   - Factura C (011)
   - Nota de Crédito A (003)
   - Nota de Crédito B (008)
   - Nota de Crédito C (013)

## 🚀 Próximas Mejoras

- [ ] Importación automática de comprobantes faltantes
- [ ] Sincronización programada (cada X horas)
- [ ] Notificaciones de discrepancias
- [ ] Exportación de reporte de sincronización
- [ ] Soporte para más tipos de comprobantes (Recibos, FCE, etc.)

## 📝 Notas Técnicas

### Archivos Modificados:
- `app/api/afip/sync-invoices/route.ts` (NUEVO)
- `app/facturas/facturas-client.tsx` (MODIFICADO)

### Dependencias:
- Usa las funciones existentes de `@/lib/afip`:
  - `getLastAuthorizedVoucher()`
  - `getCompanyCuit()`
- Consulta la base de datos Prisma para contar comprobantes locales

### Seguridad:
- ✅ Requiere autenticación (sesión activa)
- ✅ Multi-tenancy: Solo muestra datos de la empresa del usuario
- ✅ Superadmins tienen acceso global

## 💡 Consejos de Uso

1. **Ejecutá la sincronización al menos 1 vez por día** para mantener el control.
2. **Antes de cerrar el mes**, verificá que todo esté sincronizado.
3. **Si ves discrepancias**, no entres en pánico: puede ser que hayas emitido facturas desde otro sistema o que haya un error temporal de AFIP.
4. **Guardá capturas de pantalla** del estado de sincronización para tus registros contables.

---

**Fecha de Implementación**: $(date +%Y-%m-%d)
**Versión**: 1.0
**Estado**: ✅ Funcional y Testeado
