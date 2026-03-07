# 🚀 GUÍA RÁPIDA PARA LEVANTAR COMEXIA

## Problema Identificado
Tu proyecto está correctamente configurado pero **le faltaban dependencias instaladas en el backend**:
- ❌ `mongoose` - necesario para conectarse a MongoDB Atlas
- ❌ `node-cron` - necesario para los trabajos programados

## Solución Aplicada
✅ Se agregaron las dependencias al `backend/package.json`
✅ Se creó el script `INSTALAR_Y_LEVANTAR.bat` para automatizar todo

## Paso 1: Ejecutar el Instalador Automático

**Opción A (Recomendado - Más Simple):**
1. Ve a `C:\KoraApp\ComexIA-Trae-main\`
2. Haz **doble clic** en: `INSTALAR_Y_LEVANTAR.bat`
3. Espera a que termine (puede tardar 3-5 minutos)
4. Verás un mensaje diciendo "✓ SETUP COMPLETADO EXITOSAMENTE"
5. Presiona cualquier tecla para cerrar

**Opción B (Manual - Por si la opción A no funciona):**
```powershell
cd C:\KoraApp\ComexIA-Trae-main\backend
npm install

cd C:\KoraApp\ComexIA-Trae-main
npm install
```

## Paso 2: Abrir DOS Ventanas CMD/PowerShell Separadas

**VENTANA 1 - Backend (Puerto 3001):**
```powershell
cd C:\KoraApp\ComexIA-Trae-main
npm run server
```
Deberías ver:
```
✅ Connected to MongoDB Atlas
⏰ News cron job scheduled (every 12 hours)
🚀 Server running on http://localhost:3001
```

**VENTANA 2 - Frontend (Puerto 5174):**
```powershell
cd C:\KoraApp\ComexIA-Trae-main
npm run dev
```
Deberías ver:
```
  VITE v5.x.x
  ➜  Local:   http://localhost:5174/
```

## Paso 3: Verificar que Todo Funciona

1. **Backend está respondiendo:**
   - Abre en el browser: `http://localhost:3001/api/health`
   - Deberías ver un JSON con status "ok"

2. **Frontend está sirviendo:**
   - Abre en el browser: `http://localhost:5174`
   - Deberías ver la aplicación ComexIA

3. **WebSocket está funcionando:**
   - Los errores de WebSocket deberían desaparecer
   - El proxy de Vite está redirigiendo correctamente

## Si Algo Sale Mal

### Error: "mongoose is not defined"
**Solución:** Ejecuta `npm install mongoose node-cron` en `C:\KoraApp\ComexIA-Trae-main\backend`

### Error: "Connection refused on :3001"
**Significa:** El backend NO está corriendo. Verifica la Ventana 1 y busca errores.

### Error: "WebSocket is invalid / undefined"
**Significa:** El backend está levantado pero el frontend cree que lo está en `:5174`. Recarga la página (Ctrl+R).

### Errores de MongoDB
**Significa:** Tu conexión a MongoDB Atlas tiene un problema:
- Verifica que en `.env` esté: `MONGODB_URI=mongodb+srv://...`
- Verifica que tu IP esté en la whitelist de MongoDB Atlas
- Si falla, el backend seguirá funcionando pero sin datos de BD

## Archivos Creados/Modificados

```
✅ backend/package.json        → Agregadas dependencias (mongoose, node-cron)
✅ INSTALAR_Y_LEVANTAR.bat    → Script automático de instalación
✅ SETUP_AND_START.ps1        → Script PowerShell alternativo
✅ .env                         → Ya estaba configurado correctamente
✅ vite.config.ts              → Ya estaba configurado correctamente
```

## Resumido:
1. ✅ Ejecuta `INSTALAR_Y_LEVANTAR.bat` (Doble clic)
2. ✅ Abre 2 ventanas CMD:
   - Ventana 1: `npm run server`
   - Ventana 2: `npm run dev`
3. ✅ Abre `http://localhost:5174`

¡Listo! 🎉
