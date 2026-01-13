# Plan Estratégico ComexIA - Corto Plazo

## 🎯 Situación Actual

**✅ Lo que funciona:**
- Frontend carga correctamente
- Backend está operativo con JSON storage
- Estructura de datos completa (países, tratados, coordenadas)
- UI base implementada con componentes modernos

**❌ Lo que falta:**
- **Datos reales**: El sistema no tiene productos HS ni empresas
- **APIs funcionales**: Los endpoints no devuelven datos reales
- **Búsqueda HS**: No hay base de datos de códigos HS
- **Análisis IA**: No hay integración con IA para recomendaciones
- **Empresas**: No hay datos de importadores/exportadores

---

## 🚀 Plan Estratégico - Fase 1 (Corto Plazo)

### **Prioridad 1: Datos Fundamentales (1-2 días)**

#### 1.1 Base de Datos de Códigos HS
**Objetivo**: Permitir búsquedas reales de productos

**Acciones:**
- [ ] Crear archivo `hs-codes-database.ts` con códigos HS más comunes
- [ ] Implementar al menos 100-200 códigos HS prioritarios:
  - Sección I: Animales vivos y productos del reino animal
  - Sección II: Productos del reino vegetal (soja, café, frutas)
  - Sección V: Productos minerales (petróleo, gas, minerales)
  - Sección XV: Metales comunes y manufacturas
  - Sección XVI: Máquinas y aparatos
- [ ] Incluir descripciones en español e inglés
- [ ] Agregar aranceles base por país

**Resultado esperado**: El buscador de códigos HS devuelve resultados reales

---

#### 1.2 Base de Datos de Empresas Demo
**Objetivo**: Mostrar empresas reales cuando se busca un producto

**Acciones:**
- [ ] Crear `companies-database.ts` con 50-100 empresas demo
- [ ] Incluir empresas de países clave: BR, AR, CL, US, CN, DE
- [ ] Datos por empresa:
  - Nombre, país, tipo (importador/exportador)
  - Productos que manejan (códigos HS)
  - Contacto simulado
  - Calificación crediticia
- [ ] Implementar API `/api/companies` para devolver datos filtrados

**Resultado esperado**: Al buscar un producto, se muestran empresas relevantes

---

### **Prioridad 2: APIs Funcionales (1 día)**

#### 2.1 API de Búsqueda de Códigos HS
**Endpoint**: `GET /api/hs-codes/search?q=cafe`

**Implementación:**
```typescript
// Búsqueda por texto, código o descripción
// Devuelve: código, descripción, arancel base, sección
```

#### 2.2 API de Recomendaciones de Países
**Endpoint**: `GET /api/country-recommendations?hsCode=0901&operation=export&originCountry=BR`

**Implementación:**
```typescript
// Lógica basada en:
// 1. Tratados comerciales (reducción arancelaria)
// 2. Distancia geográfica
// 3. Volumen de comercio histórico (simulado)
// 4. Especialización del país en ese producto
```

#### 2.3 API de Empresas
**Endpoint**: `GET /api/companies?country=AR&type=exporter&hsCode=0901`

**Implementación:**
```typescript
// Filtrar empresas por:
// - País
// - Tipo (importador/exportador)
// - Productos que manejan
```

---

### **Prioridad 3: Funcionalidad IA Básica (1-2 días)**

#### 3.1 Motor de Recomendaciones Inteligente
**Sin necesidad de API externa inicialmente**

**Algoritmo de scoring:**
```typescript
score = (
  tratadosComerciales * 0.4 +      // 40% peso
  distanciaGeografica * 0.2 +      // 20% peso
  especializacionPais * 0.3 +      // 30% peso
  volumenComercial * 0.1           // 10% peso
)
```

**Ventajas:**
- Oportunidad: high/medium/low basado en score
- Beneficios de tratados calculados
- Restricciones identificadas
- Tiempo estimado de envío

---

### **Prioridad 4: Mejoras UX (1 día)**

#### 4.1 Flujo de Usuario Completo
- [ ] Home → Búsqueda HS → Resultados → Selección País → Empresas
- [ ] Agregar loading states reales
- [ ] Mensajes de error informativos
- [ ] Tooltips explicativos

#### 4.2 Visualización de Datos
- [ ] Gráficos de aranceles por país
- [ ] Mapa interactivo con rutas comerciales
- [ ] Comparación de países lado a lado

---

## 📊 Roadmap de Implementación

### **Semana 1: MVP Funcional**
```
Día 1-2: Base de datos HS + Empresas
Día 3: APIs funcionales
Día 4: Motor de recomendaciones
Día 5: Testing y ajustes UX
```

### **Semana 2: Refinamiento**
```
Día 1-2: Agregar más códigos HS (500+)
Día 3: Mejorar algoritmo de recomendaciones
Día 4: Integración con IA real (opcional)
Día 5: Documentación y deployment
```

---

## 🎯 Métricas de Éxito

**MVP Funcional cuando:**
- ✅ Usuario puede buscar 100+ productos HS
- ✅ Sistema recomienda 5-10 países por producto
- ✅ Se muestran 10+ empresas relevantes por búsqueda
- ✅ Cálculo de aranceles es preciso
- ✅ Mapa muestra rutas comerciales

---

## 🔧 Tecnologías a Usar

### **Datos:**
- JSON files (corto plazo)
- PostgreSQL (largo plazo)

### **IA (Futuro):**
- OpenAI API para análisis de mercado
- Gemini API para insights comerciales
- APIs gubernamentales para datos reales

### **Visualización:**
- Recharts para gráficos
- Pigeon Maps para mapas (ya implementado)
- Framer Motion para animaciones

---

## 💡 Próximos Pasos Inmediatos

### **Opción A: Enfoque Rápido (Recomendado)**
1. Crear base de datos HS con 50 productos más comunes
2. Crear 20 empresas demo
3. Implementar APIs básicas
4. **Resultado**: Demo funcional en 1-2 días

### **Opción B: Enfoque Completo**
1. Importar base de datos HS completa (6000+ códigos)
2. Integrar con APIs gubernamentales reales
3. Implementar IA avanzada
4. **Resultado**: Sistema completo en 1-2 semanas

---

## 🎨 Propuesta de Valor Única

**ComexIA se diferencia por:**
1. **IA Predictiva**: No solo muestra datos, predice oportunidades
2. **Análisis de Tratados**: Calcula ahorros reales por acuerdos comerciales
3. **Conexión Directa**: Encuentra empresas verificadas
4. **Visualización Geográfica**: Mapas interactivos de rutas comerciales
5. **Análisis Continental**: Insights por región/bloque comercial

---

## 📝 Decisión Requerida

**¿Qué enfoque prefieres?**

**A) MVP Rápido** (1-2 días)
- 50 códigos HS
- 20 empresas demo
- Algoritmo básico
- ✅ Demo funcional rápido

**B) Sistema Completo** (1-2 semanas)
- 6000+ códigos HS
- APIs gubernamentales
- IA avanzada
- ✅ Producto production-ready

**C) Híbrido** (3-5 días)
- 200 códigos HS prioritarios
- 50 empresas demo
- Algoritmo mejorado
- ✅ Balance entre velocidad y calidad
