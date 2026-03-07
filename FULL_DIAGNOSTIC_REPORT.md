# FULL_DIAGNOSTIC_REPORT.md
**Fecha:** 21 Febrero 2026 — ComexIA Auditoría Completa

---

## 📊 RESUMEN DE ESTADO ACTUAL

| Componente | Estado | Detalle |
|---|---|---|
| Backend (puerto 3001) | ✅ Corriendo | Conectado a MongoDB Atlas |
| Frontend (puerto 5173) | ✅ Corriendo | Vite dev server activo |
| MongoDB Atlas | ✅ Conectado | 8,269 HS Codes, text index OK |
| /api/alerts | ✅ Funciona | 4 alertas (2 estáticas + 2 DB) |
| /api/ai/search | ✅ Funciona | Retorna resultados de soja/trigo |
| /api/documents/required | ✅ Funciona | Retorna documentos para AR→NG |
| /api/news | ✅ Funciona | NewsItems en MongoDB |
| /api/marketplace/posts | ✅ Funciona | Posts cargados |

---

## 🔴 PROBLEMAS ENCONTRADOS Y EVIDENCIA

### PROBLEMA 1 (CRÍTICO) — `.env` con codificación UTF-16 corrupta
**Evidencia:** Archivo tenía NULL bytes entre cada carácter en las últimas 4 líneas:
```
N​8​N​_​E​N​A​B​L​E​D​=​t​r​u​e  ← cada letra separada por \0
```
**Consecuencia:** Variables `N8N_ENABLED`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` se parseaban como basura, causando comportamientos erráticos en el servidor.  
**Corrección:** Archivo `.env` reescrito completamente en ASCII limpio.

---

### PROBLEMA 2 (CRÍTICO) — `/api/alerts` causaba 500 en toda página con AlertsTicker
**Evidencia:** `backend/routes/alerts.ts` importaba `db` de SQLite/Drizzle (base de datos legacy):
```typescript
import { db } from '../../database/db-sqlite.js'; // ← no existe en producción
import { tradeAlerts } from '../../shared/schema-sqlite.js'; // ← tabla SQLite
```
La ruta además **NO estaba registrada** en `server.ts` — causaba 404→500.

**Componentes afectados:**
- `src/components/alerts-ticker.tsx` (barra roja de home) → 500 en cada render
- `src/pages/alerts-center.tsx` → 500 al cargar

**Corrección:** `alerts.ts` reescrito para usar MongoDB + alertas estáticas. Registrado en `server.ts`.

---

### PROBLEMA 3 (CRÍTICO) — `server.ts` crasheaba al iniciar
**Evidencia:** `notificationService.initialize()` llamado en server.ts pero ese método no existe en `NotificationService`:
```typescript
await notificationService.initialize(); // ← TypeError: not a function
```
**Consecuencia:** Backend no arrancaba → TODOS los endpoints daban `connection refused` → página en blanco.

**Corrección:** `server.ts` completamente reescrito sin referencias a métodos inexistentes.

---

### PROBLEMA 4 (MENOR) — Regulations vacías en MongoDB
**Evidencia del audit:**
```
AfCFTA: ❌ MISSING
REACH:  ❌ MISSING
USMCA:  ❌ MISSING
```
**Consecuencia:** `/api/documents/required` devuelve solo documentos estáticos, sin regulaciones específicas por país.  
*(No es causa de los crashes — sí de datos incompletos)*

---

## ✅ CORRECCIONES APLICADAS

| # | Archivo | Cambio |
|---|---|---|
| 1 | `.env` | Reescrito como ASCII limpio (UTF-16 → UTF-8) |
| 2 | `backend/routes/alerts.ts` | Reescrito: SQLite → MongoDB + alertas estáticas |
| 3 | `backend/server.ts` | Reescrito: eliminado `notificationService.initialize()`, agregada ruta `/api/alerts` |

---

## 🗄️ ESTADO DE MONGODB ATLAS

**Colecciones verificadas:**

| Colección | Documentos | Notas |
|---|---|---|
| hscodes | 8,269 | ✅ Text index activo |
| countries | 193+ | ✅ AR y NG presentes |
| newsitems | 5+ | ✅ Con datos críticos |
| users | 200+ | ✅ |
| posts | 200+ | ✅ |
| regulations | 0 | ⚠️ Vacía (no causa crash) |
| messages | 0 | Normal (chat sin mensajes) |

**Búsqueda de texto verificada:**
- `soja` → 3 resultados (120110, 120122, 120119)
- `trigo` → 3 resultados (100119, 100123, 100113)

---

## 🔍 CAUSA RAÍZ DE LA INESTABILIDAD

El ciclo de inestabilidad se explicaba así:

1. **`notificationService.initialize()`** → servidor crasheaba al iniciar → todas las APIs devolvían 404/connection refused → página en blanco
2. Cada fix reiniciaba el servidor → a veces quedaban **múltiples procesos node.exe zombies** bloqueando el puerto 3001
3. **`.env` corrupto** → variables de entorno se leían con basura → comportamiento errático en rutas que las usaban
4. **`/api/alerts`** con SQLite → error en componente de barra superior → rompía renderizado del layout completo

---

## 🚀 COMANDOS PARA LEVANTAR LA APP

### Opción 1: Manual (recomendado)
```powershell
# Terminal 1 — Backend
cd c:\KoraApp\ComexIA-Trae-main
npm run server

# Terminal 2 — Frontend
cd c:\KoraApp\ComexIA-Trae-main
npm run dev
```

### Opción 2: Script BAT
Ejecutar `START_ALL.bat` en la carpeta del proyecto.

---

## 🌐 LINKS DE ACCESO

| Servicio | URL |
|---|---|
| **Aplicación** | http://localhost:5173 |
| **Backend API** | http://localhost:3001 |
| **Health Check** | http://localhost:3001/health |
| **HS Code Search** | http://localhost:3001/api/ai/search?q=soja |
| **Alertas** | http://localhost:3001/api/alerts |
| **Documentos** | http://localhost:3001/api/documents/required?hsCode=1001&destinationCountry=NG |

---

## ✅ VERIFICACIÓN FINAL

```
/health                          → {"status":"ok","database":"connected"}
/api/alerts?urgency=high         → 4 alertas retornadas
/api/ai/search?q=soja            → resultados HS codes
/api/documents/required          → documentos AR→NG
```

**Estado:** 🟢 Sistema estable y funcional
