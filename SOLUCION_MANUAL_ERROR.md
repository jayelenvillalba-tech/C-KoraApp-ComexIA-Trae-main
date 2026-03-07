# 🔴 ERROR: ERR_CONNECTION_REFUSED - SOLUCIÓN MANUAL

## El Problema
Tu navegador muestra: **ERR_CONNECTION_REFUSED**

Esto significa que el backend NO está corriendo en `http://localhost:3001`

---

## Qué debes hacer AHORA MISMO

### PASO 1: Abre PowerShell MANUALMENTE

1. Presiona: `Windows + R`
2. Escribe: `powershell`
3. Presiona: `Enter`

Se abrirá una ventana PowerShell

---

### PASO 2: Ejecuta estos comandos UNO POR UNO

Copia cada línea, pégala en PowerShell y presiona Enter:

```powershell
cd C:\KoraApp\ComexIA-Trae-main\backend
```

Presiona Enter. Luego:

```powershell
npm install
```

Esto puede tardar 1-2 minutos. Espera a que diga "added X packages" o "up to date"

Luego:

```powershell
npm list mongoose node-cron
```

Presiona Enter.

**¿Qué deberías ver?**
```
comexia-backend@1.0.0
├── mongoose@8.23.0
├── node-cron@3.0.3
└── ... otras dependencias
```

Si ves esto, ✅ está correcto.

---

### PASO 3: Levantar el Backend

En la MISMA ventana PowerShell, ejecuta:

```powershell
cd ..
npm run server
```

Presiona Enter.

**¿Qué deberías ver?**
```
✅ Connected to MongoDB Atlas
⏰ News cron job scheduled (every 12 hours)
🚀 Server running on http://localhost:3001
📝 API Routes:
   POST /api/auth/register | login
   GET  /api/marketplace/posts
   ...
```

Si ves esto, ✅ **El backend está OK.**

**Si ves errores en ROJO:**
- Captura una foto o cópia exactamente qué dice
- Ese error es lo que necesito para ayudarte

---

### PASO 4: Abre OTRA ventana PowerShell

1. Presiona: `Windows + R`
2. Escribe: `powershell`
3. Presiona: `Enter`

Se abrirá una SEGUNDA ventana PowerShell

---

### PASO 5: En esta SEGUNDA ventana, ejecuta:

```powershell
cd C:\KoraApp\ComexIA-Trae-main
npm run dev
```

Presiona Enter.

**¿Qué deberías ver?**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5174/
  ➜  press h + enter to show help
```

Si ves esto, ✅ **El frontend está OK.**

---

### PASO 6: Abre tu Navegador

1. Abre tu navegador favorito (Chrome, Edge, Firefox)
2. En la barra de direcciones, escribe: `http://localhost:5174`
3. Presiona Enter

**¿Qué deberías ver?**
- La aplicación ComexIA cargada
- SIN errores en la consola (F12)

Si ves esto, ✅ **¡TODO FUNCIONA!**

---

## 🆘 Si Algo Sale Mal

### Escenario 1: "npm: command not found"
**Significa:** Node.js no está instalado o npm no está en el PATH

Solución:
1. Descarga Node.js desde: https://nodejs.org/ (versión LTS)
2. Instálalo
3. Abre una NUEVA ventana PowerShell
4. Intenta de nuevo

### Escenario 2: Errores al ejecutar `npm install`
**Significa:** Hay un problema con npm o package.json

Solución:
```powershell
npm cache clean --force
rm -Force package-lock.json (si existe)
npm install
```

### Escenario 3: El backend falla al levantar
**Significa:** Hay un error en el código o en las dependencias

Solución:
1. Cópia EXACTAMENTE el error que ves en rojo
2. Pégalo en tu siguiente mensaje
3. Te ayudaré a solucionarlo

### Escenario 4: El frontend se queda con un error de puerto
**Significa:** El puerto 5174 ya está en uso

Solución:
```powershell
# Mata todos los procesos node
Stop-Process -Name node -Force -ErrorAction SilentlyContinue

# Intenta de nuevo
npm run dev
```

---

## 📋 RESUMEN RÁPIDO

**Ventana 1 (Backend):**
```
cd C:\KoraApp\ComexIA-Trae-main\backend
npm install
cd ..
npm run server
```

**Ventana 2 (Frontend):**
```
cd C:\KoraApp\ComexIA-Trae-main
npm run dev
```

**Navegador:**
```
http://localhost:5174
```

---

## ❓ Información que Necesito

Por favor, dime:

1. **¿Ejecutaste `npm install` en el backend?** (SÍ / NO)
2. **¿Qué error ves exactamente al ejecutar `npm run server`?** (cópia el texto rojo)
3. **¿Qué versión de Node tienes?** (ejecuta `node --version`)
4. **¿Qué versión de npm tienes?** (ejecuta `npm --version`)

Con esta información podré ayudarte mejor.

---

## 🎯 Objetivo

- ✅ Backend corriendo en `http://localhost:3001`
- ✅ Frontend corriendo en `http://localhost:5174`
- ✅ Aplicación cargando en el navegador
- ✅ Sin errores de `ERR_CONNECTION_REFUSED`

¡Haz esto y me dices qué pasa! 💪
