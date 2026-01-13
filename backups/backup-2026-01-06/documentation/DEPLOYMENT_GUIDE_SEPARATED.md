# 🚀 Guía de Despliegue Separado (Backend + Frontend)

## 📋 Resumen

Esta guía te ayudará a desplegar tu aplicación ComexIA en dos partes:
- **Backend (API):** Railway
- **Frontend (Web):** Vercel

Todo está pre-configurado. Solo necesitas seguir los pasos.

---

## 🔧 PARTE 1: Desplegar el Backend en Railway

### Paso 1: Crear el servicio en Railway

1. Ve a https://railway.app
2. Click en **"Start a New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige el repositorio **`Che.Comex`**
5. Railway detectará automáticamente el proyecto

### Paso 2: Configurar Variables de Entorno

En Railway, ve a la pestaña **"Variables"** y agrega estas 3 variables:

```
NODE_ENV=production
```

```
TURSO_DATABASE_URL=libsql://checomex-jayelenvillalba-tech.aws-ap-south-1.turso.io
```

```
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjY2MTA3MTgsImlkIjoiYTEzMDJlMzYtZmYxMC00MjlmLTg3NjUtZDE2MWJiYmI5YjU0IiwicmlkIjoiZDU3MGY5YWItZjY4Mi00OWVjLWI5NzYtODY4ZGZjZmQ3NDZjIn0.VJqHdNOnat-1eu5qxXivUVvZYlUbU-gX4nkgJVmygUNxxCjiGhOrKE3t3nb7nFP26aOM8WblJtF_mJI09znwCw
```

### Paso 3: Configurar Build Commands

En Railway, ve a **"Settings"** y configura:

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run start:backend
```

### Paso 4: Deploy

Click en **"Deploy"** y espera a que termine.

**Copia la URL que te da Railway** (algo como `https://che-comex-production.up.railway.app`)

---

## 🌐 PARTE 2: Desplegar el Frontend en Vercel

### Paso 1: Crear el proyecto en Vercel

1. Ve a https://vercel.com
2. Click en **"Add New Project"**
3. Importa el repositorio **`Che.Comex`**

### Paso 2: Configurar el Proyecto

En la pantalla de configuración:

**Framework Preset:** Vite

**Root Directory:** `.` (dejar por defecto)

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

### Paso 3: Agregar Variable de Entorno

En Vercel, en la sección **"Environment Variables"**, agrega:

**Variable Name:**
```
VITE_API_URL
```

**Value:** (pega aquí la URL de Railway que copiaste antes)
```
https://che-comex-production.up.railway.app
```

### Paso 4: Deploy

Click en **"Deploy"** y espera.

---

## ✅ Verificación

Una vez que ambos deployments terminen:

1. Abre la URL de Vercel (tu frontend)
2. Prueba buscar un código HS (ej: "carne")
3. Si aparecen resultados, ¡FUNCIONÓ! 🎉

---

## 🆘 Si algo falla

**Backend no arranca:**
- Verifica que las 3 variables de entorno estén en Railway
- Revisa los logs en Railway → "Deploy Logs"

**Frontend no se conecta al backend:**
- Verifica que `VITE_API_URL` en Vercel tenga la URL correcta de Railway
- Asegúrate de que la URL NO termine en `/`

---

## 📝 URLs Finales

Después del deploy, tendrás:

- **Frontend:** `https://che-comex.vercel.app`
- **Backend API:** `https://che-comex-production.up.railway.app`

¡Listo! Tu aplicación estará funcionando en producción.
