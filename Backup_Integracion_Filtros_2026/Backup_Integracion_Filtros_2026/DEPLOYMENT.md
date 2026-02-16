# 🚀 Despliegue en Vercel - ComexIA

Este proyecto está configurado para desplegarse fácilmente en Vercel utilizando una arquitectura híbrida:
- **Frontend:** SPA (Single Page Application) servida estáticamente.
- **Backend:** Serverless Function (`/api`) usando Express.
- **Base de Datos:** Turso (LibSQL) en producción (mientras usa SQLite local en desarrollo).

## Prerrequisitos
1. Tener una cuenta en [Vercel](https://vercel.com).
2. Tener el código subido a GitHub.
3. Tener una base de datos en [Turso](https://turso.tech) (ya tienes las credenciales en tu `.env`).

## Pasos para Desplegar

### 1. Subir a GitHub
Asegúrate de hacer commit y push de todos los cambios recientes, incluyendo los nuevos archivos de configuración (`vercel.json`, `api/index.ts`, `database/db.ts`).

### 2. Importar en Vercel
1. Ve a tu Dashboard de Vercel.
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Importa tu repositorio de GitHub `ComexIA-Trae`.

### 3. Configuración del Proyecto
Vercel detectará que es un proyecto Vite.
- **Framework Preset:** Vite (Correcto)
- **Root Directory:** `./` (Correcto)
- **Build Command:** `npm run build` (Correcto)
- **Output Directory:** `dist` (Correcto)

### 4. Variables de Entorno (Environment Variables)
¡IMPORTANTE! Debes agregar las siguientes variables en la sección "Environment Variables" de Vercel (copia los valores desde tu archivo `.env` local):

| Variable | Descripción |
|----------|-------------|
| `TURSO_DATABASE_URL` | URL de tu base de datos Turso (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Token de autenticación de Turso |
| `JWT_SECRET` | Tu secreto para tokens JWT |
| `NODE_ENV` | `production` (Vercel lo pone auto, pero asegúrate) |
| `USE_TURSO` | `true` (Opcional, `server.ts` ya detecta prod host) |

### 5. Deploy
Haz clic en **Deploy**.
Vercel construirá el frontend y configurará las serverless functions automágicamente gracias a `vercel.json` y `api/index.ts`.

## Verificación
Una vez desplegado:
- Visita la URL del proyecto.
- Prueba el Login (debería conectar a Turso).
- Prueba la API directamente: `https://tu-proyecto.vercel.app/api/health`.

---

## 💻 Desarrollo Local (Frontend)
Para trabajar en el frontend mientras el backend corre localmente:

1. Asegúrate de que el backend corre en una terminal:
   ```bash
   npm run server
   ```
2. Abre una NUEVA terminal y corre:
   ```bash
   npm run dev
   ```
3. Abre `http://localhost:5173` en tu navegador.
