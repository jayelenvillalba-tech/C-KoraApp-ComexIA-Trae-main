# Che.Comex | Plataforma B2B Inteligente

Bienvenido al repositorio principal de **Che.Comex**, la plataforma de inteligencia comercial internacional, análisis de rutas y marketplace B2B para PyMEs exportadoras.

## 🚀 Inicio Rápido

### Prerrequisitos
- Node.js 20+
- npm (Node Package Manager)

### Instalación
```powershell
npm install
```

### Iniciar en Desarrollo
Para correr la plataforma en tu entorno local (incluye Backend + Frontend usando Vite):

```powershell
npm run dev
```

La aplicación estará disponible en: **http://localhost:5000** (Vite Server)

### Iniciar en Producción (Build)
Para compilar la aplicación y correrla con el backend Node.js integrado:

```powershell
npm run build
npm run start
```

## 🗂️ Arquitectura del Proyecto

El proyecto sigue una arquitectura monolítica (Backend Express + Frontend React) optimizada para despliegues sencillos y alta performance.

```
ComexIA-Trae-main/
├── backend/          # Servidor Express, Rutas y Lógica de Negocio
├── database/         # Migraciones, Seeds y Utilidades de BD
├── public/           # Archivos Estáticos (Modelos 3D, Texturas, etc.)
├── src/              # Código fuente Frontend (React)
│   ├── components/   # Componentes Reutilizables y de UI (Shadcn)
│   ├── config/       # Configuraciones (Feature Flags)
│   ├── context/      # Contextos Globales (User, GodMode, Marketplace)
│   ├── hooks/        # Custom Hooks
│   ├── lib/          # Utilidades (QueryClient, Tailwind Merge)
│   └── pages/        # Vistas y Rutas de la Aplicación
└── package.json      # Dependencias y Scripts
```

## 🛠️ Tecnologías Principales

- **Frontend:** React 18, Vite, Wouter (Routing), TanStack Query
- **Estilos:** TailwindCSS, Vanilla CSS (Tokens), Shadcn/UI
- **3D & Visualización:** Three.js, React Three Fiber, Pigeon Maps
- **Backend:** Node.js, Express, Better-SQLite3 (o PostgreSQL)
- **Calidad de Código:** TypeScript, Error Boundaries Globales

## ⚙️ Feature Flags

Se pueden habilitar o deshabilitar funcionalidades experimentales modificando el archivo `src/config/features.ts`.
- `ENABLE_3D_GLOBE`: (boolean) Controla la renderización del globo 3D.
- `ENABLE_GOD_MODE_ORB`: (boolean) Activa el orbe de IA flotante.

## 🐛 Solución de Problemas

**Puerto en uso (5000 o 3000):**
Asegúrate de no tener otro proceso de Node corriendo. Puedes matarlo usando el Administrador de Tareas o ejecutando en PowerShell:
`Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`

**Errores no controlados:**
La aplicación cuenta con un `ErrorBoundary` global. Si el sistema colapsa, te presentará una pantalla de error amigable. Revisa la consola de tu navegador o el terminal del servidor para ver los detalles técnicos (solo disponibles en `NODE_ENV='development'`).

---
© 2026 Che.Comex — ComexIA. Todos los derechos reservados.
