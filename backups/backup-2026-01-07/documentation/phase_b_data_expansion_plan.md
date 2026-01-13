# Plan Dual: Fase B + Expansión de Datos Completa

## 🎯 Objetivos Duales

### Track 1: Fase B - Visualización Frontend
Implementar gráficos interactivos para mostrar tendencias históricas y proyecciones.

### Track 2: Datos Reales Completos
Expandir de 6 productos a **2500 códigos HS** usando la API de UN Comtrade.

---

## 📊 TRACK 1: Fase B - Visualización Frontend

### 1.1 Componente de Gráfico Histórico
**Ubicación:** `src/components/market-analysis/historical-chart.tsx`

**Tecnología:** Recharts (ya en dependencies)

**Características:**
- **Línea Sólida:** Datos históricos reales (2018-2024)
- **Línea Punteada:** Proyección 2025-2026 basada en regresión
- **Área Sombreada:** Margen de error (±10%)
- **Tooltip Interactivo:** Valores exactos al hover

**Código Base:**
```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={historicalData}>
    <XAxis dataKey="year" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line 
      type="monotone" 
      dataKey="valueUsd" 
      stroke="#00d4ff" 
      strokeWidth={2}
      name="Histórico"
    />
    <Line 
      type="monotone" 
      dataKey="projected" 
      stroke="#00d4ff" 
      strokeWidth={2}
      strokeDasharray="5 5"
      name="Proyección"
    />
  </LineChart>
</ResponsiveContainer>
```

### 1.2 Indicador de Confianza Visual
**Ubicación:** `src/components/market-analysis/confidence-badge.tsx`

**Diseño:**
- 🟢 **Alta:** Badge verde con ícono de check
- 🟡 **Media:** Badge amarillo con ícono de advertencia
- 🔴 **Baja:** Badge rojo con ícono de información

### 1.3 Integración en Página de Análisis
**Archivo:** `src/pages/analysis.tsx` (o donde esté el análisis de mercado)

**Layout:**
```
┌─────────────────────────────────────┐
│  Market Size: $87M USD              │
│  🟢 Alta Confianza (7 años datos)   │
├─────────────────────────────────────┤
│  [Gráfico Histórico + Proyección]  │
├─────────────────────────────────────┤
│  Crecimiento: 14.87% CAGR           │
│  Tendencia: Growing ↗               │
└─────────────────────────────────────┘
```

---

## 🌍 TRACK 2: Datos Reales para TODOS los Productos

### 2.1 Estrategia de Ingesta de Datos

#### Opción A: UN Comtrade API (Recomendado)
**Ventajas:**
- Datos oficiales de comercio internacional
- Cobertura global (200+ países)
- Histórico desde 2000
- **GRATIS** (con límite de 100 requests/hora)

**Limitaciones:**
- Rate limit: 100 req/hora
- Para 2500 códigos × 6 rutas × 7 años = ~105,000 requests
- **Tiempo estimado:** ~1050 horas (43 días) con throttling

**Solución:** Ingesta incremental en background

#### Opción B: Datos Sintéticos Inteligentes
**Ventajas:**
- Inmediato (minutos)
- Sin límites de API
- Controlable

**Método:**
- Usar patrones reales de comercio por capítulo HS
- Aplicar multiplicadores por país (PIB, distancia, tratados)
- Agregar ruido estadístico realista

### 2.2 Implementación Híbrida (Recomendado)

**Fase 2.1: Datos Sintéticos Avanzados (Inmediato)**
```typescript
// database/seeds/seed-all-market-data.ts
for (const hsCode of all2500Codes) {
  const chapter = hsCode.substring(0, 2);
  const baseValue = getChapterBaseValue(chapter); // Ej: Cap 02 = $500M
  const countryMultiplier = getCountryGDP(country) / 1000;
  
  for (const year of [2018...2024]) {
    const value = baseValue * countryMultiplier * growthCurve(year);
    // Insert into market_data
  }
}
```

**Fase 2.2: Comtrade Backfill (Background Job)**
```typescript
// backend/jobs/comtrade-sync.ts
async function syncComtradeData() {
  const queue = await getUnsynced HsCodes();
  
  for (const hsCode of queue) {
    if (rateLimitOk()) {
      const realData = await ComtradeService.getHistoricalData(hsCode);
      await db.update(marketData).set({ source: 'comtrade', ...realData });
      await sleep(36000); // 1 hora / 100 = 36 seg
    }
  }
}
```

### 2.3 Arquitectura de Datos

**Nueva Columna en `market_data`:**
```sql
ALTER TABLE market_data ADD COLUMN source TEXT DEFAULT 'synthetic';
-- Values: 'synthetic' | 'comtrade' | 'manual'
```

**Prioridad de Uso:**
1. Si existe `source='comtrade'` → Usar (Máxima confianza)
2. Si existe `source='synthetic'` → Usar (Media confianza)
3. Si no existe → Fallback a cálculo mock (Baja confianza)

---

## 📅 Plan de Ejecución

### Sprint 1: Visualización (Hoy)
- [x] Fase A completada
- [ ] Crear `historical-chart.tsx`
- [ ] Crear `confidence-badge.tsx`
- [ ] Integrar en página de análisis
- [ ] Agregar endpoint `/api/market-analysis/historical/:hsCode/:country`

### Sprint 2: Datos Sintéticos Completos (Mañana)
- [ ] Crear `seed-all-market-data.ts`
- [ ] Implementar lógica de multiplicadores por capítulo/país
- [ ] Ejecutar seed (2500 × 6 rutas × 7 años = ~105k registros)
- [ ] Verificar performance de queries

### Sprint 3: Comtrade Integration (Próxima Semana)
- [ ] Crear servicio `ComtradeHistoricalService`
- [ ] Implementar cola de sincronización
- [ ] Configurar cron job (1 request cada 36 segundos)
- [ ] Dashboard de progreso de sincronización

---

## 🎯 Resultado Esperado

**Cobertura Inmediata:**
- 2500 códigos HS con datos sintéticos realistas
- Gráficos visuales en frontend
- Predicciones científicas para TODOS los productos

**Cobertura a Largo Plazo:**
- Datos reales de Comtrade reemplazando sintéticos gradualmente
- Sistema híbrido: Real donde disponible, Sintético como fallback
- Actualización automática mensual

---

## 💡 Decisión Requerida

**¿Qué implementamos primero?**

**Opción 1 (Recomendado):** 
1. Frontend (Fase B) → Visualización inmediata
2. Datos Sintéticos Completos → Cobertura total hoy
3. Comtrade Background → Mejora gradual

**Opción 2 (Conservador):**
1. Frontend (Fase B)
2. Comtrade para Top 100 productos más consultados
3. Sintéticos para el resto

**Opción 3 (Agresivo):**
1. Datos Sintéticos Completos primero
2. Frontend después
3. Comtrade en paralelo
