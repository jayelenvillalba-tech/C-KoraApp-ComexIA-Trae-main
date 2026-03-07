# 🔴 DIAGNÓSTICO - ERROR DE CONEXIÓN RECHAZADA

## Problema
Estás recibiendo: `ERR_CONNECTION_REFUSED`

Esto significa que **el backend NO está corriendo** en el puerto 3001.

---

## Causas Posibles

### 1. **El servidor backend nunca fue levantado**
   - ¿Ejecutaste `npm run server` en una terminal?
   - ¿Esa terminal sigue abierta?

### 2. **Las dependencias no están instaladas**
   - `mongoose` y `node-cron` no estaban en node_modules
   - El backend falla al iniciar porque no puede importar estos módulos

### 3. **Hay un error al iniciar el backend**
   - Aunque tengas las dependencias, el servidor puede fallar por otro error
   - Revisar la terminal donde ejecutaste `npm run server`

---

## 🔧 SOLUCIÓN - Paso a Paso

### PASO 1: Abre una terminal PowerShell y ejecuta ESTO:

```powershell
cd C:\KoraApp\ComexIA-Trae-main\backend
npm install mongoose node-cron
npm list mongoose node-cron
```

**Esperado:** Deberías ver algo como:
```
comexia-backend@1.0.0 C:\KoraApp\ComexIA-Trae-main\backend
├── mongoose@8.23.0
└── node-cron@3.0.3
```

Si ves esto, las dependencias están OK ✅

Si ves errores, dime cuál es el error exacto.

---

### PASO 2: Una vez que mongoose y node-cron estén instalados, intenta levantar el backend:

```powershell
cd C:\KoraApp\ComexIA-Trae-main
npm run server
```

**Esperado:** Deberías ver:
```
✅ Connected to MongoDB Atlas
⏰ News cron job scheduled (every 12 hours)
🚀 Server running on http://localhost:3001
```

Si ves errores en ROJO, **cópia el error completo** y dime qué dice.

---

### PASO 3: En OTRA terminal, levanta el frontend:

```powershell
cd C:\KoraApp\ComexIA-Trae-main
npm run dev
```

---

## ✅ Verificación

Una vez que ambos servidores estén corriendo:

1. Abre tu navegador
2. Ve a: `http://localhost:5174`
3. Deberías ver la aplicación cargada

---

## 📋 COMANDOS QUE DEBES EJECUTAR AHORA

Copia y pega estos comandos UNO POR UNO en una terminal PowerShell:

```powershell
# 1. Ir a la carpeta del backend
cd C:\KoraApp\ComexIA-Trae-main\backend

# 2. Instalar las dependencias que faltaban
npm install

# 3. Verificar que mongoose está instalado
npm list mongoose

# 4. Ir a la raíz del proyecto
cd ..

# 5. Intentar levantar el servidor
npm run server
```

Luego abre OTRA terminal PowerShell y:

```powershell
# 1. Ir a la raíz del proyecto
cd C:\KoraApp\ComexIA-Trae-main

# 2. Levantar el frontend
npm run dev
```

---

## 🆘 SI ALGUNO FALLA

**Si el backend falla al levantar**, copia TODO el contenido de la terminal (errores en rojo) y pégalos aquí para que pueda ver exactamente qué está pasando.

**Si el frontend falla al levantar**, lo mismo - copia los errores.

---

## 📞 Necesito saber:

1. **¿Ejecutaste alguno de los scripts de instalación que creé?**
   - `INSTALAR_Y_LEVANTAR.bat`
   - `INSTALAR_DEPS.bat`

2. **¿Qué error exacto ves cuando intentas `npm run server`?**
   - Cópia la línea de error en ROJO

3. **¿El navegador muestra el error `ERR_CONNECTION_REFUSED` en qué URL?**
   - ¿`http://localhost:5174`?
   - ¿`http://localhost:3001`?

Responde estas preguntas y puedo ayudarte más eficientemente.
