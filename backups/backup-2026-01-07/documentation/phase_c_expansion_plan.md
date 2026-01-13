# Plan Fase C: Expansión Masiva y Datos Reales 🌍

## 🎯 Objetivo
Transformar ComexIA de una demo con datos sintéticos a una herramienta profesional con datos reales de **UN Comtrade** para más de **5,000 códigos HS**.

---

## 🏗️ Arquitectura de Sincronización

### 1. El Desafío: Rate Limits
La API gratuita de UN Comtrade tiene límites estrictos (ej. 1 solicitud/segundo, 100/hora).
Para 5,000 productos × 6 rutas, necesitaríamos 30,000 solicitudes.
**Solución:** "Goteo Constante" (Background Worker).

### 2. Nuevo Servicio: `ComtradeSyncService`
Un proceso en segundo plano que:
1.  Lee una cola de códigos HS pendientes.
2.  Hace 1 petición a la API.
3.  Guarda/Actualiza en `market_data`.
4.  Espera X segundos (Inteligente: ajusta según headers de respuesta).
5.  Repite.

### 3. Base de Datos
Necesitamos rastrear qué está actualizado y qué no.

**Nueva Tabla: `sync_status`**
```sql
CREATE TABLE sync_status (
  hs_code TEXT PRIMARY KEY,
  last_sync_date DATETIME,
  status TEXT, -- 'pending', 'synced', 'failed'
  error_message TEXT
);
```

**Modificación `market_data`**:
Ya usamos la columna `source` ('synthetic' vs 'comtrade').

---

## 🛠️ Implementación Técnica

### Paso 1: Configuración
- Obtener **API Key** de UN Comtrade (Gratuita o Premium).
- Agregar a `.env`: `COMTRADE_API_KEY=xxxxxxxx`.

### Paso 2: Script de Migración
- Ejecutar SQL para crear tablas de sync.
- Inicializar `sync_status` con todos los códigos HS conocidos (marcados como 'pending').

### Paso 3: Servicio de Sincronización (`backend/services/sync-worker.ts`)
```typescript
async function startWorker() {
  while(true) {
    const nextCode = await getNextPendingCode();
    if (!nextCode) break; // O dormir más tiempo

    try {
      const data = await Comtrade.fetch(nextCode);
      await saveToDb(data);
      await markAsSynced(nextCode);
    } catch (e) {
      await markAsFailed(nextCode, e);
    }
    
    await sleep(10000); // 10 segundos entre llamadas
  }
}
```

### Paso 4: Visualización
- Agregar indicador en el Frontend: 
  - "🟢 Datos Verificados (UN Comtrade)" 
  - "🟡 Datos Estimados (IA)"

---

## 📅 Plan de Acción

### Sprint C1: Infraestructura (Próximas 24h)
- [ ] Crear tabla `sync_status`.
- [ ] Implementar `sync-worker.ts`.
- [ ] Configurar `.env` con API Key.

### Sprint C2: Ejecución
- [ ] Iniciar Worker en servidor Railway/Local.
- [ ] Monitorear primeros 100 productos.
- [ ] Validar precisión de datos vs sintéticos.

### Sprint C3: Frontend
- [ ] Actualizar `HistoricalChart` para mostrar fuente.
- [ ] Mostrar fecha de última actualización.

---

## ⚠️ Requisito Crítico
Necesitamos una **API Key** válida de [UN Comtrade API Portal](https://comtradeapi.un.org/).
¿Tienes una cuenta creada? Si no, podemos usar una clave pública de prueba (muy limitada) o necesitas registrarte (es gratis para uso básico).
