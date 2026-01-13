# Interactive Map Upgrade: Global Trade Visualization

## 🎯 Objetivo
Transformar el mapa básico actual en una **plataforma de visualización de comercio global** con rutas animadas, heat maps, y datos en tiempo real.

---

## 🗺️ Tecnología Seleccionada: **Leaflet + D3.js**

### Por qué Leaflet?
- ✅ Open source (sin costos de API como Mapbox)
- ✅ Ligero (~40KB)
- ✅ Excelente para overlays personalizados
- ✅ Compatible con D3 para visualizaciones avanzadas

### Por qué D3.js?
- ✅ Control total sobre animaciones
- ✅ Ideal para flujos de datos (arcos, líneas)
- ✅ Renderizado SVG de alta performance

---

## 📊 Capas del Mapa (Layers)

### Layer 1: Base Map
- **Tile Provider:** CartoDB Dark Matter (tema oscuro profesional)
- **Estilo:** Minimalista para destacar datos

### Layer 2: Trade Routes (Rutas Comerciales)
**Características:**
- Líneas curvas (arcos geodésicos) entre países
- Grosor proporcional al volumen de comercio
- Color según tipo de producto (capítulo HS)
- Animación de "flujo" (partículas moviéndose)

**Implementación:**
```javascript
// Usar Leaflet.curve para arcos
L.curve([
  'M', [lat1, lng1],
  'Q', [latMid, lngMid], // Control point
  [lat2, lng2]
], {
  color: getProductColor(hsChapter),
  weight: getVolumeWeight(tradeValue),
  animate: true
})
```

### Layer 3: Heat Map (Mapa de Calor)
**Muestra:** Intensidad de comercio por región
- **Librería:** Leaflet.heat
- **Datos:** Agregación de valueUsd por país
- **Gradiente:** Azul (bajo) → Cyan → Verde → Amarillo → Rojo (alto)

### Layer 4: Ports & Hubs (Puertos Principales)
**Datos:** Top 100 puertos mundiales
- **Marcadores:** Círculos pulsantes
- **Tamaño:** Proporcional a throughput (TEUs)
- **Tooltip:** Nombre, país, volumen anual

**Fuente de Datos:**
```typescript
const MAJOR_PORTS = [
  { name: 'Shanghai', country: 'CN', lat: 31.2, lng: 121.5, teus: 47_000_000 },
  { name: 'Singapore', country: 'SG', lat: 1.29, lng: 103.85, teus: 37_000_000 },
  { name: 'Ningbo-Zhoushan', country: 'CN', lat: 29.87, lng: 121.55, teus: 31_000_000 },
  // ... 97 more
];
```

### Layer 5: Sanctions Zones (Zonas de Sanción)
**Muestra:** Países/regiones con restricciones comerciales
- **Estilo:** Overlay rojo semi-transparente
- **Datos:** Tabla `sanctions_list`
- **Interacción:** Click para ver detalles de sanciones

---

## 🎨 Controles Interactivos

### Panel de Filtros
```
┌─────────────────────────────┐
│ 📦 Producto: [Dropdown]     │
│ 📅 Año: [Slider 2018-2024]  │
│ 🌍 Región: [Multi-select]   │
│ 🔍 Tipo: [Routes/Heat/Both] │
└─────────────────────────────┘
```

### Timeline Animation
- **Play/Pause:** Animación año por año
- **Speed Control:** 1x, 2x, 5x
- **Scrubber:** Arrastrar para navegar

### Legend (Leyenda)
- Colores por capítulo HS
- Escala de volumen (grosor de líneas)
- Escala de heat map

---

## 🚀 Implementación Técnica

### Estructura de Archivos
```
src/components/map/
├── interactive-map.tsx          # Componente principal
├── layers/
│   ├── trade-routes-layer.tsx   # Rutas animadas
│   ├── heat-map-layer.tsx       # Mapa de calor
│   ├── ports-layer.tsx          # Puertos
│   └── sanctions-layer.tsx      # Sanciones
├── controls/
│   ├── filter-panel.tsx         # Filtros
│   ├── timeline-control.tsx     # Timeline
│   └── legend.tsx               # Leyenda
└── utils/
    ├── geo-utils.ts             # Cálculos geodésicos
    └── color-scales.ts          # Escalas de color
```

### Endpoint de Datos
**Nuevo:** `GET /api/map/trade-flows`

**Query Params:**
- `year`: 2018-2024
- `hsChapter`: 01-97 (opcional)
- `minValue`: Filtro de valor mínimo

**Response:**
```json
{
  "routes": [
    {
      "origin": { "code": "AR", "lat": -34.6, "lng": -58.4 },
      "destination": { "code": "CN", "lat": 39.9, "lng": 116.4 },
      "valueUsd": 87000000,
      "volume": 43500000,
      "hsChapter": "02",
      "productName": "Carne"
    }
  ],
  "heatmap": {
    "CN": 2500000000,
    "US": 1800000000,
    "BR": 950000000
  }
}
```

---

## 📈 Optimización de Performance

### 1. Data Aggregation (Backend)
- Pre-agregar datos por año/capítulo
- Cachear resultados (Redis o in-memory)

### 2. Canvas Rendering (Frontend)
- Usar Leaflet.Canvas para >1000 rutas
- Throttle de animaciones (requestAnimationFrame)

### 3. Lazy Loading
- Cargar capas bajo demanda
- Descargar datos solo para viewport visible

---

## 🎯 Milestones

### Sprint 1: Base (Hoy)
- [x] Seleccionar tecnología (Leaflet + D3)
- [ ] Crear componente InteractiveMap
- [ ] Integrar mapa base (CartoDB)
- [ ] Endpoint /api/map/trade-flows

### Sprint 2: Rutas (Mañana)
- [ ] Implementar TradeRoutesLayer
- [ ] Animación de flujo
- [ ] Filtros básicos

### Sprint 3: Capas Avanzadas
- [ ] Heat map
- [ ] Puertos
- [ ] Sanciones
- [ ] Timeline

### Sprint 4: Polish
- [ ] Optimización de performance
- [ ] Tooltips interactivos
- [ ] Exportar imagen/video

---

## 💡 Inspiración Visual
- **Windyty:** Animaciones de flujo
- **FlightRadar24:** Rutas en tiempo real
- **UN Comtrade Viz:** Heat maps de comercio

**Resultado Esperado:**
Un mapa que cuente la historia del comercio global de forma visual e intuitiva, donde el usuario pueda "ver" cómo fluyen los productos entre continentes.
