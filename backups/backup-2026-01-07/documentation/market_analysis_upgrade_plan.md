# Plan de Evolución: Motor de Análisis de Mercado (Predicciones Exactas)

Este plan detalla la estrategia para transformar el módulo de Análisis de Mercado actual (basado en heurísticas simples) en un sistema predictivo robusto impulsado por datos reales e Inteligencia Artificial.

## 1. Arquitectura de Datos (La Verdad Histórica)
Para predecir el futuro, necesitamos conocer el pasado.
- **Nueva Tabla `market_stats`:** Almacenará datos históricos reales.
    - Campos: `hs_code`, `country`, `year`, `month`, `import_value_usd`, `import_volume_kg`.
- **Ingesta de Datos:**
    - Script de carga masiva (Seed) con datos de muestra de UN Comtrade (2018-2024).
    - Integración futura con API de World Bank / Comtrade.

## 2. Motor de Predicción (Algoritmos)
Reemplazaremos los cálculos estáticos por modelos estadísticos:
- **Regresión Lineal (Tendencia):**
    - Usar librería `simple-statistics` o `regression-js`.
    - Calcular la línea de tendencia basada en los últimos 5 años.
- **Detección de Estacionalidad:**
    - Analizar picos mensuales históricos para predecir demanda estacional (ej: juguetes en nov-dic).
- **Ajuste de Confianza:**
    - Calcular el margen de error estándar (R²) para mostrar al usuario la "Confianza de la Predicción" (Alta/Media/Baja).

## 3. Inteligencia Artificial (Análisis Cualitativo)
Los números no cuentan toda la historia. Usaremos IA para el contexto:
- **Análisis de Noticias (RAG):**
    - Buscar noticias recientes sobre "Comercio [Producto] [País]".
    - Detectar eventos disruptivos (huelgas, aranceles, sequías).
- **Evaluación de Riesgos:**
    - La IA leerá los tratados vigentes y alertará sobre cambios regulatorios inminentes.

## 4. Implementación Técnica (Paso a Paso)

### Fase A: Persistencia de Datos
1.  [ ] Crear esquema `market_stats` en SQLite.
2.  [ ] Generar seed con datos sintéticos realistas (curvas de crecimiento, no random).
3.  [ ] Crear endpoint `/api/market-stats/:hsCode/:country` para servir el histórico.

### Fase B: Lógica Predictiva
1.  [ ] Implementar servicio `PredictionEngine`.
2.  [ ] Método `calculateTrend(stats[])` -> Retorna crecimiento % y proyección 2026.
3.  [ ] Método `getSeasonality(stats[])` -> Retorna meses "calientes".

### Fase C: Visualización (Frontend)
1.  [ ] Integrar `Recharts`.
2.  [ ] Gráfico de Línea: Histórico (Sólido) vs Predicción (Punteado).
3.  [ ] Indicador de Confianza (Semáforo).

## 5. Ejemplo de Resultado Esperado
> "Basado en el crecimiento sostenido del 5.2% anual desde 2020 y la reducción de aranceles en 2024, se proyecta una demanda de $15M para el Q3 2026. Confianza: Alta (R² = 0.85)."
