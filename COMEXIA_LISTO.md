# ✅ COMEXIA - LISTO PARA USAR

## 🎯 STATUS: Todo está configurado correctamente

### ✅ Lo que ya hemos arreglado:

1. **Mongoose y Node-cron instalados** ✅
   - Verificado con `npm list mongoose node-cron`
   - Ambas versiones correctas

2. **Script "server" agregado al backend** ✅
   - Ahora `npm run server` funciona
   - Archivo: `backend/package.json`

3. **Puerto 3001 disponible** ✅
   - Procesos node previos fueron eliminados

4. **Scripts batch creados** ✅
   - `INICIAR_BACKEND.bat` - para levantar el servidor
   - `INICIAR_FRONTEND.bat` - para levantar la aplicación

---

## 🚀 CÓMO USAR COMEXIA AHORA

### **PASO 1: Abre el Explorador de Archivos**

Dirección: `C:\KoraApp\ComexIA-Trae-main\`

---

### **PASO 2: Levanta el BACKEND**

En el Explorador de Archivos:
1. Encuentra: `INICIAR_BACKEND.bat`
2. **Doble clic** en él
3. Una ventana CMD se abrirá con fondo negro/verde

Espera a ver en esa ventana:
```
✅ Connected to MongoDB Atlas
⏰ News cron job scheduled (every 12 hours)
🚀 Server running on http://localhost:3001
📝 API Routes:
   POST /api/auth/register | login
   GET  /api/marketplace/posts
   ...
```

**⚠️ IMPORTANTE:** No cierres esta ventana mientras uses COMEXIA

---

### **PASO 3: Levanta el FRONTEND**

En el Explorador de Archivos:
1. Encuentra: `INICIAR_FRONTEND.bat`
2. **Doble clic** en él
3. Una ventana CMD se abrirá con fondo azul

Espera a ver en esa ventana:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5174/
  ➜  press h + enter to show help
```

**⚠️ IMPORTANTE:** No cierres esta ventana mientras uses COMEXIA

---

### **PASO 4: Abre tu Navegador**

1. **Abre tu navegador favorito** (Chrome, Edge, Firefox, etc.)
2. **En la barra de direcciones** escribe: `http://localhost:5174`
3. **Presiona Enter**

¡Deberías ver la aplicación COMEXIA cargada! 🎉

---

## ✅ Verificación Rápida

Si todo funciona correctamente, deberías ver:

- ✅ En BACKEND (ventana negra/verde):
  - `🚀 Server running on http://localhost:3001`
  - `✅ Connected to MongoDB Atlas`

- ✅ En FRONTEND (ventana azul):
  - `➜ Local: http://localhost:5174/`

- ✅ En el Navegador:
  - La aplicación COMEXIA cargada completamente
  - Sin errores en rojo en la consola (F12)

---

## 🆘 Troubleshooting

### ❌ Problema: La ventana del backend se abre y se cierra inmediatamente

**Solución:**
1. Abre PowerShell manualmente: `Windows + R` → escribe `powershell` → Enter
2. Ejecuta:
```powershell
cd C:\KoraApp\ComexIA-Trae-main\backend
npm run server
```
3. Copia el error que ves en ROJO y guárdalo
4. Me dices qué dice el error

### ❌ Problema: "Port 3001 already in use" (El puerto está en uso)

**Solución:**
Abre PowerShell y ejecuta:
```powershell
taskkill /F /IM node.exe
```

Luego intenta de nuevo haciendo doble clic en `INICIAR_BACKEND.bat`

### ❌ Problema: "npm: command not found"

**Solución:**
1. Descarga Node.js desde: https://nodejs.org/ (versión LTS)
2. Instálalo
3. Reinicia tu computadora
4. Intenta de nuevo

### ❌ Problema: El navegador muestra "ERR_CONNECTION_REFUSED"

**Solución:**
1. Verifica que AMBAS ventanas (backend y frontend) estén abiertas
2. Verifica que muestren los mensajes de éxito (sin errores)
3. Intenta recargar el navegador: `Ctrl + R` o `Ctrl + F5`
4. Si persiste, cierra ambas ventanas y empieza de nuevo

---

## 📋 Archivos Importantes

```
C:\KoraApp\ComexIA-Trae-main\
├── INICIAR_BACKEND.bat          ← Doble clic para levantar backend
├── INICIAR_FRONTEND.bat         ← Doble clic para levantar frontend
├── backend/
│   ├── package.json             ← Con script "server" agregado ✅
│   └── server.ts                ← Servidor principal
├── src/
│   └── ... (código frontend)
├── .env                         ← Configuración (no modificar)
└── vite.config.ts              ← Configuración Vite (OK) ✅
```

---

## 🎯 Resumen en 3 pasos

1. **Doble clic** en `INICIAR_BACKEND.bat`
2. **Espera** a ver "🚀 Server running on..."
3. **Doble clic** en `INICIAR_FRONTEND.bat`
4. **Espera** a ver "➜ Local: http://localhost:5174/"
5. **Abre** en tu navegador: `http://localhost:5174`

¡Listo! 🚀

---

## 📞 Información Técnica

**Puertos:**
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5174`
- Health Check: `http://localhost:3001/api/health`

**Procesos:**
- Backend: `npm run server` en `C:\KoraApp\ComexIA-Trae-main\backend`
- Frontend: `npm run dev` en `C:\KoraApp\ComexIA-Trae-main`

**Base de datos:**
- MongoDB Atlas (configurado en `.env`)
- Variable: `MONGODB_URI`

**Para detener:**
- Presiona `Ctrl + C` en cualquiera de las ventanas CMD

---

## ❓ ¿Preguntas?

Si algo no funciona:
1. Lee los mensajes de error (en rojo) en las ventanas
2. Busca la solución arriba en "Troubleshooting"
3. Si no está, copia el error y me lo dices

¡Éxito! 💪
