# 🔧 Plan para Arreglar 8 Tests Restantes

## 📊 Estado Actual: 15/23 (65.2%)
## 🎯 Objetivo: 23/23 (100%)

---

## ❌ Tests que Fallan

### 1. Database - Companies Count (FÁCIL)
**Error**: Solo 2 empresas, esperadas 50
**Solución**: Crear seed simple con schema correcto
**Tiempo**: 15 minutos
**Prioridad**: ALTA

### 2. HS Codes - Search Functionality (MEDIO)
**Error**: No retorna resultados
**Causa**: `sqliteDb` undefined en búsqueda
**Solución**: Usar `db` de drizzle en lugar de `sqliteDb`
**Tiempo**: 10 minutos
**Prioridad**: ALTA

### 3. Companies - List Companies (FÁCIL)
**Error**: Retorna array vacío
**Causa**: Problema con query o filtros
**Solución**: Revisar endpoint `/api/companies`
**Tiempo**: 5 minutos
**Prioridad**: MEDIA

### 4-5. Chat - List/Create Conversations (MEDIO)
**Error**: Endpoints fallan
**Causa**: Problema de autenticación o DB
**Solución**: Verificar endpoints y auth
**Tiempo**: 20 minutos
**Prioridad**: MEDIA

### 6. Billing - Checkout Endpoint (FÁCIL)
**Error**: Endpoint falla
**Causa**: Requiere autenticación
**Solución**: Ajustar test o endpoint
**Tiempo**: 10 minutos
**Prioridad**: BAJA

### 7. Verifications - List Verifications (FÁCIL)
**Error**: Endpoint falla
**Causa**: Problema de autenticación admin
**Solución**: Verificar endpoint
**Tiempo**: 10 minutos
**Prioridad**: MEDIA

### 8. Cost Calculator - Calculate Costs (MEDIO)
**Error**: Endpoint falla
**Causa**: Problema en implementación
**Solución**: Revisar endpoint `/api/calculate-costs`
**Tiempo**: 15 minutos
**Prioridad**: MEDIA

---

## 🚀 Plan de Acción (Orden de Ejecución)

### Fase 1: Datos (30 min)
1. ✅ Crear seed correcto para 48 empresas
2. ✅ Ejecutar seed
3. ✅ Verificar conteo

### Fase 2: Endpoints Críticos (30 min)
4. ✅ Arreglar búsqueda de HS codes
5. ✅ Arreglar listado de empresas
6. ✅ Arreglar cost calculator

### Fase 3: Endpoints Secundarios (30 min)
7. ✅ Arreglar chat conversations
8. ✅ Arreglar billing checkout
9. ✅ Arreglar verifications list

### Fase 4: Verificación (10 min)
10. ✅ Re-ejecutar tests
11. ✅ Verificar 100% pasando
12. ✅ Commit final

---

## 📝 Detalles de Cada Fix

### Fix 1: Seed de 48 Empresas
```typescript
// Usar schema correcto (sin 'city', usar 'companyId' no 'company')
const companies = [];
for (let i = 3; i <= 50; i++) {
  companies.push({
    name: `Empresa ${i}`,
    country: countries[i % countries.length],
    type: types[i % types.length],
    verified: i % 3 === 0,
    contactEmail: `contact${i}@empresa.com`,
    // Solo campos que existen en schema
  });
}
```

### Fix 2: HS Codes Search
```typescript
// En backend/server.ts línea ~173
// Cambiar de sqliteDb.exec() a usar drizzle query
const results = await db.select()
  .from(hsSubpartidas)
  .where(
    or(
      like(hsSubpartidas.code, `%${query}%`),
      like(hsSubpartidas.description, `%${query}%`)
    )
  )
  .limit(limit);
```

### Fix 3: Companies List
```typescript
// Verificar que el endpoint retorne correctamente
// Puede ser problema de limit/offset
```

### Fix 4-5: Chat Conversations
```typescript
// Verificar que los endpoints manejen casos sin auth
// O ajustar tests para incluir auth
```

### Fix 6: Billing Checkout
```typescript
// Hacer que endpoint retorne error 401 correctamente
// O ajustar test para esperar 401
```

### Fix 7: Verifications List
```typescript
// Similar a billing, verificar manejo de auth
```

### Fix 8: Cost Calculator
```typescript
// Verificar que endpoint procese request correctamente
// Revisar estructura de response
```

---

## ⏱️ Tiempo Total Estimado

- **Optimista**: 1 hora
- **Realista**: 1.5 horas
- **Pesimista**: 2 horas

---

## ✅ Criterio de Éxito

- 23/23 tests pasando (100%)
- Todos los endpoints respondiendo correctamente
- Base de datos con 50 empresas
- Búsqueda de HS codes funcionando
- Chat, billing, verifications respondiendo (aunque sea con errores apropiados)

---

*Comenzando arreglos ahora...*
