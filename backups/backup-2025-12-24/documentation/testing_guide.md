# 🧪 Guía de Testing - ComexIA

## 🚀 Cómo Ejecutar los Tests

### Prerequisitos
1. Asegúrate de que el servidor backend esté corriendo:
```bash
npm run server
```

2. En otra terminal, ejecuta los tests:
```bash
npm test
```

## 📋 Tests Incluidos

### 1. Database Tests (8 tests)
- ✅ Inicialización de base de datos
- ✅ Conteo de HS Codes (debe ser ≥ 2,500)
- ✅ Conteo de Empresas (debe ser ≥ 50)
- ✅ Conteo de Usuarios/Empleados (debe ser ≥ 200)
- ✅ Conteo de Publicaciones Marketplace (debe ser ≥ 100)
- ✅ Conteo de Noticias (debe ser ≥ 50)
- ✅ Conteo de Verificaciones (debe ser ≥ 20)
- ✅ Conteo de Suscripciones (debe ser ≥ 10)

### 2. API Health Test (1 test)
- ✅ Health check endpoint

### 3. Authentication Tests (2 tests)
- ✅ Registro de usuario
- ✅ Login de usuario

### 4. HS Codes Tests (2 tests)
- ✅ Búsqueda de códigos HS
- ✅ Obtener código HS por número

### 5. Companies Tests (2 tests)
- ✅ Listar empresas
- ✅ Obtener perfil de empresa

### 6. Marketplace Tests (2 tests)
- ✅ Listar publicaciones
- ✅ Obtener detalle de publicación

### 7. Chat System Tests (3 tests)
- ✅ Listar conversaciones
- ✅ Crear conversación
- ✅ Enviar mensaje
- ✅ Sugerencias AI

### 8. Billing Tests (1 test)
- ✅ Endpoint de checkout

### 9. Verifications Tests (1 test)
- ✅ Listar verificaciones pendientes

### 10. News Tests (1 test)
- ✅ Obtener artículos de noticias

### 11. Cost Calculator Tests (1 test)
- ✅ Calcular costos de importación/exportación

## 📊 Interpretación de Resultados

### Resultado Exitoso
```
🎯 OVERALL: 23/23 tests passed (100.0%)
🎉 ALL TESTS PASSED! System is ready for backup and deployment.
```

### Resultado con Fallos
```
🎯 OVERALL: 20/23 tests passed (87.0%)
⚠️  3 tests failed. Review failures before proceeding.

Failed tests:
  ❌ [Chat] Create conversation: Connection refused
  ❌ [Billing] Checkout endpoint: Unauthorized
```

## 🔧 Solución de Problemas

### Error: "Connection refused"
- **Causa**: El servidor backend no está corriendo
- **Solución**: Ejecuta `npm run server` en otra terminal

### Error: "Database not found"
- **Causa**: Base de datos no inicializada
- **Solución**: Ejecuta `npx tsx database/seeds/seed-complete-final.ts`

### Error: "Unauthorized"
- **Causa**: Endpoint requiere autenticación
- **Solución**: Normal para algunos endpoints protegidos

### Error: "No results found"
- **Causa**: Base de datos vacía
- **Solución**: Ejecuta todos los seeds:
```bash
npx tsx database/migrations/add-verifications-table.ts
npx tsx database/migrations/add-news-table.ts
npx tsx database/seeds/seed-complete-final.ts
```

## 📁 Archivos Generados

### `test-results-YYYY-MM-DD.json`
Contiene resultados detallados de todos los tests en formato JSON:
```json
{
  "timestamp": "2024-12-24T15:00:00.000Z",
  "summary": {
    "total": 23,
    "passed": 23,
    "failed": 0,
    "percentage": "100.0"
  },
  "results": [...]
}
```

## 🎯 Criterios de Éxito

Para considerar el sistema listo para backup y deployment:

- ✅ **100% de tests de base de datos** deben pasar
- ✅ **Al menos 90% de tests de API** deben pasar
- ✅ **Todos los tests críticos** deben pasar:
  - Health check
  - HS Codes search
  - Marketplace list
  - Chat creation
  - Database integrity

## 🚀 Próximos Pasos

Si todos los tests pasan:

1. ✅ Ejecutar backup completo:
```bash
npm run backup
```

2. ✅ Crear Git tag:
```bash
git tag -a v1.0.0-stable -m "Stable version - all tests passing"
git push origin v1.0.0-stable
```

3. ✅ Proceder con deployment a Vercel

## 📝 Notas

- Los tests se ejecutan contra `http://localhost:3000`
- Algunos tests crean datos temporales (usuario de prueba, conversación de prueba)
- Los resultados se guardan automáticamente en archivo JSON
- Ejecuta `npm run audit` para ver estadísticas de la base de datos
