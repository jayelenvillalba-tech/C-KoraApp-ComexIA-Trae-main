# INSTRUCCIONES DE CORRECCIÓN - server-sqlite.ts

## Problema
Dejaste el código viejo del endpoint después de la línea que reemplazaste.

## Solución

En `backend/server-sqlite.ts`, línea 203:

### ❌ INCORRECTO (Estado actual):
```typescript
app.get('/api/country-recommendations', handleCountryRecommendations);
  try {
    const { hsCode, originCountry } = req.query;
    // ... todo el código viejo ...
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});
```

### ✅ CORRECTO (Debe quedar así):
```typescript
app.get('/api/country-recommendations', handleCountryRecommendations);
```

## Pasos:

1. Ve a la línea 203 en `server-sqlite.ts`
2. Deja solo: `app.get('/api/country-recommendations', handleCountryRecommendations);`
3. **ELIMINA** desde la línea 204 (`try {`) hasta encontrar el `});` que cierra ese endpoint
   - Busca el patrón: `});` seguido de una línea en blanco o un comentario
   - Probablemente está en la línea ~300-310

## Cómo encontrar el final del bloque a eliminar:

Busca en el archivo esta secuencia:
```typescript
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: error.message });
  }
});  // <-- ELIMINA hasta aquí (inclusive)

// [SIGUIENTE ENDPOINT] <-- CONSERVA desde aquí
```

## Verificación:

Después de eliminar, la línea 203-204 debe verse así:
```typescript
app.get('/api/country-recommendations', handleCountryRecommendations);

// [NEW] Market Analysis Endpoint  <-- O el siguiente comentario/endpoint
```
